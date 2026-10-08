const db = require('../common/common');

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const idOf = (value, name) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) fail(`${name} không hợp lệ`, 400);
  return id;
};

const orderCode = () =>
  `ORD${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;

const resetWarrantyPeriodFromDelivery = async (connection, orderId) => {
  const [warranties] = await connection.execute(
    `SELECT w.id, DATEDIFF(w.end_date, w.start_date) AS duration_days
     FROM warranties w
     JOIN order_items oi ON oi.id = w.order_item_id
     WHERE oi.order_id = ?
     FOR UPDATE`,
    [orderId],
  );
  if (warranties.length) {
    const [[{ receivedDate }]] = await connection.execute(
      "SELECT DATE_FORMAT(CURRENT_DATE(), '%Y-%m-%d') AS receivedDate",
    );
    for (const warranty of warranties) {
      await connection.execute(
        `UPDATE warranties
         SET start_date = ?, end_date = DATE_ADD(?, INTERVAL ? DAY)
         WHERE id = ?`,
        [receivedDate, receivedDate, warranty.duration_days, warranty.id],
      );
    }
  }

  await connection.execute(
    `INSERT INTO warranties
       (order_item_id, product_variant_id, serial_number, start_date, end_date, status)
     SELECT oi.id, oi.product_variant_id, NULL, CURRENT_DATE(),
            DATE_ADD(CURRENT_DATE(), INTERVAL pv.warranty_months MONTH), 'ACTIVE'
     FROM order_items oi
     JOIN product_variants pv ON pv.id = oi.product_variant_id
     WHERE oi.order_id = ?
       AND pv.warranty_months > 0
       AND NOT EXISTS (
         SELECT 1 FROM warranties existing
         WHERE existing.order_item_id = oi.id
       )`,
    [orderId],
  );

  await connection.execute(
    `UPDATE warranties w
     JOIN order_items oi ON oi.id = w.order_item_id
     SET w.serial_number = CONCAT('SN-', LPAD(w.id, 8, '0'))
     WHERE oi.order_id = ?
       AND (w.serial_number IS NULL OR w.serial_number = '')`,
    [orderId],
  );
};

const SPECIAL_REQUESTS = new Set([
  'AFTER_HOURS',
  'CALL_BEFORE_DELIVERY',
  'CAREFUL_PACKAGING',
  'SMS_ONLY',
  'INSPECT_BEFORE_RECEIVING',
]);
const PAYMENT_METHODS = new Set(['COD', 'BANK_TRANSFER', 'MOMO', 'VNPAY']);
const ORDER_STATUS_LABELS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang chuẩn bị',
  PACKED: 'Đã đóng gói',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  DELIVERY_FAILED: 'Giao thất bại',
};

const validateVoucher = async (
  connection,
  userId,
  code,
  subtotal,
  lock = false,
  items = [],
) => {
  if (!code) return { id: null, code: null, discount: 0 };
  const [rows] = await connection.execute(
    `SELECT * FROM vouchers
     WHERE code = ? AND status = 'ACTIVE'
       AND start_at <= NOW() AND end_at > NOW()
       AND (usage_limit IS NULL OR used_count < usage_limit)
     ${lock ? 'FOR UPDATE' : ''}`,
    [String(code).trim().toUpperCase()],
  );
  const voucher = rows[0];
  if (!voucher) fail('Voucher không tồn tại, hết hạn hoặc đã hết lượt sử dụng', 422);
  if (subtotal < Number(voucher.min_order_value)) {
    fail('Đơn hàng chưa đạt giá trị tối thiểu của voucher', 422);
  }
  const [voucherProducts] = await connection.execute(
    `SELECT product_id FROM voucher_products
     WHERE voucher_id = ? ${lock ? 'FOR UPDATE' : ''}`,
    [voucher.id],
  );
  const eligibleProducts = new Set(
    voucherProducts.map((item) => Number(item.product_id)),
  );
  const eligibleSubtotal = eligibleProducts.size
    ? items.reduce(
        (sum, item) =>
          eligibleProducts.has(Number(item.product_id))
            ? sum + Number(item.subtotal)
            : sum,
        0,
      )
    : subtotal;
  if (eligibleSubtotal <= 0) {
    fail('Voucher không áp dụng cho sản phẩm trong đơn hàng', 422);
  }
  if (voucher.user_usage_limit !== null) {
    const [usageRows] = await connection.execute(
      'SELECT COUNT(*) AS count FROM voucher_usages WHERE voucher_id = ? AND user_id = ?',
      [voucher.id, userId],
    );
    if (Number(usageRows[0].count) >= Number(voucher.user_usage_limit)) {
      fail('Bạn đã sử dụng hết lượt của voucher này', 422);
    }
  }
  let discount =
    voucher.discount_type === 'PERCENT'
      ? (eligibleSubtotal * Number(voucher.discount_value)) / 100
      : Number(voucher.discount_value);
  if (voucher.max_discount !== null) {
    discount = Math.min(discount, Number(voucher.max_discount));
  }
  return {
    id: voucher.id,
    code: voucher.code,
    discount: Math.max(0, Math.min(discount, eligibleSubtotal)),
  };
};

const normalizeCheckout = (body = {}, requireIdempotency = false) => {
  const fulfillmentMethod = body.fulfillmentMethod || 'DELIVERY';
  if (!['DELIVERY', 'PICKUP'].includes(fulfillmentMethod)) {
    fail('fulfillmentMethod không hợp lệ', 400);
  }
  const paymentMethod = body.paymentMethod || 'COD';
  if (!PAYMENT_METHODS.has(paymentMethod)) fail('paymentMethod không hợp lệ', 400);
  const note = body.note == null ? null : String(body.note).trim();
  if (note && note.length > 500) {
    fail('Ghi chú đơn hàng không được vượt quá 500 ký tự', 400);
  }
  const specialRequests = Array.isArray(body.specialRequests)
    ? [...new Set(body.specialRequests)]
    : [];
  if (specialRequests.some((item) => !SPECIAL_REQUESTS.has(item))) {
    fail('Yêu cầu đặc biệt không hợp lệ', 400);
  }
  const idempotencyKey = body.idempotencyKey
    ? String(body.idempotencyKey).trim()
    : null;
  if (
    requireIdempotency &&
    (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 80)
  ) {
    fail('Idempotency-Key phải có từ 8 đến 80 ký tự', 400);
  }
  return {
    ...body,
    fulfillmentMethod,
    paymentMethod,
    note,
    specialRequests,
    idempotencyKey,
  };
};

const getCartItems = async (connection, userId, lock = false) => {
  const [items] = await connection.execute(
    `SELECT ci.id, ci.product_variant_id, pv.product_id, ci.item_type, ci.configuration_json,
            ci.price_adjustment, ci.quantity,
            (pv.price + ci.price_adjustment) AS price, pv.sku,
            pv.variant_name, pv.stock_quantity, p.name AS product_name
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id AND c.user_id = ?
     JOIN product_variants pv ON pv.id = ci.product_variant_id
     JOIN products p ON p.id = pv.product_id
     WHERE c.user_id = ? AND pv.status = 'ACTIVE' AND p.status = 'ACTIVE'
     ${lock ? 'FOR UPDATE' : ''}`,
    [userId, userId],
  );
  if (!items.length) fail('Giỏ hàng đang trống hoặc không có sản phẩm hợp lệ', 422);
  let subtotal = 0;
  for (const item of items) {
    if (Number(item.stock_quantity) < Number(item.quantity)) {
      fail(`Sản phẩm ${item.sku} không đủ tồn kho`, 409);
    }
    item.subtotal = Number(item.price) * Number(item.quantity);
    subtotal += item.subtotal;
  }
  return { items, subtotal };
};

const resolveFulfillment = async (connection, userId, input, subtotal, lock = false) => {
  if (input.fulfillmentMethod === 'PICKUP') {
    const storeId = idOf(input.pickupStoreId, 'pickupStoreId');
    const [storeRows] = await connection.execute(
      `SELECT * FROM stores WHERE id = ? AND status = 'ACTIVE' ${lock ? 'FOR UPDATE' : ''}`,
      [storeId],
    );
    const store = storeRows[0];
    if (!store) fail('Cửa hàng nhận hàng không hợp lệ', 404);
    const recipientName = String(input.recipientName || '').trim();
    const recipientPhone = String(input.recipientPhone || '').replace(/\s/g, '');
    if (!recipientName || recipientName.length > 150) {
      fail('Tên người nhận tại cửa hàng không hợp lệ', 400);
    }
    if (!/^(?:\+84|0)\d{9,10}$/.test(recipientPhone)) {
      fail('Số điện thoại người nhận không hợp lệ', 400);
    }
    return {
      addressId: null,
      pickupStoreId: store.id,
      shippingMethodCode: null,
      shippingFee: 0,
      recipientName,
      recipientPhone,
      deliveryAddress: [store.address_line, store.ward, store.district, store.province]
        .filter(Boolean)
        .join(', '),
      latitude: store.latitude,
      longitude: store.longitude,
      store,
      shippingMethod: null,
    };
  }

  const addressId = idOf(input.addressId, 'addressId');
  const [addressRows] = await connection.execute(
    `SELECT * FROM addresses WHERE id = ? AND user_id = ? ${lock ? 'FOR UPDATE' : ''}`,
    [addressId, userId],
  );
  const address = addressRows[0];
  if (!address) fail('Địa chỉ không tồn tại hoặc không thuộc user', 404);
  const shippingMethodCode = String(input.shippingMethodCode || 'STANDARD').toUpperCase();
  const [methodRows] = await connection.execute(
    `SELECT * FROM shipping_methods WHERE code = ? AND status = 'ACTIVE'
     ${lock ? 'FOR UPDATE' : ''}`,
    [shippingMethodCode],
  );
  const shippingMethod = methodRows[0];
  if (!shippingMethod) fail('Phương thức vận chuyển không hợp lệ', 400);
  const shippingFee =
    shippingMethod.free_shipping_threshold !== null &&
    subtotal >= Number(shippingMethod.free_shipping_threshold)
      ? 0
      : Number(shippingMethod.base_fee);
  return {
    addressId: address.id,
    pickupStoreId: null,
    shippingMethodCode: shippingMethod.code,
    shippingFee,
    recipientName: address.receiver_name,
    recipientPhone: address.receiver_phone,
    deliveryAddress: [address.address_line, address.ward, address.district, address.province]
      .filter(Boolean)
      .join(', '),
    latitude: address.latitude,
    longitude: address.longitude,
    store: null,
    shippingMethod,
  };
};

const options = async () => {
  const [stores] = await db.promise().execute(
    "SELECT * FROM stores WHERE status = 'ACTIVE' ORDER BY province, name",
  );
  const [shippingMethods] = await db.promise().execute(
    "SELECT * FROM shipping_methods WHERE status = 'ACTIVE' ORDER BY sort_order, id",
  );
  return { stores, shippingMethods, specialRequests: [...SPECIAL_REQUESTS] };
};

const quote = async (userId, body) => {
  const input = normalizeCheckout(body);
  const connection = db.promise();
  const { items, subtotal } = await getCartItems(connection, userId);
  const fulfillment = await resolveFulfillment(connection, userId, input, subtotal);
  const voucher = await validateVoucher(
    connection,
    userId,
    input.voucherCode,
    subtotal,
    false,
    items,
  );
  return {
    items,
    subtotal,
    shippingFee: fulfillment.shippingFee,
    discountAmount: voucher.discount,
    totalAmount: subtotal + fulfillment.shippingFee - voucher.discount,
    voucherCode: voucher.code,
    fulfillmentMethod: input.fulfillmentMethod,
    shippingMethod: fulfillment.shippingMethod,
    pickupStore: fulfillment.store,
  };
};

const checkout = async (userId, body) => {
  const input = normalizeCheckout(body, true);
  return db.withTransaction(async (connection) => {
    const [existingRows] = await connection.execute(
      'SELECT id FROM orders WHERE user_id = ? AND idempotency_key = ? LIMIT 1',
      [userId, input.idempotencyKey],
    );
    if (existingRows[0]) {
      return getById(userId, existingRows[0].id, connection);
    }

    const { items, subtotal } = await getCartItems(connection, userId, true);
    const fulfillment = await resolveFulfillment(connection, userId, input, subtotal, true);
    const voucher = await validateVoucher(
      connection,
      userId,
      input.voucherCode,
      subtotal,
      true,
      items,
    );
    const total = subtotal + fulfillment.shippingFee - voucher.discount;
    const [orderResult] = await connection.execute(
      `INSERT INTO orders
       (order_code, order_type, user_id, address_id, fulfillment_method,
        pickup_store_id, shipping_method_code, special_requests,
        delivery_receiver_name,
        delivery_phone, delivery_address, delivery_latitude, delivery_longitude,
        subtotal, shipping_fee, discount_amount, total_amount, voucher_code,
        idempotency_key, note)
       VALUES (?, 'READY_PRODUCT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderCode(),
        userId,
        fulfillment.addressId,
        input.fulfillmentMethod,
        fulfillment.pickupStoreId,
        fulfillment.shippingMethodCode,
        JSON.stringify(input.specialRequests),
        fulfillment.recipientName,
        fulfillment.recipientPhone,
        fulfillment.deliveryAddress,
        fulfillment.latitude,
        fulfillment.longitude,
        subtotal,
        fulfillment.shippingFee,
        voucher.discount,
        total,
        voucher.code,
        input.idempotencyKey,
        input.note,
      ],
    );
    const orderId = orderResult.insertId;
    for (const item of items) {
      await connection.execute(
        `INSERT INTO order_items
         (order_id, product_variant_id, item_type, configuration_json,
          product_name, variant_name, sku, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_variant_id,
          item.item_type,
          item.configuration_json,
          item.product_name,
          item.variant_name,
          item.sku,
          item.price,
          item.quantity,
          item.subtotal,
        ],
      );
      await connection.execute(
        `UPDATE product_variants
         SET stock_quantity = stock_quantity - ?
         WHERE id = ? AND stock_quantity >= ?`,
        [item.quantity, item.product_variant_id, item.quantity],
      );
      await connection.execute(
        `INSERT INTO inventory_transactions
         (product_variant_id, user_id, type, quantity, reference_type, reference_id)
         VALUES (?, ?, 'SALE', ?, 'ORDER', ?)`,
        [item.product_variant_id, userId, -item.quantity, orderId],
      );
    }
    if (voucher.id) {
      await connection.execute(
        'INSERT INTO order_vouchers (order_id, voucher_id, voucher_code, discount_amount) VALUES (?, ?, ?, ?)',
        [orderId, voucher.id, voucher.code, voucher.discount],
      );
      await connection.execute('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?', [voucher.id]);
      await connection.execute(
        'INSERT INTO voucher_usages (voucher_id, user_id, order_id) VALUES (?, ?, ?)',
        [voucher.id, userId, orderId],
      );
    }
    await connection.execute(
      "INSERT INTO payments (order_id, method, status, amount) VALUES (?, ?, 'PENDING', ?)",
      [orderId, input.paymentMethod, total],
    );
    await connection.execute('DELETE ci FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE c.user_id = ?', [userId]);
    return getById(userId, orderId, connection);
  });
};

const getById = async (userId, idValue, connection = db.promise(), role) => {
  const id = idOf(idValue, 'orderId');
  const [rows] = await connection.execute(
    `SELECT o.*, p.id AS payment_id, p.method AS payment_method,
            p.status AS payment_status, p.amount AS payment_amount
     FROM orders o LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.id = ? AND (? IN ('admin', 'staff') OR o.user_id = ?)`,
    [id, role || '', userId],
  );
  if (!rows[0]) fail('Không tìm thấy đơn hàng', 404);
  // JOIN product_variants + products để enrich item với product_id và ảnh
  // — mobile cần product_id để bật nút "Đánh giá" từ OrderDetail mà không
  // cần gọi thêm API.
  const [items] = await connection.execute(
    `SELECT oi.*, pv.product_id,
            COALESCE(
              NULLIF(p.thumbnail_url, ''),
              (
                SELECT pi.image_url
                FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
                LIMIT 1
              )
            ) AS product_thumbnail
     FROM order_items oi
     LEFT JOIN product_variants pv ON pv.id = oi.product_variant_id
     LEFT JOIN products p ON p.id = pv.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [id],
  );
  return { ...rows[0], items };
};

