const express = require('express');
const categoryMiddleware = require('../controllers/categody.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

const router = express.Router();

router.get('/', categoryMiddleware.getAll);
router.get('/:id', categoryMiddleware.getOne);
router.post('/', authenticate, authorize('staff', 'admin'), categoryMiddleware.create);
router.put('/:id', authenticate, authorize('staff', 'admin'), categoryMiddleware.update);
router.delete('/:id', authenticate, authorize('staff', 'admin'), categoryMiddleware.remove);

module.exports = router;
