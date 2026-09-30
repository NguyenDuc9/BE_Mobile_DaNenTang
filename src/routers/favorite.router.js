const express = require('express');
const controller = require('../controllers/favorite.controller');
const { authenticate } = require('../middlewares/authorization.middleware');
const { positiveId } = require('../middlewares/validation.middleware');

const router = express.Router();
router.use(authenticate);
router.get('/', controller.list);
router.get('/:productId/status', positiveId('productId'), controller.status);
router.post('/:productId', positiveId('productId'), controller.add);
router.delete('/:productId', positiveId('productId'), controller.remove);

module.exports = router;

