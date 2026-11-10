import { Pool } from 'pg';

let pool;

if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=') 
      ? { rejectUnauthorized: false } 
      : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

pool = global._pgPool;

/**
 * Execute parameterized SQL query
 * @param {string} text - SQL query with $1, $2 placeholders
 * @param {Array} params - Parameter values
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 500) {
      console.warn(`[Slow Query] ${duration}ms: ${text.slice(0, 80)}...`);
    }
    return res;
  } catch (error) {
    console.error('[DB Query Error]', { text: text.slice(0, 100), error: error.message });
    throw error;
  }
}

/**
 * Execute operations within a database transaction
 * @param {Function} callback - Async function that receives client
 */
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
