const indexExists = async (connection, tableName, indexName) => {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1`,
    [tableName, indexName],
  );
  return Boolean(rows[0]);
};
const columnExists = async (connection, tableName, columnName) => {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    [tableName, columnName],
  );
  return Boolean(rows[0]);
};
const addColumn = async (connection, table, column, definition) => {
  if (!(await columnExists(connection, table, column))) {
    await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
};

async function up(connection) {
  await addColumn(connection, 'cart_items', 'item_type', "ENUM('PRODUCT','LAPTOP_UPGRADE') NOT NULL DEFAULT 'PRODUCT' AFTER product_variant_id");
  await addColumn(connection, 'cart_items', 'configuration_key', "VARCHAR(255) NOT NULL DEFAULT '' AFTER item_type");
  await addColumn(connection, 'cart_items', 'configuration_json', 'JSON NULL AFTER configuration_key');
  await addColumn(connection, 'cart_items', 'price_adjustment', 'DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER configuration_json');
  if (await indexExists(connection, 'cart_items', 'uq_cart_variant')) {
    await connection.query('ALTER TABLE cart_items DROP INDEX uq_cart_variant');
  }
  if (!(await indexExists(connection, 'cart_items', 'uq_cart_variant_config'))) {
    await connection.query('ALTER TABLE cart_items ADD UNIQUE KEY uq_cart_variant_config (cart_id, product_variant_id, configuration_key)');
  }

  await addColumn(connection, 'order_items', 'item_type', "ENUM('PRODUCT','LAPTOP_UPGRADE') NOT NULL DEFAULT 'PRODUCT' AFTER product_variant_id");
  await addColumn(connection, 'order_items', 'configuration_json', 'JSON NULL AFTER item_type');
}

module.exports = { up };

