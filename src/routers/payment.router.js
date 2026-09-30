const express = require('express');
const controller = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');
const router = express.Router();
router.get('/orders/:orderId/payment', authenticate, controller.get);
router.post('/orders/:orderId/payment', authenticate, authorize('customer'), controller.create);
router.patch('/payments/:id/status', authenticate, authorize('staff', 'admin'), controller.updateStatus);
module.exports = router;
