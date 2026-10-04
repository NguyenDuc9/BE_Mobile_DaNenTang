const express = require('express');
const UploadController = require('../controllers/upload.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');
const { receiveProductImage } = require('../middlewares/image-upload.middleware');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('staff', 'admin'),
  receiveProductImage,
  UploadController.create,
);
router.get('/:filename', UploadController.get);

module.exports = router;
