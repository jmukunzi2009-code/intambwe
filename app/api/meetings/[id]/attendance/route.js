import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || !hasPermission(user.role, PERMISSIONS.ATTENDANCE_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to view attendance.' }, { status: 403 });
    }

    // Fetch all registered participants and their current attendance status
    const res = await query(
      `SELECT er.id as registration_id, er.registered_at,
              u.id as user_id, u.full_name, u.email, u.role, u.is_active,
              sp.school_name, sp.class_level, sp.phone,
              ar.status as attendance_status, ar.marked_at, ar.notes as attendance_notes
       FROM event_registrations er
       JOIN users u ON er.user_id = u.id
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       LEFT JOIN attendance_records ar ON er.meeting_id = ar.meeting_id AND er.user_id = ar.user_id
       WHERE er.meeting_id = $1
       ORDER BY u.full_name ASC`,
      [id]
    );

    return NextResponse.json({ participants: res.rows });
  } catch (error) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance.' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || !hasPermission(user.role, PERMISSIONS.ATTENDANCE_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to mark attendance.' }, { status: 403 });
    }

    const { userId, status, notes } = await request.json();

    if (!['present', 'absent', 'excused', 'late'].includes(status)) {
      return NextResponse.json({ error: 'Invalid attendance status.' }, { status: 400 });
    }

    // Upsert attendance record
    const res = await query(
      `INSERT INTO attendance_records (meeting_id, user_id, status, marked_by, notes, marked_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (meeting_id, user_id)
       DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by, notes = EXCLUDED.notes, marked_at = NOW()
       RETURNING *`,
      [id, userId, status, user.id, notes || null]
    );

    await logAudit({
      userId: user.id,
      action: 'ATTENDANCE_MARKED',
      entityType: 'attendance_records',
      entityId: res.rows[0].id,
      details: { meetingId: id, participantUserId: userId, status },
    });

    return NextResponse.json({ success: true, record: res.rows[0] });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json({ error: 'Failed to mark attendance.' }, { status: 500 });
  }
}
