require('dotenv').config();
const express = require('express');
const userRouter = require('./src/routers/auth.router');
const app = express();

app.use(express.json());
app.use('/api/auth', userRouter);

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
