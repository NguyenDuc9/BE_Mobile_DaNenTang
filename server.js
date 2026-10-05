require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const userRouter = require('./src/routers/auth.router');
const adminFeRouter = require('./src/routers/admin-fe.router');
const uploadRouter = require('./src/routers/upload.router');
const route = require('./src/routers/index.routes');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', userRouter);
app.use('/api/admin-fe', adminFeRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api', route);

app.get('/', (req, res) => {
  res.json({
    message: 'Hello Express!',
  });
});

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
