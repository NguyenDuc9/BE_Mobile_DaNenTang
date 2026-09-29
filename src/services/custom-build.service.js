const model = require('../models/custom-build.model');
const componentTypes = ['CPU', 'MAINBOARD', 'RAM', 'GPU', 'STORAGE', 'PSU', 'CASE', 'COOLER'];
const validateItems = (items) => Array.isArray(items) && items.length > 0 && items.every((i) => componentTypes.includes(i.componentType) && Number.isInteger(Number(i.productVariantId)) && Number(i.productVariantId) > 0 && Number.isInteger(Number(i.quantity)) && Number(i.quantity) > 0);
module.exports = { ...model, componentTypes, validateItems };
