const express = require('express');
const controller = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');
const router = express.Router();
router.use(authenticate);
router.get('/orders/:orderId/payment', controller.get);
router.post('/orders/:orderId/payment', authorize('customer'), controller.create);
router.patch('/payments/:id/status', authorize('staff', 'admin'), controller.updateStatus);
module.exports = router;
