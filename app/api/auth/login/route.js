import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, createSession, logAudit } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const res = await query(
      `SELECT u.id, u.full_name, u.email, u.password_hash, u.role, u.is_active
       FROM users u
       WHERE u.email = $1
       LIMIT 1`,
      [validatedData.email]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email address or password.' },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'This account has been deactivated. Please contact an INTAMBWE administrator.' },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(validatedData.password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email address or password.' },
        { status: 401 }
      );
    }

    // Create session
    const userAgent = request.headers.get('user-agent');
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    await createSession(user.id, { userAgent, ipAddress });

    // Log audit
    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'users',
      entityId: user.id,
      details: { email: user.email },
      ipAddress,
    });

    const isStaff = isStaffRole(user.role);
    const redirectTo = isStaff ? '/dashboard/admin' : '/dashboard/student';

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
      redirectTo,
    });
  } catch (error) {
    console.error('Login API Error:', error);
    if (error.errors) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred during sign in.' },
      { status: 500 }
    );
  }
}
