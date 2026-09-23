const express = require('express');
const controller = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');
const router = express.Router();
router.use(authenticate, authorize('staff', 'admin'));
router.get('/transactions', controller.list);
router.post('/import', (req, res, next) => { req.body.type = 'IMPORT'; next(); }, controller.change);
router.post('/adjustment', (req, res, next) => { req.body.type = 'ADJUSTMENT'; next(); }, controller.change);
module.exports = router;
