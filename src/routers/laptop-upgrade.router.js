const express = require('express');
const controller = require('../controllers/laptop-upgrade.controller');
const { positiveId } = require('../middlewares/validation.middleware');

const router = express.Router();
router.get('/:id/upgrades', positiveId('id'), controller.options);
router.post('/:id/upgrade/validate', positiveId('id'), controller.validate);

module.exports = router;

