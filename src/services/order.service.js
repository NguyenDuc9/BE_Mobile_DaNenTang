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

const validateVoucher = async (connection, code, subtotal) => {
  if (!code) return { id: null, code: null, discount: 0 };
  const [rows] = await connection.execute(
    `SELECT * FROM vouchers
     WHERE code = ? AND status = 'ACTIVE'
       AND start_at <= NOW() AND end_at > NOW()
       AND (usage_limit IS NULL OR used_count < usage_limit)
     FOR UPDATE`,
    [String(code).trim().toUpperCase()],
  );
  const voucher = rows[0];
  if (!voucher) fail('Voucher không tồn tại, hết hạn hoặc đã hết lượt sử dụng', 422);
  if (subtotal < Number(voucher.min_order_value)) {
    fail('Đơn hàng chưa đạt giá trị tối thiểu của voucher', 422);
  }
  let discount =
    voucher.discount_type === 'PERCENT'
      ? (subtotal * Number(voucher.discount_value)) / 100
      : Number(voucher.discount_value);
  if (voucher.max_discount !== null) {
    discount = Math.min(discount, Number(voucher.max_discount));
  }
  return {
    id: voucher.id,
    code: voucher.code,
    discount: Math.max(0, Math.min(discount, subtotal)),
  };
};

const checkout = async (userId, body) => {
  const addressId = idOf(body.addressId, 'addressId');
  return db.withTransaction(async (connection) => {
    const [addressRows] = await connection.execute(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ? FOR UPDATE',
      [addressId, userId],
    );
    const address = addressRows[0];
    if (!address) fail('Địa chỉ không tồn tại hoặc không thuộc user', 404);

    const [items] = await connection.execute(
      `SELECT ci.id, ci.product_variant_id, ci.quantity, pv.price, pv.sku,
              pv.variant_name, pv.stock_quantity, p.name AS product_name
       FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id AND c.user_id = ?
       JOIN product_variants pv ON pv.id = ci.product_variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE c.user_id = ? AND pv.status = 'ACTIVE' AND p.status = 'ACTIVE'
       FOR UPDATE`,
      [userId, userId],
    );
    if (!items.length) fail('Giỏ hàng đang trống hoặc không có sản phẩm hợp lệ', 422);

    let subtotal = 0;
    for (const item of items) {
      if (item.stock_quantity < item.quantity) {
        fail(`Sản phẩm ${item.sku} không đủ tồn kho`, 409);
      }
      item.subtotal = Number(item.price) * item.quantity;
      subtotal += item.subtotal;
    }
    const voucher = await validateVoucher(connection, body.voucherCode, subtotal);
    const shippingFee = 0;
    const total = subtotal + shippingFee - voucher.discount;
    const [orderResult] = await connection.execute(
      `INSERT INTO orders
       (order_code, order_type, user_id, address_id, delivery_receiver_name,
        delivery_phone, delivery_address, delivery_latitude, delivery_longitude,
        subtotal, shipping_fee, discount_amount, total_amount, voucher_code, note)
       VALUES (?, 'READY_PRODUCT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderCode(),
        userId,
        address.id,
        address.receiver_name,
        address.receiver_phone,
        [address.address_line, address.ward, address.district, address.province]
          .filter(Boolean)
          .join(', '),
        address.latitude,
        address.longitude,
        subtotal,
        shippingFee,
        voucher.discount,
        total,
        voucher.code,
        body.note || null,
      ],
    );
    const orderId = orderResult.insertId;
    for (const item of items) {
      await connection.execute(
        `INSERT INTO order_items
         (order_id, product_variant_id, product_name, variant_name, sku,
          unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_variant_id,
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
    }
    await connection.execute(
      "INSERT INTO payments (order_id, method, status, amount) VALUES (?, 'COD', 'PENDING', ?)",
      [orderId, total],
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
  const [items] = await connection.execute(
    'SELECT * FROM order_items WHERE order_id = ? ORDER BY id',
    [id],
  );
  return { ...rows[0], items };
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
    const [items] = await connection.execute('SELECT * FROM order_items WHERE order_id = ?', [id]);
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
        [item.product_variant_id, userId, item.quantity, id, reason || null],
      );
    }
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
    await connection.execute(
      'UPDATE orders SET status = ?, cancelled_reason = IF(? = \'CANCELLED\', ?, cancelled_reason) WHERE id = ?',
      [status, status, reason || null, id],
    );
    await connection.execute(
      'INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
      [order.user_id, 'Cập nhật đơn hàng', `Đơn hàng ${order.order_code} đã chuyển sang ${status}`, 'ORDER_STATUS', 'ORDER', id],
    );
    return getById(order.user_id, id, connection);
  });
};

const checkoutCustom = async (userId, buildIdValue, body) => {
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
    const voucher = await validateVoucher(connection, body.voucherCode, subtotal);
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
    }
    await connection.execute(
      "INSERT INTO payments (order_id, method, status, amount) VALUES (?, 'COD', 'PENDING', ?)",
      [orderId, total],
    );
    await connection.execute("UPDATE custom_builds SET status = 'CONFIRMED', total_amount = ? WHERE id = ?", [total, buildId]);
    return getById(userId, orderId, connection);
  });
};

module.exports = { checkout, checkoutCustom, getById, list, cancel, updateStatus, fail, idOf };
