const fs = require('fs');
const UploadService = require('../services/upload.service');
const UploadModel = require('../models/upload.model');

const UploadController = {
  create: (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn ảnh để tải lên' });
    }
    return res.status(201).json({
      message: 'Tải ảnh lên thành công',
      data: { url: UploadService.getPublicPath(req.file.filename) },
    });
  },

  get: (req, res) => {
    const { filename } = req.params;
    if (!/^[0-9a-f-]+\.(jpg|png|webp|gif)$/i.test(filename)) {
      return res.status(400).json({ message: 'Tên ảnh không hợp lệ' });
    }

    const imagePath = UploadModel.getPath(filename);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Không tìm thấy ảnh' });
    }
    return res.sendFile(imagePath);
  },
};

module.exports = UploadController;
