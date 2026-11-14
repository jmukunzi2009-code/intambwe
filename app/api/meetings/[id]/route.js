import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { meetingSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const meetingRes = await query(
      `SELECT m.*, 
              COUNT(DISTINCT er.user_id) as registration_count,
              COUNT(DISTINCT ar.user_id) as attendance_count
       FROM meetings m
       LEFT JOIN event_registrations er ON m.id = er.meeting_id
       LEFT JOIN attendance_records ar ON m.id = ar.meeting_id AND ar.status = 'present'
       WHERE m.id = $1
       GROUP BY m.id`,
      [id]
    );

    if (meetingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    const meeting = meetingRes.rows[0];

    // Fetch agenda items
    const agendaRes = await query(
      `SELECT * FROM agenda_items WHERE meeting_id = $1 ORDER BY sort_order ASC, start_time ASC`,
      [id]
    );

    // Fetch speakers
    const speakersRes = await query(
      `SELECT * FROM meeting_speakers WHERE meeting_id = $1 ORDER BY sort_order ASC`,
      [id]
    );

    return NextResponse.json({
      meeting,
      agenda: agendaRes.rows,
      speakers: speakersRes.rows,
    });
  } catch (error) {
    console.error('Get meeting detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.MEETINGS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const deleted = await query('DELETE FROM meetings WHERE id = $1 RETURNING id, title', [id]);
    if (deleted.rows.length === 0) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'MEETING_DELETED',
      entityType: 'meetings',
      entityId: id,
      details: { title: deleted.rows[0].title },
    });

    return NextResponse.json({ success: true, message: 'Meeting deleted successfully.' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    return NextResponse.json({ error: 'Failed to delete meeting.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.MEETINGS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { status } = await request.json();
    if (!['draft', 'published', 'registration_open', 'registration_closed', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid conference status.' }, { status: 400 });
    }

    const result = await query(
      `UPDATE meetings SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'MEETING_STATUS_CHANGED',
      entityType: 'meetings',
      entityId: id,
      details: { status },
    });

    return NextResponse.json({ success: true, meeting: result.rows[0] });
  } catch (error) {
    console.error('Patch meeting error:', error);
    return NextResponse.json({ error: 'Failed to update meeting status.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.MEETINGS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.meetingNumber) {
      body.meetingNumber = `INT-CONF-${new Date().getFullYear()}-${id}`;
    }
    if (!body.theme) {
      body.theme = body.title ? `Theme: ${body.title}` : 'Youth Leadership';
    }
    if (!body.description) {
      body.description = 'INTAMBWE Leadership Conference';
    }
    if (!body.venue) {
      body.venue = 'Rwamagana, Eastern Province, Rwanda';
    }
    if (!body.eventDate) {
      body.eventDate = new Date().toISOString().slice(0, 10);
    }

    const { data, success, error } = meetingSchema.safeParse(body);
    if (!success) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    const result = await query(
      `UPDATE meetings
       SET meeting_number = $2, title = $3, theme = $4, description = $5, event_date = $6,
           start_time = $7, end_time = $8, venue = $9, capacity = $10, status = $11,
           summary = $12, outcomes = $13, recommendations = $14,
           cover_image_url = $15, video_url = $16, gallery_urls = $17::jsonb, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        data.meetingNumber,
        data.title,
        data.theme || 'Youth Leadership',
        data.description || 'Leadership conference',
        data.eventDate || new Date().toISOString().slice(0, 10),
        data.startTime || '09:00',
        data.endTime || '16:00',
        data.venue || 'Rwamagana, Eastern Province, Rwanda',
        data.capacity || 200,
        data.status || 'published',
        data.summary || null,
        data.outcomes || null,
        data.recommendations || null,
        data.coverImageUrl || null,
        data.videoUrl || null,
        JSON.stringify(data.galleryUrls || []),
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'MEETING_UPDATED',
      entityType: 'meetings',
      entityId: id,
      details: { meetingNumber: data.meetingNumber, title: data.title },
    });

    return NextResponse.json({ success: true, meeting: result.rows[0] });
  } catch (error) {
    console.error('Update meeting error:', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'A conference with this meeting number already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update meeting.' }, { status: 500 });
  }
}
