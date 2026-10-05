const express = require('express');
const controller = require('../controllers/catalog.controller');

const router = express.Router();
router.get('/products', controller.list);
router.get('/facets', controller.facets);

module.exports = router;
