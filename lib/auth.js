import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { query } from './db.js';

const SESSION_COOKIE_NAME = 'intambwe_session';
const SESSION_DURATION_DAYS = 7;

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(plainText) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compare plain text password with hashed password
 */
export async function comparePassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

/**
 * Generate a cryptographically secure random session token
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new user session in DB and set HTTP-only cookie
 */
export async function createSession(userId, reqInfo = {}) {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await query(
    `INSERT INTO sessions (user_id, session_token, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, token, expiresAt, reqInfo.userAgent || null, reqInfo.ipAddress || null]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

/**
 * Destroy current session and remove cookie
 */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await query('DELETE FROM sessions WHERE session_token = $1', [token]);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Retrieve the current authenticated user from session cookie
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const res = await query(
      `SELECT u.id, u.full_name, u.email, u.role, u.is_active, u.created_at,
              sp.school_name, sp.class_level, sp.country, sp.phone, sp.bio
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE s.session_token = $1 AND s.expires_at > NOW() AND u.is_active = true
       LIMIT 1`,
      [token]
    );

    if (res.rows.length === 0) {
      return null;
    }

    return res.rows[0];
  } catch (err) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Error fetching current user:', err);
    return null;
  }
}

/**
 * Record an audit log entry
 */
export async function logAudit({ userId, action, entityType, entityId, details, ipAddress }) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, action, entityType || null, entityId ? String(entityId) : null, details ? JSON.stringify(details) : null, ipAddress || null]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
