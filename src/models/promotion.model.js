const db = require('../common/common');

const listActive = async () => {
  const [rows] = await db.promise().execute(
    `SELECT id, title, subtitle, image_url, target_type, target_value,
            start_at, end_at, sort_order
     FROM promotions
     WHERE status = 'ACTIVE' AND start_at <= NOW() AND end_at > NOW()
     ORDER BY sort_order, id`,
  );
  return rows;
};

module.exports = { listActive };

