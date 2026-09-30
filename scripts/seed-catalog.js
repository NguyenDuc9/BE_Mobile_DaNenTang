require('dotenv').config();

const db = require('../src/common/common');

const DEFAULT_PER_CATEGORY = 60;
const SEED_PREFIX = 'seed60';

const pad = (value) => String(value).padStart(3, '0');

const pick = (items, index) => items[index % items.length];

const CATEGORY_CONFIG = {
  laptop: {
    basePrice: 12990000,
    series: ['Air', 'Pro', 'Gaming', 'Creator', 'Business', 'Student'],
  },
  'pc-gaming': {
    basePrice: 16990000,
    series: ['Arena', 'Phantom', 'Titan', 'Nova', 'Strike', 'Elite'],
  },
  'pc-van-phong': {
    basePrice: 7990000,
    series: ['Office', 'Mini', 'Work', 'Compact', 'Business', 'Home'],
  },
  'man-hinh': {
    basePrice: 2890000,
    series: ['Vision', 'UltraView', 'ProDisplay', 'GameView', 'Studio', 'OfficeView'],
  },
  'linh-kien': {
    basePrice: 1490000,
    series: ['CPU', 'RAM', 'SSD', 'GPU', 'Mainboard', 'PSU', 'Case', 'Cooler'],
  },
  'phu-kien': {
    basePrice: 490000,
    series: ['Chuột', 'Bàn phím', 'Tai nghe', 'Webcam', 'Hub USB', 'Loa'],
  },
  'dien-thoai': {
    basePrice: 7990000,
    series: ['Phone Air', 'Phone Pro', 'Phone Max', 'Phone Lite', 'Phone 5G', 'Phone Ultra'],
  },
};

const cpus = [
  'Intel Core i5-13420H',
  'Intel Core i7-13620H',
  'AMD Ryzen 5 7535HS',
  'AMD Ryzen 7 7840HS',
  'Intel Core Ultra 5 125H',
  'AMD Ryzen 7 8845HS',
];
const officeCpus = [
  'Intel Core i3-13100',
  'Intel Core i5-13400',
  'AMD Ryzen 5 5600G',
  'AMD Ryzen 5 7600',
];
const rams = ['8GB DDR4', '16GB DDR4', '16GB DDR5', '32GB DDR5'];
const storages = ['512GB SSD', '1TB SSD', '2TB SSD'];
const gpus = [
  'NVIDIA GeForce RTX 3050',
  'NVIDIA GeForce RTX 4050',
  'NVIDIA GeForce RTX 4060',
  'NVIDIA GeForce RTX 4070',
  'AMD Radeon RX 7600',
];
const colors = ['Đen', 'Bạc', 'Xám', 'Trắng'];

