const mysql = require('mysql2');
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: process.env.DB_TIMEZONE,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  waitForConnections: true,
});
const promisePool = db.promise();

const beginTransaction = async () => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    return connection;
  } catch (error) {
    connection.release();
    throw error;
  }
};
const getConnection = async () => promisePool.getConnection();
const commit = async (connection) => {
  try {
    await connection.commit();
  } finally {
    connection.release();
  }
};
const rollback = async (connection) => {
  try { await connection.rollback(); } finally { connection.release(); }
};
const withTransaction = async (work) => {
  const connection = await beginTransaction();
  try {
    const result = await work(connection);
    await connection.commit();
    connection.release();
    return result;
  }
  catch (error) {
    try { await connection.rollback(); } finally { connection.release(); }
    throw error;
  }
};

module.exports = {
  promise: () => promisePool,
  pool: db,
  getConnection,
  beginTransaction,
  commit,
  rollback,
  withTransaction,
};
