require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Error: DATABASE_URL is not set in environment or .env.local');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=') ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pool.connect();

  try {
    console.log('[Migration] Connected to Neon PostgreSQL.');

    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const res = await client.query(
        'SELECT id FROM schema_migrations WHERE migration_name = $1',
        [file]
      );

      if (res.rows.length > 0) {
        console.log(`[Migration] Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`[Migration] Executing ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[Migration] Successfully executed ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migration Error] Failed executing ${file}:`, err);
        throw err;
      }
    }

    console.log('[Migration] All migrations completed successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('[Migration Error]', err);
  process.exit(1);
});
