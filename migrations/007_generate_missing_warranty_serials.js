async function up(connection) {
  await connection.execute(
    `UPDATE warranties
     SET serial_number = CONCAT('SN-', LPAD(id, 8, '0'))
     WHERE serial_number IS NULL OR serial_number = ''`,
  );
}

module.exports = { up };
