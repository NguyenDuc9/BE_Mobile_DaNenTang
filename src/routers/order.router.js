const express = require('express');
const controller = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

const router = express.Router();
router.use(authenticate);
router.post('/', authorize('customer'), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.patch('/:id/cancel', authorize('customer'), controller.cancel);
router.patch('/:id/status', authorize('staff', 'admin'), controller.updateStatus);
module.exports = router;
