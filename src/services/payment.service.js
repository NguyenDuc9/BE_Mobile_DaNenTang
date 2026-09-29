const db = require('../common/common');
const { fail, idOf } = require('./order.service');

const methods = ['COD', 'BANK_TRANSFER', 'MOMO', 'VNPAY'];
const statuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

const get = async (userId, orderIdValue, role) => {
  const orderId = idOf(orderIdValue, 'orderId');
  const [rows] = await db.promise().execute(
    `SELECT p.*, o.user_id, o.total_amount
     FROM payments p JOIN orders o ON o.id = p.order_id
     WHERE p.order_id = ? AND (? IN ('admin', 'staff') OR o.user_id = ?)`,
    [orderId, role, userId],
  );
  if (!rows[0]) fail('Không tìm thấy payment', 404);
  return rows[0];
};

const create = async (userId, orderIdValue, body) => {
  const orderId = idOf(orderIdValue, 'orderId');
  const method = body.method;
  if (!methods.includes(method)) fail('method payment không hợp lệ', 400);
  return db.withTransaction(async (connection) => {
    const [orders] = await connection.execute(
      'SELECT id, total_amount, user_id FROM orders WHERE id = ? AND user_id = ? FOR UPDATE',
      [orderId, userId],
    );
    const order = orders[0];
    if (!order) fail('Không tìm thấy đơn hàng', 404);
    const [existing] = await connection.execute('SELECT * FROM payments WHERE order_id = ?', [orderId]);
    if (existing[0]) fail('Đơn hàng đã có payment', 409);
    await connection.execute(
      "INSERT INTO payments (order_id, method, status, amount) VALUES (?, ?, 'PENDING', ?)",
      [orderId, method, order.total_amount],
    );
    return get(userId, orderId, 'customer');
  });
};

const updateStatus = async (userId, paymentIdValue, body, role) => {
  const paymentId = idOf(paymentIdValue, 'paymentId');
  if (!statuses.includes(body.status)) fail('status payment không hợp lệ', 400);
  return db.withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT p.*, o.user_id, o.total_amount
       FROM payments p JOIN orders o ON o.id = p.order_id
       WHERE p.id = ? AND (? IN ('admin', 'staff') OR o.user_id = ?) FOR UPDATE`,
      [paymentId, role, userId],
    );
    const payment = rows[0];
    if (!payment) fail('Không tìm thấy payment', 404);
    if (Number(payment.amount) !== Number(payment.total_amount)) fail('Số tiền payment không khớp order', 422);
    const allowed = {
      PENDING: ['PAID', 'FAILED'],
      FAILED: ['PENDING'],
      PAID: ['REFUNDED'],
      REFUNDED: [],
    };
    if (!allowed[payment.status].includes(body.status)) fail('Chuyển trạng thái payment không hợp lệ', 409);
    await connection.execute(
      'UPDATE payments SET status = ?, transaction_code = ?, paid_at = IF(? = \'PAID\', NOW(), paid_at) WHERE id = ?',
      [body.status, body.transactionCode || null, body.status, paymentId],
    );
    return get(userId, payment.order_id, role);
  });
};

module.exports = { get, create, updateStatus };
