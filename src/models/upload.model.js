const fs = require('fs/promises');
const path = require('path');
const { uploadDirectory } = require('../middlewares/image-upload.middleware');

const UploadModel = {
  getPath: (filename) => path.join(uploadDirectory, filename),
  remove: async (filename) => fs.unlink(path.join(uploadDirectory, filename)),
};

module.exports = UploadModel;
