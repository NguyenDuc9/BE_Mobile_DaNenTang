const model = require('../models/build-template.model');
const componentTypes = ['CPU', 'MAINBOARD', 'RAM', 'GPU', 'STORAGE', 'PSU', 'CASE', 'COOLER'];
const validateItems = (items) => {
  if (!Array.isArray(items) || !items.length) return 'items là bắt buộc';
  if (items.some((i) => !componentTypes.includes(i.componentType) || !Number.isInteger(Number(i.quantity)) || Number(i.quantity) <= 0)) return 'componentType hoặc quantity không hợp lệ';
  if (new Set(items.map((i) => i.componentType)).size !== items.length) return 'Không được trùng component_type';
  return null;
};
const save = async (data, id) => {
  const message = validateItems(data.items);
  if (message) { const e = new Error(message); e.status = 400; throw e; }
  const checked = await model.validateItems(data.items);
  if (checked.error) { const e = new Error(checked.error); e.status = 400; throw e; }
  const estimatedTotal = checked.items.reduce((sum, item) => sum + item.unitPrice * Number(item.quantity), 0);
  return model.save({ ...data, items: checked.items, estimatedTotal }, id);
};
module.exports = { componentTypes, validateItems, save };
