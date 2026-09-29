const model = require('../models/notification.model');
const create = (userId, data) => model.create({ ...data, userId });
module.exports = { ...model, create };
