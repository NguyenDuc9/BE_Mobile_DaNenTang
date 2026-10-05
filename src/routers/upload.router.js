const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

const router = express.Router();
const uploadsDirectory = path.join(__dirname, '..', '..', 'uploads');
const extensions = {
  'image/jpeg': {
    extension: 'jpg',
    signature: (buffer) =>
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  'image/png': {
    extension: 'png',
    signature: (buffer) =>
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    extension: 'webp',
    signature: (buffer) =>
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP',
  },
  'image/gif': {
    extension: 'gif',
    signature: (buffer) =>
      ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6)),
  },
};
const receiveImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    callback(null, Boolean(extensions[file.mimetype]));
  },
}).single('image');

router.post(
  '/',
  authenticate,
  authorize('staff', 'admin'),
  (req, res, next) => {
    receiveImage(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          message:
            error.code === 'LIMIT_FILE_SIZE'
              ? 'Ảnh tải lên không được vượt quá 5 MB.'
              : 'Không thể nhận ảnh tải lên.',
        });
      }
      return next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: 'Vui lòng chọn ảnh JPEG, PNG, WebP hoặc GIF.',
      });
    }

    const format = extensions[req.file.mimetype];
    if (!format.signature(req.file.buffer)) {
      return res
        .status(400)
        .json({ message: 'Nội dung file không phải ảnh hợp lệ.' });
    }

    const filename = `${crypto.randomBytes(16).toString('hex')}.${format.extension}`;
    try {
      await fs.mkdir(uploadsDirectory, { recursive: true });
      await fs.writeFile(path.join(uploadsDirectory, filename), req.file.buffer, {
        flag: 'wx',
      });
      return res.status(201).json({ data: { url: `/uploads/${filename}` } });
    } catch (error) {
      console.error('Image upload error:', error);
      return res.status(500).json({ message: 'Không thể lưu ảnh tải lên.' });
    }
  },
);

module.exports = router;
