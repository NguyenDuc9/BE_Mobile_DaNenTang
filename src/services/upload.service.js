const UploadModel = require('../models/upload.model');

const UploadService = {
  getPublicPath: (filename) => `/api/uploads/${encodeURIComponent(filename)}`,

  remove: async (filename) => UploadModel.remove(filename),
};

module.exports = UploadService;
