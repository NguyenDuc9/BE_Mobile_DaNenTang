const model = require('../models/pc-builder.model');

const REQUIRED_TYPES = ['CPU', 'MAINBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE'];

const options = async () => {
  const rows = await model.list();
  return rows.reduce((groups, row) => {
    if (!groups[row.component_type]) groups[row.component_type] = [];
    groups[row.component_type].push(row);
    return groups;
  }, {});
};

const validate = async (body = {}) => {
  if (!Array.isArray(body.items)) {
    const error = new Error('items phải là mảng');
    error.statusCode = 400;
    throw error;
  }
  const normalized = body.items.map((item) => ({
    componentType: String(item.componentType || '').toUpperCase(),
    productVariantId: Number(item.productVariantId),
    quantity: Math.max(Number(item.quantity) || 1, 1),
  }));
  if (
    normalized.some(
      (item) => !item.componentType || !Number.isSafeInteger(item.productVariantId) || item.productVariantId <= 0,
    )
  ) {
    const error = new Error('componentType hoặc productVariantId không hợp lệ');
    error.statusCode = 400;
    throw error;
  }
  if (new Set(normalized.map((item) => item.componentType)).size !== normalized.length) {
    const error = new Error('Mỗi loại linh kiện chỉ được chọn một lần');
    error.statusCode = 400;
    throw error;
  }

  const rows = await model.findByVariantIds(
    normalized.map((item) => item.productVariantId),
  );
  const selected = new Map(rows.map((row) => [row.component_type, row]));
  const issues = [];
  for (const item of normalized) {
    const row = rows.find((candidate) => Number(candidate.product_variant_id) === item.productVariantId);
    if (!row || row.component_type !== item.componentType) {
      issues.push({ code: 'INVALID_COMPONENT', message: `${item.componentType} không đúng loại hoặc không hoạt động.` });
    } else if (Number(row.stock_quantity) < item.quantity) {
      issues.push({ code: 'OUT_OF_STOCK', message: `${row.name} không đủ tồn kho.` });
    }
  }

  const cpu = selected.get('CPU');
  const mainboard = selected.get('MAINBOARD');
  const ram = selected.get('RAM');
  const gpu = selected.get('GPU');
  const psu = selected.get('PSU');
  const pcCase = selected.get('CASE');
  const cooler = selected.get('COOLER');

  if (cpu && mainboard && cpu.socket !== mainboard.socket) {
    issues.push({ code: 'CPU_SOCKET', message: `CPU dùng socket ${cpu.socket} nhưng Mainboard hỗ trợ ${mainboard.socket}.` });
  }
  if (ram && mainboard && ram.memory_type !== mainboard.memory_type) {
    issues.push({ code: 'RAM_TYPE', message: `RAM ${ram.memory_type} không tương thích Mainboard ${mainboard.memory_type}.` });
  }
  if (ram && mainboard) {
    const capacity = Number(String(ram.ram || ram.variant_name).match(/\d+/)?.[0] || 0);
    const quantity = normalized.find((item) => item.componentType === 'RAM')?.quantity || 1;
    if (capacity * quantity > Number(mainboard.max_memory_gb || 0)) {
      issues.push({ code: 'RAM_CAPACITY', message: `Tổng RAM ${capacity * quantity}GB vượt giới hạn ${mainboard.max_memory_gb}GB của Mainboard.` });
    }
    if (quantity > Number(mainboard.memory_slots || 0)) {
      issues.push({ code: 'RAM_SLOTS', message: `Số thanh RAM vượt quá ${mainboard.memory_slots} khe của Mainboard.` });
    }
  }
  if (gpu && psu && Number(psu.psu_watts || 0) < Number(gpu.recommended_psu_watts || 0)) {
    issues.push({ code: 'PSU_POWER', message: `GPU yêu cầu PSU tối thiểu ${gpu.recommended_psu_watts}W nhưng PSU đã chọn là ${psu.psu_watts}W.` });
  }
  if (gpu && pcCase && Number(gpu.length_mm || 0) > Number(pcCase.max_gpu_length_mm || 0)) {
    issues.push({ code: 'GPU_LENGTH', message: `GPU dài ${gpu.length_mm}mm vượt giới hạn ${pcCase.max_gpu_length_mm}mm của Case.` });
  }
  if (cpu && cooler && cooler.socket && cpu.socket !== cooler.socket) {
    issues.push({ code: 'COOLER_SOCKET', message: `Tản nhiệt socket ${cooler.socket} không hỗ trợ CPU ${cpu.socket}.` });
  }

  const missingTypes = REQUIRED_TYPES.filter((type) => !selected.has(type));
  const total = normalized.reduce((sum, item) => {
    const row = rows.find((candidate) => Number(candidate.product_variant_id) === item.productVariantId);
    return sum + (row ? Number(row.price) * item.quantity : 0);
  }, 0);
  return {
    compatible: issues.length === 0,
    complete: missingTypes.length === 0,
    missingTypes,
    issues,
    estimatedTotal: total,
    items: rows,
  };
};

module.exports = { options, validate, requiredTypes: REQUIRED_TYPES };

