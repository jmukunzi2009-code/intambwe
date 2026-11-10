require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function seedCert() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query(`
      INSERT INTO certificates (user_id, meeting_id, certificate_code, title, issue_date, verification_url)
      SELECT u.id, m.id, 'INT-CERT-2026-001', 'Certificate of Exemplary Leadership & Participation', CURRENT_DATE, '/certificates/INT-CERT-2026-001'
      FROM users u, meetings m 
      WHERE u.role = 'super_admin' AND m.meeting_number = 'INT-CONF-2026-01'
      LIMIT 1
      ON CONFLICT (certificate_code) DO NOTHING;
    `);
    console.log('Seeded demo certificate INT-CERT-2026-001');
  } finally {
    await pool.end();
  }
}

seedCert().catch(console.error);
