const indexExists = async (connection, tableName, indexName) => {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?
     LIMIT 1`,
    [tableName, indexName],
  );
  return Boolean(rows[0]);
};

async function up(connection) {
  if (!(await indexExists(connection, 'reviews', 'uq_reviews_user_order_item'))) {
    await connection.query(`
      ALTER TABLE reviews
      ADD UNIQUE KEY uq_reviews_user_order_item (user_id, order_item_id)
    `);
  }
}

module.exports = { up };

