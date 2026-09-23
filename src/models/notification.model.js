const db = require('../common/common');
const NotificationModel = {
  list: async (userId, limit, offset) => {
    const [r] = await db.promise().execute(
      'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?', [userId, limit, offset]); return r;
  },
  count: async (userId) => { const [r] = await db.promise().execute('SELECT COUNT(*) count FROM notifications WHERE user_id=? AND is_read=0', [userId]); return r[0].count; },
  read: async (id, userId) => { const [r] = await db.promise().execute('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [id, userId]); return r.affectedRows; },
  readAll: async (userId) => { const [r] = await db.promise().execute('UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0', [userId]); return r.affectedRows; },
  remove: async (id, userId) => { const [r] = await db.promise().execute('DELETE FROM notifications WHERE id=? AND user_id=?', [id, userId]); return r.affectedRows; },
  create: async (d) => { const [r] = await db.promise().execute('INSERT INTO notifications (user_id, type, title, message, is_read) VALUES (?, ?, ?, ?, 0)', [d.userId, d.type, d.title, d.message]); return r.insertId; },
};
module.exports = NotificationModel;