const restoreOrderInventory = async (connection, userId, orderId, reason) => {
  const [items] = await connection.execute(
    'SELECT * FROM order_items WHERE order_id = ?',
    [orderId],
  );
  for (const item of items) {
    if (!item.product_variant_id) continue;
    await connection.execute(
      'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
      [item.quantity, item.product_variant_id],
    );
    await connection.execute(
      `INSERT INTO inventory_transactions
       (product_variant_id, user_id, type, quantity, reference_type, reference_id, note)
       VALUES (?, ?, 'CANCEL', ?, 'ORDER', ?, ?)`,
      [item.product_variant_id, userId, item.quantity, orderId, reason || null],
    );
  }
};

const list = async (userId, role) => {
  const where = role === 'admin' || role === 'staff' ? '' : 'WHERE o.user_id = ?';
  const params = where ? [userId] : [];
  const [rows] = await db.promise().execute(
    `SELECT o.*, p.status AS payment_status
     FROM orders o LEFT JOIN payments p ON p.order_id = o.id
     ${where} ORDER BY o.created_at DESC`,
    params,
  );
  return rows;
};

const cancel = async (userId, idValue, reason) => {
  const id = idOf(idValue, 'orderId');
  return db.withTransaction(async (connection) => {
    const [orders] = await connection.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? FOR UPDATE',
      [id, userId],
    );
    const order = orders[0];
    if (!order) fail('Không tìm thấy đơn hàng', 404);
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      fail('Đơn hàng không còn ở trạng thái được phép hủy', 409);
    }
    await restoreOrderInventory(connection, userId, id, reason);
    await connection.execute(
      "UPDATE orders SET status = 'CANCELLED', cancelled_reason = ? WHERE id = ?",
      [reason || null, id],
    );
    return getById(userId, id, connection);
  });
};

