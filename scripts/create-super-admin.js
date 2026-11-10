require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD;
  const fullName = process.env.SUPER_ADMIN_NAME || 'Irakoze Sarah Divine';

  if (!email || !password) {
    console.error('Error: BOOTSTRAP_ADMIN_EMAIL (or SUPER_ADMIN_EMAIL) and BOOTSTRAP_ADMIN_PASSWORD must be defined in .env.local');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Error: DATABASE_URL is not set.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=') ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pool.connect();

  try {
    console.log('[SuperAdmin] Checking if an initial Super Admin already exists...');
    const checkRes = await client.query(
      "SELECT id, email, full_name FROM users WHERE role = 'super_admin' LIMIT 1"
    );

    if (checkRes.rows.length > 0) {
      console.log(`[SuperAdmin] Setup rejected: A Super Admin already exists in the system (${checkRes.rows[0].email}).`);
      return;
    }

    console.log(`[SuperAdmin] Creating initial Super Admin for ${email}...`);
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await client.query('BEGIN');

    const insertUserRes = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active, email_verified)
       VALUES ($1, $2, $3, 'super_admin', true, true)
       RETURNING id, full_name, email, role, created_at`,
      [fullName, email.toLowerCase().trim(), passwordHash]
    );

    const user = insertUserRes.rows[0];

    // Create profile
    await client.query(
      `INSERT INTO student_profiles (user_id, school_name, class_level, country, bio)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, 'INTAMBWE Leadership Council', 'Executive Director', 'Rwanda', 'Founder and Super Administrator of INTAMBWE.']
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, 'SUPER_ADMIN_BOOTSTRAP', 'users', String(user.id), JSON.stringify({ email: user.email, name: user.full_name })]
    );

    await client.query('COMMIT');
    console.log(`[SuperAdmin] Super Admin created successfully! (ID: ${user.id}, Email: ${user.email})`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SuperAdmin Error] Failed to bootstrap super admin:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

createSuperAdmin().catch((err) => {
  console.error('[SuperAdmin Setup]', err);
  process.exit(1);
});
