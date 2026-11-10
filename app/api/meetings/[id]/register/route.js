import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to register for an event.' }, { status: 401 });
    }

    // Verify meeting exists and allows registration
    const meetingRes = await query('SELECT * FROM meetings WHERE id = $1', [id]);
    if (meetingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 });
    }

    const meeting = meetingRes.rows[0];
    if (meeting.status === 'registration_closed' || meeting.status === 'completed' || meeting.status === 'cancelled') {
      return NextResponse.json({ error: `Registration is not open for this event (Status: ${meeting.status}).` }, { status: 400 });
    }

    // Check existing registration
    const regRes = await query(
      'SELECT id FROM event_registrations WHERE meeting_id = $1 AND user_id = $2',
      [id, user.id]
    );

    if (regRes.rows.length > 0) {
      return NextResponse.json({ error: 'You are already registered for this conference.' }, { status: 409 });
    }

    // Register user
    await query(
      'INSERT INTO event_registrations (meeting_id, user_id) VALUES ($1, $2)',
      [id, user.id]
    );

    await logAudit({
      userId: user.id,
      action: 'EVENT_REGISTRATION',
      entityType: 'meetings',
      entityId: id,
      details: { meetingTitle: meeting.title },
    });

    return NextResponse.json({
      success: true,
      message: `You have successfully registered for ${meeting.title}!`,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to complete registration.' }, { status: 500 });
  }
}
