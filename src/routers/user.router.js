const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

const router = express.Router();
router.use(authenticate, authorize('admin'));

router.get('/', userController.getAll);
router.get('/:id', userController.getOne);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
