const model = require('../models/laptop-upgrade.model');

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
const idOf = (value, name) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) fail(`${name} không hợp lệ`);
  return id;
};

const options = async (productIdValue) => {
  const productId = idOf(productIdValue, 'productId');
  const [profile, upgradeOptions] = await Promise.all([
    model.getProfile(productId),
    model.getOptions(productId),
  ]);
  if (!profile) fail('Laptop này không hỗ trợ nâng cấp', 404);
  return { profile, options: upgradeOptions };
};

const validate = async (productIdValue, body = {}) => {
  const productId = idOf(productIdValue, 'productId');
  const variantId = idOf(body.productVariantId, 'productVariantId');
  const [profile, upgradeOptions, variant] = await Promise.all([
    model.getProfile(productId),
    model.getOptions(productId),
    model.getVariantProduct(variantId),
  ]);
  if (!profile || !variant || Number(variant.product_id) !== productId) {
    fail('Laptop hoặc biến thể không hỗ trợ nâng cấp', 404);
  }
  const selected = [];
  for (const [type, idValue] of [['RAM', body.ramOptionId], ['SSD', body.ssdOptionId]]) {
    if (!idValue) continue;
    const id = idOf(idValue, `${type.toLowerCase()}OptionId`);
    const option = upgradeOptions.find((item) => Number(item.id) === id && item.type === type);
    if (!option) fail(`Lựa chọn ${type} không hợp lệ`);
    const limit = type === 'RAM' ? Number(profile.max_ram_gb) : Number(profile.max_storage_gb);
    if (Number(option.capacity_gb) > limit) {
      fail(`${type} ${option.capacity_gb}GB vượt giới hạn ${limit}GB`);
    }
    selected.push(option);
  }
  if (!selected.length) fail('Cần chọn ít nhất một tùy chọn nâng cấp');
  const configuration = {
    kind: 'LAPTOP_UPGRADE',
    ram: selected.find((item) => item.type === 'RAM') || null,
    ssd: selected.find((item) => item.type === 'SSD') || null,
  };
  const configurationKey = selected
    .map((item) => `${item.type}:${item.id}`)
    .sort()
    .join('|');
  const priceAdjustment = selected.reduce(
    (sum, item) => sum + Number(item.price_delta),
    0,
  );
  return {
    valid: true,
    productId,
    productVariantId: variantId,
    configuration,
    configurationKey,
    priceAdjustment,
    unitPrice: Number(variant.price) + priceAdjustment,
  };
};

module.exports = { options, validate };

