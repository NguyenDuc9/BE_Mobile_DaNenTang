const express = require('express');
const categoryMiddleware = require('../controllers/categody.controller');

const router = express.Router();

router.get('/', categoryMiddleware.getAll);
router.get('/:id', categoryMiddleware.getOne);
router.post('/', categoryMiddleware.create);
router.put('/:id', categoryMiddleware.update);
router.delete('/:id', categoryMiddleware.remove);

module.exports = router;
