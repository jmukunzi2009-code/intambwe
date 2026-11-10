import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { meetingSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'upcoming', 'past', or all

    let whereClause = '';
    const params = [];

    if (filter === 'upcoming') {
      whereClause = 'WHERE m.event_date >= CURRENT_DATE';
    } else if (filter === 'past') {
      whereClause = 'WHERE m.event_date < CURRENT_DATE';
    }

    const res = await query(
      `SELECT m.id, m.meeting_number, m.title, m.theme, m.description, m.event_date,
              m.start_time, m.end_time, m.venue, m.capacity, m.status, m.summary,
              m.outcomes, m.recommendations, m.cover_image_url,
              m.video_url,
              COUNT(DISTINCT er.user_id) as registration_count,
              COUNT(DISTINCT ar.user_id) as attendance_count
       FROM meetings m
       LEFT JOIN event_registrations er ON m.id = er.meeting_id
       LEFT JOIN attendance_records ar ON m.id = ar.meeting_id AND ar.status = 'present'
       ${whereClause}
       GROUP BY m.id
       ORDER BY m.event_date DESC`,
      params
    );

    return NextResponse.json({ meetings: res.rows });
  } catch (error) {
    console.error('Meetings API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve meetings.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.MEETINGS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to create meetings.' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = meetingSchema.parse(body);

    const res = await query(
      `INSERT INTO meetings (
        meeting_number, title, theme, description, event_date,
        start_time, end_time, venue, capacity, status,
        summary, outcomes, recommendations, cover_image_url, video_url, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        validatedData.meetingNumber,
        validatedData.title,
        validatedData.theme,
        validatedData.description,
        validatedData.eventDate,
        validatedData.startTime || null,
        validatedData.endTime || null,
        validatedData.venue,
        validatedData.capacity || 100,
        validatedData.status || 'draft',
        validatedData.summary || null,
        validatedData.outcomes || null,
        validatedData.recommendations || null,
        validatedData.coverImageUrl || null,
        validatedData.videoUrl || null,
        user.id,
      ]
    );

    const newMeeting = res.rows[0];

    await logAudit({
      userId: user.id,
      action: 'MEETING_CREATED',
      entityType: 'meetings',
      entityId: newMeeting.id,
      details: { meetingNumber: newMeeting.meeting_number, title: newMeeting.title },
    });

    return NextResponse.json({ success: true, meeting: newMeeting }, { status: 201 });
  } catch (error) {
    console.error('Create meeting error:', error);
    if (error?.issues?.length) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'A conference with this meeting number already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create meeting.' }, { status: 500 });
  }
}
