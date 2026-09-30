async function up(connection) {
  await connection.query(`
    INSERT INTO promotions
      (title, subtitle, image_url, target_type, target_value,
       start_at, end_at, sort_order, status)
    SELECT seed.title, seed.subtitle, seed.image_url, 'CATEGORY', seed.target_value,
           NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), seed.sort_order, 'ACTIVE'
    FROM (
      SELECT 'Laptop cho năm học mới' AS title,
             'Nhiều cấu hình học tập và làm việc' AS subtitle,
             'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80' AS image_url,
             'laptop' AS target_value, 1 AS sort_order
      UNION ALL
      SELECT 'Nâng cấp góc gaming', 'PC và linh kiện sẵn sàng chiến game',
             'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1200&q=80',
             'pc-gaming', 2
      UNION ALL
      SELECT 'Điện thoại mới mỗi ngày', 'Chọn cấu hình phù hợp nhu cầu của bạn',
             'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80',
             'dien-thoai', 3
    ) seed
    WHERE NOT EXISTS (
      SELECT 1 FROM promotions existing WHERE existing.title = seed.title
    )
  `);
}

module.exports = { up };

