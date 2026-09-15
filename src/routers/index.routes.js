const express = require('express');
const categoryRouter = require('./category.router');
const router = express.Router();

router.use('/categories', categoryRouter);
module.exports = router;
