const model = require('../models/warranty.model');
const validate = (data) => {
  if (!data.orderItemId || !data.serialNumber || !data.startDate || !data.endDate) return 'orderItemId, serialNumber, startDate, endDate là bắt buộc';
  if (new Date(data.endDate) < new Date(data.startDate)) return 'endDate không được trước startDate';
  if (data.status && !['ACTIVE', 'EXPIRED', 'CLAIMED'].includes(data.status)) return 'status không hợp lệ';
  return null;
};
module.exports = { ...model, validate };
