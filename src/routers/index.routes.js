const express = require('express');
const categoryRouter = require('./category.router');
const roleRouter = require('./role.router');
const userRouter = require('./user.router');
const productRouter = require('./product.router');
const router = express.Router();

router.use('/categories', categoryRouter);
router.use('/roles', roleRouter);
router.use('/users', userRouter);
router.use('/products', productRouter);
module.exports = router;
