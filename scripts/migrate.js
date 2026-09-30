require('dotenv').config();

const fs = require('fs');
const path = require('path');
const db = require('../src/common/common');

const migrationsDirectory = path.join(__dirname, '..', 'migrations');

async function migrate() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  const [appliedRows] = await db.execute(
    'SELECT name FROM schema_migrations ORDER BY name',
  );
  const applied = new Set(appliedRows.map((row) => row.name));
  const files = fs
    .readdirSync(migrationsDirectory)
    .filter((file) => /^\d+.*\.js$/.test(file))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip ${file}`);
      continue;
    }

    const migration = require(path.join(migrationsDirectory, file));
    if (typeof migration.up !== 'function') {
      throw new Error(`Migration ${file} không export hàm up(connection)`);
    }

    const connection = await db.getConnection();
    try {
      await migration.up(connection);
      await connection.execute(
        'INSERT INTO schema_migrations (name) VALUES (?)',
        [file],
      );
      console.log(`applied ${file}`);
    } finally {
      connection.release();
    }
  }
}

migrate()
  .then(() => db.pool.end())
  .catch((error) => {
    console.error('Migration failed:', error);
    db.pool.end();
    process.exit(1);
  });

