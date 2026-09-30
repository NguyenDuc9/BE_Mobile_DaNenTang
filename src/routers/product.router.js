const express = require('express');
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');
const reviewController = require('../controllers/review.controller');
const { positiveId } = require('../middlewares/validation.middleware');

const router = express.Router();

router.get('/', productController.getAll);
router.get('/:id/reviews', positiveId('id'), reviewController.list);
router.get('/:id/review-eligibility', authenticate, authorize('customer'), positiveId('id'), reviewController.eligibility);
router.post('/:id/reviews', authenticate, authorize('customer'), positiveId('id'), reviewController.create);
router.get('/:id', productController.getOne);
router.post('/', authenticate, authorize('staff', 'admin'), productController.create);
router.put('/:id', authenticate, authorize('staff', 'admin'), productController.update);
router.delete('/:id', authenticate, authorize('staff', 'admin'), productController.remove);

module.exports = router;
