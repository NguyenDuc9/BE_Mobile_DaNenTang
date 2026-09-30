const express = require('express');
const controller = require('../controllers/promotion.controller');

const router = express.Router();
router.get('/', controller.list);

module.exports = router;