const updateStatus = async (idValue, status, reason) => {
  const id = idOf(idValue, 'orderId');
  const transitions = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['PACKED', 'DELIVERY_FAILED'],
    PACKED: ['SHIPPING'],
    SHIPPING: ['DELIVERED', 'DELIVERY_FAILED'],
    DELIVERED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
    DELIVERY_FAILED: ['SHIPPING', 'CANCELLED'],
  };
  if (!Object.prototype.hasOwnProperty.call(transitions, status)) {
    fail('Trạng thái order không hợp lệ', 400);
  }
  return db.withTransaction(async (connection) => {
    const [rows] = await connection.execute('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);
    const order = rows[0];
    if (!order) fail('Không tìm thấy đơn hàng', 404);
    if (!transitions[order.status].includes(status)) {
      fail('Chuyển trạng thái order không hợp lệ', 409);
    }
    if (status === 'CANCELLED') {
      await restoreOrderInventory(connection, order.user_id, id, reason);
    }
    if (status === 'DELIVERED') {
      await resetWarrantyPeriodFromDelivery(connection, id);
    }
    await connection.execute(
      'UPDATE orders SET status = ?, cancelled_reason = IF(? = \'CANCELLED\', ?, cancelled_reason) WHERE id = ?',
      [status, status, reason || null, id],
    );
    await connection.execute(
      'INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
      [
        order.user_id,
        'Cập nhật đơn hàng',
        `Đơn hàng ${order.order_code}: ${ORDER_STATUS_LABELS[status] || status}`,
        'ORDER_STATUS',
        'ORDER',
        id,
      ],
    );
    return getById(order.user_id, id, connection);
  });
};

