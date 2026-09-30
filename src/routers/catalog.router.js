const express = require('express');
const controller = require('../controllers/catalog.controller');

const router = express.Router();
router.get('/products', controller.list);

module.exports = router;

