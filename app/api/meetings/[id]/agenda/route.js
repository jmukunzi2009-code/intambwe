import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const res = await query(
      `SELECT * FROM agenda_items WHERE meeting_id = $1 ORDER BY sort_order ASC, start_time ASC`,
      [id]
    );
    return NextResponse.json({ agenda: res.rows });
  } catch (error) {
    console.error('Fetch agenda error:', error);
    return NextResponse.json({ error: 'Failed to fetch agenda' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || !hasPermission(user.role, PERMISSIONS.AGENDA_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to modify agendas.' }, { status: 403 });
    }

    const { sessionTitle, description, startTime, endTime, speakerName, facilitatorName, sortOrder } = await request.json();

    if (!sessionTitle) {
      return NextResponse.json({ error: 'Session title is required.' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO agenda_items (meeting_id, session_title, description, start_time, end_time, speaker_name, facilitator_name, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        sessionTitle,
        description || null,
        startTime || null,
        endTime || null,
        speakerName || null,
        facilitatorName || null,
        sortOrder || 0,
      ]
    );

    await logAudit({
      userId: user.id,
      action: 'AGENDA_ITEM_CREATED',
      entityType: 'agenda_items',
      entityId: res.rows[0].id,
      details: { meetingId: id, sessionTitle },
    });

    return NextResponse.json({ success: true, item: res.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create agenda item error:', error);
    return NextResponse.json({ error: 'Failed to create agenda item' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || !hasPermission(user.role, PERMISSIONS.AGENDA_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required.' }, { status: 400 });
    }

    await query('DELETE FROM agenda_items WHERE id = $1 AND meeting_id = $2', [itemId, id]);

    return NextResponse.json({ success: true, message: 'Agenda session removed.' });
  } catch (error) {
    console.error('Delete agenda error:', error);
    return NextResponse.json({ error: 'Failed to delete agenda item' }, { status: 500 });
  }
}
