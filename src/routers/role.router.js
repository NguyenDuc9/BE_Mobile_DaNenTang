const express = require('express');
const roleController = require('../controllers/role.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

const router = express.Router();
router.use(authenticate, authorize('admin'));

router.get('/', roleController.getAll);
router.get('/:id', roleController.getOne);
router.post('/', roleController.create);
router.put('/:id', roleController.update);
router.delete('/:id', roleController.remove);

module.exports = router;
