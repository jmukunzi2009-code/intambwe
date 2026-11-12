import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.CERTIFICATES_MANAGE)) {
      return NextResponse.json({ error: 'Only staff can issue conference certificates.' }, { status: 403 });
    }

    const { meetingId } = await request.json();
    if (!meetingId) {
      return NextResponse.json({ error: 'Choose a conference first.' }, { status: 400 });
    }

    const meetingRes = await query('SELECT id, title, theme FROM meetings WHERE id = $1', [meetingId]);
    if (meetingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Conference not found.' }, { status: 404 });
    }
    const meeting = meetingRes.rows[0];

    const people = await query(
      `SELECT u.id, u.full_name, u.email
       FROM attendance_records ar
       JOIN users u ON u.id = ar.user_id
       WHERE ar.meeting_id = $1 AND ar.status IN ('present', 'late')
       ORDER BY u.full_name ASC`,
      [meetingId]
    );

    let issued = 0;
    let alreadyIssued = 0;
    const certificates = [];

    for (const person of people.rows) {
      const existing = await query(
        'SELECT * FROM certificates WHERE user_id = $1 AND meeting_id = $2',
        [person.id, meetingId]
      );
      if (existing.rows.length > 0) {
        alreadyIssued += 1;
        certificates.push(existing.rows[0]);
        continue;
      }

      const certCode = `INT-CERT-${new Date().getFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
      const created = await query(
        `INSERT INTO certificates (user_id, meeting_id, certificate_code, title, issue_date, verification_url, certificate_kind)
         VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'conference')
         RETURNING *`,
        [person.id, meetingId, certCode, meeting.title, `/certificates/${certCode}`]
      );
      issued += 1;
      certificates.push(created.rows[0]);
    }

    await logAudit({
      userId: user.id,
      action: 'CONFERENCE_CERTIFICATES_ISSUED',
      entityType: 'meetings',
      entityId: meetingId,
      details: { title: meeting.title, issued, alreadyIssued, eligible: people.rows.length },
    });

    return NextResponse.json({
      success: true,
      issued,
      alreadyIssued,
      eligible: people.rows.length,
      message: people.rows.length === 0
        ? 'Mark delegates present or late before certificates can be issued.'
        : `Issued ${issued} certificate${issued === 1 ? '' : 's'} for “${meeting.title}”. ${alreadyIssued} were already on record. Each person can open theirs from their student portal.`,
      certificates,
    });
  } catch (error) {
    console.error('Conference certificate batch error:', error);
    return NextResponse.json({ error: 'Failed to issue conference certificates.' }, { status: 500 });
  }
}
