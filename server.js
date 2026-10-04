require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('node:fs');
const path = require('node:path');
const db = require('./src/common/common');
const userRouter = require('./src/routers/auth.router');
const route = require('./src/routers/index.routes');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', userRouter);
app.use('/api', route);

app.get('/', (req, res) => {
  res.json({
    message: 'Hello Express!',
  });
});

const PORT = 8000;

async function startServer() {
  try {
    const voucherProductsMigration = fs.readFileSync(
      path.join(__dirname, 'migrations/20261001_create_voucher_products.sql'),
      'utf8',
    );
    await db.execute(voucherProductsMigration);
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Không thể khởi tạo database:', error);
    process.exitCode = 1;
    db.pool.end();
  }
}

void startServer();

module.exports = app;