function buildVariant(categorySlug, index) {
  const config = CATEGORY_CONFIG[categorySlug];
  const series = pick(config.series, index - 1);
  const priceStep = categorySlug === 'phu-kien' ? 85000 : 310000;
  const price = config.basePrice + ((index - 1) % 20) * priceStep;
  const compareAtPrice = Math.ceil((price * (108 + (index % 8))) / 100000) * 1000;
  const common = {
    price,
    compareAtPrice,
    stockQuantity: 8 + (index % 43),
    cpu: null,
    ram: null,
    storage: null,
    gpu: null,
    screenSize: null,
    screenResolution: null,
    refreshRate: null,
    operatingSystem: null,
    color: pick(colors, index - 1),
    weightKg: null,
    warrantyMonths: index % 3 === 0 ? 36 : 24,
  };

  if (categorySlug === 'laptop') {
    return {
      ...common,
      variantName: `${pick(cpus, index - 1)} / ${pick(rams, index)} / ${pick(storages, index + 1)}`,
      cpu: pick(cpus, index - 1),
      ram: pick(rams, index),
      storage: pick(storages, index + 1),
      gpu: index % 3 === 0 ? pick(gpus, index) : 'Integrated Graphics',
      screenSize: index % 2 === 0 ? '15.6 inch' : '14 inch',
      screenResolution: index % 4 === 0 ? '2560x1600' : '1920x1080',
      refreshRate: index % 3 === 0 ? '144Hz' : '60Hz',
      operatingSystem: 'Windows 11',
      weightKg: 1.35 + (index % 7) * 0.12,
    };
  }

  if (categorySlug === 'pc-gaming') {
    return {
      ...common,
      variantName: `${pick(cpus, index)} / ${pick(rams, index + 1)} / ${pick(gpus, index)}`,
      cpu: pick(cpus, index),
      ram: pick(rams, index + 1),
      storage: pick(storages, index),
      gpu: pick(gpus, index),
      operatingSystem: 'Windows 11',
      weightKg: 9.5 + (index % 8) * 0.7,
    };
  }

  if (categorySlug === 'pc-van-phong') {
    return {
      ...common,
      variantName: `${pick(officeCpus, index)} / ${pick(rams, index)} / ${pick(storages, index)}`,
      cpu: pick(officeCpus, index),
      ram: pick(rams, index),
      storage: pick(storages, index),
      gpu: 'Integrated Graphics',
      operatingSystem: 'Windows 11 Pro',
      weightKg: 4.2 + (index % 6) * 0.5,
    };
  }

  if (categorySlug === 'man-hinh') {
    const size = pick(['24 inch', '27 inch', '32 inch', '34 inch'], index - 1);
    const resolution = pick(['1920x1080', '2560x1440', '3440x1440', '3840x2160'], index - 1);
    const refreshRate = pick(['75Hz', '100Hz', '144Hz', '165Hz', '180Hz'], index - 1);
    return {
      ...common,
      variantName: `${size} / ${resolution} / ${refreshRate}`,
      screenSize: size,
      screenResolution: resolution,
      refreshRate,
      weightKg: 3.5 + (index % 8) * 0.45,
    };
  }

  if (categorySlug === 'linh-kien') {
    const component = series;
    const componentValue = {
      CPU: pick(cpus, index),
      RAM: pick(['16GB DDR4 3200MHz', '16GB DDR5 5600MHz', '32GB DDR5 6000MHz'], index),
      SSD: pick(['SSD NVMe 500GB', 'SSD NVMe 1TB', 'SSD NVMe 2TB'], index),
      GPU: pick(gpus, index),
      Mainboard: pick(['B550 AM4', 'B650 AM5', 'B760 LGA1700', 'Z790 LGA1700'], index),
      PSU: pick(['550W 80 Plus Bronze', '650W 80 Plus Gold', '750W 80 Plus Gold'], index),
      Case: pick(['Mid Tower mATX', 'Mid Tower ATX', 'Full Tower E-ATX'], index),
      Cooler: pick(['Air Cooler 120mm', 'AIO 240mm', 'AIO 360mm'], index),
    }[component];
    return {
      ...common,
      variantName: componentValue,
      cpu: component === 'CPU' ? componentValue : null,
      ram: component === 'RAM' ? componentValue : null,
      storage: component === 'SSD' ? componentValue : null,
      gpu: component === 'GPU' ? componentValue : null,
      warrantyMonths: 36,
    };
  }

  if (categorySlug === 'dien-thoai') {
    const mobileCpus = [
      'Apple A16 Bionic',
      'Apple A17 Pro',
      'Snapdragon 8 Gen 3',
      'Snapdragon 7+ Gen 3',
      'MediaTek Dimensity 9300',
      'Google Tensor G3',
    ];
    return {
      ...common,
      variantName: `${pick(rams, index)} / ${pick(['128GB', '256GB', '512GB', '1TB'], index)}`,
      cpu: pick(mobileCpus, index),
      ram: pick(['8GB', '12GB', '16GB'], index),
      storage: pick(['128GB', '256GB', '512GB', '1TB'], index),
      gpu: 'Mobile GPU',
      screenSize: pick(['6.1 inch', '6.5 inch', '6.7 inch'], index),
      screenResolution: pick(['2400x1080', '2778x1284', '3120x1440'], index),
      refreshRate: pick(['60Hz', '90Hz', '120Hz'], index),
      operatingSystem: index % 4 === 0 ? 'iOS' : 'Android',
      weightKg: 0.17 + (index % 5) * 0.015,
      warrantyMonths: 12,
    };
  }

  return {
    ...common,
    variantName: `${series} ${pick(['Standard', 'Wireless', 'Pro', 'Gaming'], index - 1)}`,
    warrantyMonths: 12,
    weightKg: 0.15 + (index % 10) * 0.08,
  };
}