const checkoutCustom = async (userId, buildIdValue, body) => {
  if (body.note && String(body.note).length > 500) {
    fail('Ghi chú đơn hàng không được vượt quá 500 ký tự', 400);
  }
  const buildId = idOf(buildIdValue, 'customBuildId');
  const addressId = idOf(body.addressId, 'addressId');
  return db.withTransaction(async (connection) => {
    const [buildRows] = await connection.execute(
      "SELECT * FROM custom_builds WHERE id = ? AND user_id = ? AND status IN ('PENDING', 'DRAFT') FOR UPDATE",
      [buildId, userId],
    );
    if (!buildRows[0]) fail('Custom build không tồn tại hoặc không thể checkout', 404);
    const [addressRows] = await connection.execute(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ? FOR UPDATE',
      [addressId, userId],
    );
    if (!addressRows[0]) fail('Địa chỉ không tồn tại hoặc không thuộc user', 404);
    const [items] = await connection.execute(
      `SELECT cbi.*, pv.stock_quantity, pv.status AS variant_status, p.status AS product_status
       FROM custom_build_items cbi
       JOIN product_variants pv ON pv.id = cbi.product_variant_id
       JOIN products p ON p.id = cbi.product_id
       WHERE cbi.custom_build_id = ? FOR UPDATE`,
      [buildId],
    );
    if (!items.length) fail('Custom build chưa có linh kiện', 422);
    let subtotal = 0;
    for (const item of items) {
      if (item.variant_status !== 'ACTIVE' || item.product_status !== 'ACTIVE' || item.stock_quantity < item.quantity) {
        fail(`Linh kiện ${item.sku || item.product_id} không thể bán`, 409);
      }
      item.subtotal = Number(item.unit_price) * item.quantity;
      subtotal += item.subtotal;
    }
    const voucher = await validateVoucher(
      connection,
      userId,
      body.voucherCode,
      subtotal,
      true,
      items,
    );
    const total = subtotal - voucher.discount;
    const address = addressRows[0];
    const [result] = await connection.execute(
      `INSERT INTO orders
       (order_code, order_type, user_id, address_id, custom_build_id,
        delivery_receiver_name, delivery_phone, delivery_address,
        delivery_latitude, delivery_longitude, subtotal, discount_amount, total_amount, voucher_code, note)
       VALUES (?, 'CUSTOM_BUILD', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderCode(), userId, address.id, buildId, address.receiver_name, address.receiver_phone,
        [address.address_line, address.ward, address.district, address.province].filter(Boolean).join(', '),
        address.latitude, address.longitude, subtotal, voucher.discount, total, voucher.code, body.note || null],
    );
    const orderId = result.insertId;
    for (const item of items) {
      await connection.execute(
        `INSERT INTO order_items
         (order_id, product_variant_id, product_name, variant_name, sku, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_variant_id, item.product_name, item.variant_name || item.component_type,
          item.sku || '', item.unit_price, item.quantity, item.subtotal],
      );
      await connection.execute(
        'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
        [item.quantity, item.product_variant_id, item.quantity],
      );
      await connection.execute(
        `INSERT INTO inventory_transactions (product_variant_id, user_id, type, quantity, reference_type, reference_id)
         VALUES (?, ?, 'SALE', ?, 'ORDER', ?)`,
        [item.product_variant_id, userId, -item.quantity, orderId],
      );
    }
    if (voucher.id) {
      await connection.execute(
        'INSERT INTO order_vouchers (order_id, voucher_id, voucher_code, discount_amount) VALUES (?, ?, ?, ?)',
        [orderId, voucher.id, voucher.code, voucher.discount],
      );
      await connection.execute('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?', [voucher.id]);
      await connection.execute(
        'INSERT INTO voucher_usages (voucher_id, user_id, order_id) VALUES (?, ?, ?)',
        [voucher.id, userId, orderId],
      );
    }
    await connection.execute(
      "INSERT INTO payments (order_id, method, status, amount) VALUES (?, 'COD', 'PENDING', ?)",
      [orderId, total],
    );
    await connection.execute("UPDATE custom_builds SET status = 'CONFIRMED', total_amount = ? WHERE id = ?", [total, buildId]);
    return getById(userId, orderId, connection);
  });
};

module.exports = {
  options,
  quote,
  checkout,
  checkoutCustom,
  getById,
  list,
  cancel,
  updateStatus,
  fail,
  idOf,
};
