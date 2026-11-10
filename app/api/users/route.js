import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, hashPassword, logAudit } from '@/lib/auth';
import { hasPermission, PERMISSIONS, ROLES } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.USERS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const res = await query(
      `SELECT u.id, u.full_name, u.email, u.role, u.is_active, u.email_verified, u.created_at,
              sp.school_name, sp.class_level, sp.country, sp.phone
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       ORDER BY u.created_at DESC`
    );

    return NextResponse.json({ users: res.rows });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Only the Super Admin can create staff accounts.' }, { status: 403 });
    }

    const { fullName, email, password, role } = await request.json();

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const res = await query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, true, true)
       RETURNING id, full_name, email, role, created_at`,
      [fullName, email.toLowerCase().trim(), passwordHash, role]
    );

    const newStaff = res.rows[0];

    await logAudit({
      userId: user.id,
      action: 'STAFF_ACCOUNT_CREATED',
      entityType: 'users',
      entityId: newStaff.id,
      details: { email: newStaff.email, role: newStaff.role },
    });

    return NextResponse.json({ success: true, user: newStaff }, { status: 201 });
  } catch (error) {
    console.error('Create staff error:', error);
    return NextResponse.json({ error: 'Failed to create staff account.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to modify users.' }, { status: 403 });
    }

    const { targetUserId, isActive, role } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required.' }, { status: 400 });
    }

    // Protect Super Admin from being altered by non-super-admins
    const targetUserRes = await query('SELECT role FROM users WHERE id = $1', [targetUserId]);
    if (targetUserRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (targetUserRes.rows[0].role === ROLES.SUPER_ADMIN && user.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Cannot modify Super Admin accounts.' }, { status: 403 });
    }

    const updates = [];
    const params = [targetUserId];

    if (typeof isActive === 'boolean') {
      params.push(isActive);
      updates.push(`is_active = $${params.length}`);
    }

    if (role && user.role === ROLES.SUPER_ADMIN) {
      params.push(role);
      updates.push(`role = $${params.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1`,
      params
    );

    await logAudit({
      userId: user.id,
      action: 'USER_UPDATED',
      entityType: 'users',
      entityId: targetUserId,
      details: { isActive, role },
    });

    return NextResponse.json({ success: true, message: 'User updated successfully.' });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}
