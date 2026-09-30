async function up(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS component_specs (
      product_variant_id BIGINT UNSIGNED PRIMARY KEY,
      component_type ENUM(
        'CPU', 'MAINBOARD', 'RAM', 'GPU', 'STORAGE', 'PSU', 'CASE',
        'COOLER', 'MONITOR', 'KEYBOARD', 'MOUSE'
      ) NOT NULL,
      socket VARCHAR(50),
      memory_type VARCHAR(30),
      max_memory_gb INT UNSIGNED,
      memory_slots INT UNSIGNED,
      tdp_watts INT UNSIGNED,
      recommended_psu_watts INT UNSIGNED,
      length_mm INT UNSIGNED,
      max_gpu_length_mm INT UNSIGNED,
      psu_watts INT UNSIGNED,
      form_factor VARCHAR(50),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_component_specs_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
      INDEX idx_component_specs_type (component_type),
      INDEX idx_component_specs_socket (socket),
      INDEX idx_component_specs_memory (memory_type)
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS laptop_upgrade_profiles (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      product_id BIGINT UNSIGNED NOT NULL UNIQUE,
      base_ram_gb INT UNSIGNED NOT NULL,
      max_ram_gb INT UNSIGNED NOT NULL,
      ram_type VARCHAR(30) NOT NULL,
      ram_slots INT UNSIGNED NOT NULL,
      base_storage_gb INT UNSIGNED NOT NULL,
      max_storage_gb INT UNSIGNED NOT NULL,
      storage_slots INT UNSIGNED NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_laptop_upgrade_profile_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS laptop_upgrade_options (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      laptop_product_id BIGINT UNSIGNED NOT NULL,
      type ENUM('RAM', 'SSD') NOT NULL,
      label VARCHAR(100) NOT NULL,
      capacity_gb INT UNSIGNED NOT NULL,
      price_delta DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_laptop_upgrade_option_product
        FOREIGN KEY (laptop_product_id) REFERENCES products(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
      UNIQUE KEY uq_laptop_upgrade_option
        (laptop_product_id, type, capacity_gb),
      INDEX idx_laptop_upgrade_option_status (status)
    ) ENGINE=InnoDB
  `);

  const [componentRows] = await connection.execute(`
    SELECT p.id AS product_id, p.slug, pv.id AS variant_id, pv.variant_name
    FROM products p
    JOIN categories c ON c.id = p.category_id AND c.slug = 'linh-kien'
    JOIN product_variants pv ON pv.product_id = p.id AND pv.status = 'ACTIVE'
    WHERE p.slug LIKE 'seed60-linh-kien-%'
    ORDER BY p.slug
  `);
  const types = ['CPU', 'RAM', 'STORAGE', 'GPU', 'MAINBOARD', 'PSU', 'CASE', 'COOLER'];
  for (const row of componentRows) {
    const index = Number(String(row.slug).split('-').pop());
    const type = types[(index - 1) % types.length];
    const platform = Math.floor((index - 1) / types.length) % 2;
    const socket = platform === 0 ? 'AM5' : 'LGA1700';
    const memoryType = platform === 0 ? 'DDR5' : 'DDR4';
    const spec = {
      socket: ['CPU', 'MAINBOARD', 'COOLER'].includes(type) ? socket : null,
      memoryType: ['MAINBOARD', 'RAM'].includes(type) ? memoryType : null,
      maxMemoryGb: type === 'MAINBOARD' ? (memoryType === 'DDR5' ? 192 : 128) : null,
      memorySlots: type === 'MAINBOARD' ? 4 : null,
      tdpWatts: type === 'CPU' ? 65 + (index % 3) * 40 : null,
      recommendedPsuWatts: type === 'GPU' ? 550 + (index % 3) * 100 : null,
      lengthMm: type === 'GPU' ? 240 + (index % 5) * 20 : null,
      maxGpuLengthMm: type === 'CASE' ? 320 + (index % 3) * 30 : null,
      psuWatts: type === 'PSU' ? 550 + (index % 3) * 100 : null,
      formFactor:
        type === 'MAINBOARD' ? (index % 2 === 0 ? 'ATX' : 'mATX') :
          type === 'CASE' ? 'ATX' : null,
    };
    await connection.execute(
      `INSERT INTO component_specs
         (product_variant_id, component_type, socket, memory_type,
          max_memory_gb, memory_slots, tdp_watts, recommended_psu_watts,
          length_mm, max_gpu_length_mm, psu_watts, form_factor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         component_type = VALUES(component_type), socket = VALUES(socket),
         memory_type = VALUES(memory_type), max_memory_gb = VALUES(max_memory_gb),
         memory_slots = VALUES(memory_slots), tdp_watts = VALUES(tdp_watts),
         recommended_psu_watts = VALUES(recommended_psu_watts),
         length_mm = VALUES(length_mm),
         max_gpu_length_mm = VALUES(max_gpu_length_mm),
         psu_watts = VALUES(psu_watts), form_factor = VALUES(form_factor)`,
      [
        row.variant_id, type, spec.socket, spec.memoryType,
        spec.maxMemoryGb, spec.memorySlots, spec.tdpWatts,
        spec.recommendedPsuWatts, spec.lengthMm, spec.maxGpuLengthMm,
        spec.psuWatts, spec.formFactor,
      ],
    );
  }

  const [laptops] = await connection.execute(`
    SELECT p.id, pv.ram, pv.storage
    FROM products p
    JOIN categories c ON c.id = p.category_id AND c.slug = 'laptop'
    JOIN product_variants pv ON pv.id = (
      SELECT candidate.id FROM product_variants candidate
      WHERE candidate.product_id = p.id AND candidate.status = 'ACTIVE'
      ORDER BY candidate.price, candidate.id LIMIT 1
    )
    WHERE p.status = 'ACTIVE'
  `);
  for (const laptop of laptops) {
    const baseRam = Number(String(laptop.ram || '8').match(/\d+/)?.[0] || 8);
    const storageMatch = String(laptop.storage || '512').match(/\d+/)?.[0] || '512';
    const baseStorage = /TB/i.test(laptop.storage || '')
      ? Number(storageMatch) * 1024
      : Number(storageMatch);
    const ramType = /DDR5/i.test(laptop.ram || '') ? 'DDR5' : 'DDR4';
    await connection.execute(
      `INSERT INTO laptop_upgrade_profiles
         (product_id, base_ram_gb, max_ram_gb, ram_type, ram_slots,
          base_storage_gb, max_storage_gb, storage_slots)
       VALUES (?, ?, ?, ?, 2, ?, 2048, 2)
       ON DUPLICATE KEY UPDATE
         base_ram_gb = VALUES(base_ram_gb), max_ram_gb = VALUES(max_ram_gb),
         ram_type = VALUES(ram_type), ram_slots = VALUES(ram_slots),
         base_storage_gb = VALUES(base_storage_gb),
         max_storage_gb = VALUES(max_storage_gb),
         storage_slots = VALUES(storage_slots)`,
      [laptop.id, baseRam, baseRam <= 16 ? 32 : 64, ramType, baseStorage],
    );
    const options = [
      ['RAM', 16, 'Nâng cấp RAM 16GB', 900000],
      ['RAM', 32, 'Nâng cấp RAM 32GB', 1900000],
      ['RAM', 64, 'Nâng cấp RAM 64GB', 3900000],
      ['SSD', 1024, 'Nâng cấp SSD 1TB', 1500000],
      ['SSD', 2048, 'Nâng cấp SSD 2TB', 3200000],
    ];
    for (const [type, capacity, label, price] of options) {
      await connection.execute(
        `INSERT INTO laptop_upgrade_options
           (laptop_product_id, type, label, capacity_gb, price_delta, status)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE')
         ON DUPLICATE KEY UPDATE
           label = VALUES(label), price_delta = VALUES(price_delta),
           status = 'ACTIVE'`,
        [laptop.id, type, label, capacity, price],
      );
    }
  }
}

module.exports = { up };
