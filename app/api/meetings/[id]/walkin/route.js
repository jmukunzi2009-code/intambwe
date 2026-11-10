import { NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { getCurrentUser, hashPassword, logAudit } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || !hasPermission(user.role, PERMISSIONS.ATTENDANCE_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to register walk-in delegates.' }, { status: 403 });
    }

    const body = await request.json();
    const { fullName, email, school, classLevel, phone, notes } = body;

    if (!fullName || !email || !school) {
      return NextResponse.json({ error: 'Full name, email, and school are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const result = await transaction(async (client) => {
      // 1. Check or create user
      let userId;
      const userRes = await client.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);

      if (userRes.rows.length > 0) {
        userId = userRes.rows[0].id;
      } else {
        const dummyPasswordHash = await hashPassword('Intambwe2026!');
        const newUserRes = await client.query(
          `INSERT INTO users (full_name, email, password_hash, role, is_active, email_verified)
           VALUES ($1, $2, $3, 'student', true, true)
           RETURNING id`,
          [fullName.trim(), cleanEmail, dummyPasswordHash]
        );
        userId = newUserRes.rows[0].id;
      }

      // 2. Upsert student profile
      await client.query(
        `INSERT INTO student_profiles (user_id, school_name, class_level, country, phone)
         VALUES ($1, $2, $3, 'Rwanda', $4)
         ON CONFLICT (user_id) 
         DO UPDATE SET school_name = EXCLUDED.school_name, class_level = COALESCE(EXCLUDED.class_level, student_profiles.class_level), phone = COALESCE(EXCLUDED.phone, student_profiles.phone)`,
        [userId, school.trim(), classLevel ? classLevel.trim() : 'Delegate', phone ? phone.trim() : null]
      );

      // 3. Register for meeting
      await client.query(
        `INSERT INTO event_registrations (meeting_id, user_id, notes)
         VALUES ($1, $2, $3)
         ON CONFLICT (meeting_id, user_id) DO NOTHING`,
        [id, userId, notes ? notes.trim() : 'On-site Walk-in Registration']
      );

      // 4. Mark attendance immediately as Present
      const attRes = await client.query(
        `INSERT INTO attendance_records (meeting_id, user_id, status, marked_by, notes, marked_at)
         VALUES ($1, $2, 'present', $3, $4, NOW())
         ON CONFLICT (meeting_id, user_id)
         DO UPDATE SET status = 'present', marked_by = EXCLUDED.marked_by, marked_at = NOW(), notes = EXCLUDED.notes
         RETURNING *`,
        [id, userId, user.id, notes ? notes.trim() : 'Walk-in check-in']
      );

      return {
        userId,
        fullName: fullName.trim(),
        email: cleanEmail,
        school: school.trim(),
        classLevel: classLevel || 'Delegate',
        attendance: attRes.rows[0],
      };
    });

    await logAudit({
      userId: user.id,
      action: 'WALKIN_DELEGATE_REGISTERED',
      entityType: 'attendance_records',
      entityId: result.attendance.id,
      details: { meetingId: id, delegateEmail: cleanEmail, school },
    });

    return NextResponse.json({
      success: true,
      message: `Delegate ${fullName} registered and marked Present successfully!`,
      delegate: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Walkin registration error:', error);
    return NextResponse.json({ error: 'Failed to complete on-site registration.' }, { status: 500 });
  }
}
