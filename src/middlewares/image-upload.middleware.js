const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { randomUUID } = require('crypto');

const uploadDirectory = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const extensionByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extensionByMimeType[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!extensionByMimeType[file.mimetype]) {
      const error = new Error('Chỉ chấp nhận ảnh JPEG, PNG, WEBP hoặc GIF');
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

const receiveProductImage = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();
    const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message || 'Không thể tải ảnh lên' });
  });
};

module.exports = { receiveProductImage, uploadDirectory };
