const express = require('express');
const roleController = require('../controllers/role.controller');

const router = express.Router();

router.get('/', roleController.getAll);
router.get('/:id', roleController.getOne);
router.post('/', roleController.create);
router.put('/:id', roleController.update);
router.delete('/:id', roleController.remove);

module.exports = router;
