import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { randomBytes } from 'node:crypto';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized to generate certificates.' }, { status: 403 });
    }

    const { userId, meetingId, articleId, customTitle } = await request.json();
    if (!hasPermission(user.role, PERMISSIONS.CERTIFICATES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to generate certificates.' }, { status: 403 });
    }

    if (articleId) {
      return NextResponse.json({
        error: 'Course certificates are awarded automatically only after completing every lesson and passing the course final test.',
      }, { status: 400 });
    }

    const recipientId = userId;
    if (!recipientId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }
    if (!meetingId) {
      return NextResponse.json({ error: 'A conference certificate is required.' }, { status: 400 });
    }

    // Fetch user and meeting details
    const userRes = await query('SELECT full_name, email FROM users WHERE id = $1', [recipientId]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    const student = userRes.rows[0];

    let meetingTitle = customTitle || 'Exemplary Youth Leadership & Civic Engagement';
    if (meetingId) {
      const attendance = await query(
        `SELECT m.title
         FROM attendance_records ar
         JOIN meetings m ON m.id = ar.meeting_id
         WHERE ar.meeting_id = $1 AND ar.user_id = $2 AND ar.status = 'present'`,
        [meetingId, recipientId]
      );
      if (attendance.rows.length === 0) {
        return NextResponse.json({ error: 'A conference certificate can only be issued to a student whose attendance is marked present.' }, { status: 403 });
      }
      meetingTitle = attendance.rows[0].title;
    } else {
      return NextResponse.json({ error: 'A conference certificate is required.' }, { status: 400 });
    }

    const existing = await query(
      'SELECT * FROM certificates WHERE user_id = $1 AND meeting_id = $2',
      [recipientId, meetingId]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Certificate already issued for this achievement.',
        certificate: existing.rows[0],
        verificationUrl: `/certificates/${existing.rows[0].certificate_code}`,
      });
    }

    // Generate unique code
    const randomSuffix = randomBytes(5).toString('hex').toUpperCase();
    const certCode = `INT-CERT-${new Date().getFullYear()}-${randomSuffix}`;
    const verificationUrl = `/certificates/${certCode}`;

    const res = await query(
      `INSERT INTO certificates (user_id, meeting_id, certificate_code, title, issue_date, verification_url)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, $5)
       RETURNING *`,
      [recipientId, meetingId, certCode, meetingTitle, verificationUrl]
    );

    const newCert = res.rows[0];

    await logAudit({
      userId: user.id,
      action: 'CERTIFICATE_GENERATED',
      entityType: 'certificates',
      entityId: newCert.id,
      details: { recipientEmail: student.email, certCode, meetingTitle, meetingId },
    });

    return NextResponse.json({
      success: true,
      message: `Official certificate generated for ${student.full_name}!`,
      certificate: newCert,
      verificationUrl,
    }, { status: 201 });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json({ error: 'Failed to generate certificate.' }, { status: 500 });
  }
}
