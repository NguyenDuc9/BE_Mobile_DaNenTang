const express = require('express');
const controller = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/authorization.middleware');
const { positiveId } = require('../middlewares/validation.middleware');
const router = express.Router();
router.use(authenticate);
router.get('/', controller.get);
router.post('/items', controller.add);
// PATCH và PUT đều được hỗ trợ để mobile (PATCH) và legacy clients (PUT)
// có thể cập nhật số lượng. Cùng điều hướng về `update` controller.
router.patch('/items/:id', positiveId('id'), controller.update);
router.put('/items/:id', positiveId('id'), controller.update);
router.delete('/items/:id', positiveId('id'), controller.remove);
router.delete('/', controller.clear);
module.exports = router;
