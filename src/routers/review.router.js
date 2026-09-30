const express = require('express');
const controller = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');
const { positiveId } = require('../middlewares/validation.middleware');

const router = express.Router();
router.put('/:id', authenticate, authorize('customer'), positiveId('id'), controller.update);
router.delete('/:id', authenticate, authorize('customer'), positiveId('id'), controller.remove);
router.patch('/:id/status', authenticate, authorize('staff', 'admin'), positiveId('id'), controller.moderate);

module.exports = router;

