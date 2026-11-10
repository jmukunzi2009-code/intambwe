import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, createSession, logAudit } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if email already registered
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [validatedData.email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(validatedData.password);

    // Enforce student role on public registration
    const userRole = 'student';

    // Insert user
    const userRes = await query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, true, false)
       RETURNING id, full_name, email, role, created_at`,
      [validatedData.fullName, validatedData.email, hashedPassword, userRole]
    );

    const newUser = userRes.rows[0];

    // Create student profile
    await query(
      `INSERT INTO student_profiles (user_id, school_name, class_level, country, preferred_language, phone)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        newUser.id,
        validatedData.school,
        validatedData.classLevel,
        validatedData.country || 'Rwanda',
        validatedData.preferredLanguage || 'English',
        validatedData.phone || null,
      ]
    );

    // Create session and set HTTP-only cookie
    const userAgent = request.headers.get('user-agent');
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    await createSession(newUser.id, { userAgent, ipAddress });

    // Log audit
    await logAudit({
      userId: newUser.id,
      action: 'USER_REGISTERED',
      entityType: 'users',
      entityId: newUser.id,
      details: { school: validatedData.school, classLevel: validatedData.classLevel },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
      },
      redirectTo: '/dashboard/student',
    });
  } catch (error) {
    console.error('Registration API Error:', error);
    if (error.errors) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
