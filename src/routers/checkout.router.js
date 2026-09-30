const express = require('express');
const controller = require('../controllers/checkout.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

const router = express.Router();
router.use(authenticate, authorize('customer'));
router.get('/options', controller.options);
router.post('/quote', controller.quote);

module.exports = router;

