require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