async function seed() {
  const perCategory = Number(process.argv[2] || DEFAULT_PER_CATEGORY);
  if (!Number.isInteger(perCategory) || perCategory < 1 || perCategory > 500) {
    throw new Error('Số lượng mỗi category phải là số nguyên từ 1 đến 500');
  }

  const [categories] = await db.execute(
    'SELECT id, name, slug FROM categories WHERE status = ? ORDER BY id',
    ['ACTIVE'],
  );
  const supportedCategories = categories.filter((category) => CATEGORY_CONFIG[category.slug]);
  if (!supportedCategories.length) {
    throw new Error('Không tìm thấy category được hỗ trợ để seed');
  }

  const [brands] = await db.execute(
    'SELECT id, name FROM brands WHERE status = ? ORDER BY id',
    ['ACTIVE'],
  );
  if (!brands.length) throw new Error('Cần ít nhất một brand ACTIVE để seed catalog');

  const beforeCounts = {};
  for (const category of supportedCategories) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) AS count FROM products WHERE category_id = ? AND slug LIKE ?',
      [category.id, `${SEED_PREFIX}-${category.slug}-%`],
    );
    beforeCounts[category.slug] = Number(rows[0].count);
  }

  await db.withTransaction(async (connection) => {
    for (const category of supportedCategories) {
      const config = CATEGORY_CONFIG[category.slug];
      for (let index = 1; index <= perCategory; index += 1) {
        const brand = pick(brands, index + category.id - 2);
        const series = pick(config.series, index - 1);
        const code = pad(index);
        const name = `${brand.name} ${series} ${code}`;
        const slug = `${SEED_PREFIX}-${category.slug}-${code}`;
        const sku = `${SEED_PREFIX}-${category.slug}-${code}`.toUpperCase();
        const description = `${name} thuộc danh mục ${category.name}, dữ liệu catalog phục vụ môi trường phát triển và kiểm thử.`;
        const imageUrl = `https://placehold.co/800x600/F5F7FB/1E293B?text=${encodeURIComponent(name)}`;
        const variant = buildVariant(category.slug, index);

        const [productResult] = await connection.execute(
          `INSERT INTO products
             (category_id, brand_id, name, slug, description, thumbnail_url, status)
           VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
           ON DUPLICATE KEY UPDATE
             id = LAST_INSERT_ID(id), category_id = VALUES(category_id),
             brand_id = VALUES(brand_id), name = VALUES(name),
             description = VALUES(description), thumbnail_url = VALUES(thumbnail_url),
             status = 'ACTIVE'`,
          [category.id, brand.id, name, slug, description, imageUrl],
        );
        const productId = productResult.insertId;

        await connection.execute(
          `INSERT INTO product_variants
             (product_id, sku, variant_name, price, compare_at_price,
              stock_quantity, cpu, ram, storage, gpu, screen_size,
              screen_resolution, refresh_rate, operating_system, color,
              weight_kg, warranty_months, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
           ON DUPLICATE KEY UPDATE
             product_id = VALUES(product_id), variant_name = VALUES(variant_name),
             price = VALUES(price), compare_at_price = VALUES(compare_at_price),
             stock_quantity = VALUES(stock_quantity), cpu = VALUES(cpu),
             ram = VALUES(ram), storage = VALUES(storage), gpu = VALUES(gpu),
             screen_size = VALUES(screen_size),
             screen_resolution = VALUES(screen_resolution),
             refresh_rate = VALUES(refresh_rate),
             operating_system = VALUES(operating_system), color = VALUES(color),
             weight_kg = VALUES(weight_kg),
             warranty_months = VALUES(warranty_months), status = 'ACTIVE'`,
          [
            productId,
            sku,
            variant.variantName,
            variant.price,
            variant.compareAtPrice,
            variant.stockQuantity,
            variant.cpu,
            variant.ram,
            variant.storage,
            variant.gpu,
            variant.screenSize,
            variant.screenResolution,
            variant.refreshRate,
            variant.operatingSystem,
            variant.color,
            variant.weightKg,
            variant.warrantyMonths,
          ],
        );

        await connection.execute(
          `DELETE FROM product_images
           WHERE product_id = ? AND image_url <> ?
             AND image_url LIKE 'https://placehold.co/%'`,
          [productId, imageUrl],
        );
        const [imageRows] = await connection.execute(
          'SELECT id FROM product_images WHERE product_id = ? AND image_url = ? LIMIT 1',
          [productId, imageUrl],
        );
        if (!imageRows[0]) {
          await connection.execute(
            'INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, 0, TRUE)',
            [productId, imageUrl],
          );
        }
      }
    }
  });

  const summary = [];
  for (const category of supportedCategories) {
    const [rows] = await db.execute(
      `SELECT COUNT(DISTINCT p.id) AS products,
              COUNT(DISTINCT pv.id) AS variants,
              COUNT(DISTINCT pi.id) AS images
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       LEFT JOIN product_images pi ON pi.product_id = p.id
       WHERE p.category_id = ? AND p.slug LIKE ?`,
      [category.id, `${SEED_PREFIX}-${category.slug}-%`],
    );
    summary.push({
      category: category.name,
      before: beforeCounts[category.slug],
      products: Number(rows[0].products),
      variants: Number(rows[0].variants),
      images: Number(rows[0].images),
    });
  }

  console.table(summary);
}

seed()
  .then(() => db.pool.end())
  .catch((error) => {
    console.error('Seed catalog failed:', error.message);
    db.pool.end();
    process.exit(1);
  });

