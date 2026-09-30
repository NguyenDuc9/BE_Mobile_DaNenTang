const express = require('express');
const controller = require('../controllers/pc-builder.controller');

const router = express.Router();
router.get('/options', controller.options);
router.post('/validate', controller.validate);

module.exports = router;

