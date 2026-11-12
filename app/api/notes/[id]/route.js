import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

function cleanMedia(url) {
  const value = String(url || '').trim();
  if (!value) return null;
  const local = value.startsWith('/') && !value.startsWith('//');
  const remote = /^https?:\/\//i.test(value) || value.startsWith('data:');
  if (!local && !remote) return null;
  return value;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await query(
      `SELECT n.*, u.full_name, u.role, sp.school_name,
              COUNT(DISTINCT likes.user_id)::int AS like_count
       FROM stick_notes n
       JOIN users u ON u.id = n.user_id
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       LEFT JOIN stick_note_likes likes ON likes.note_id = n.id
       WHERE n.id = $1
       GROUP BY n.id, u.id, sp.school_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
    }

    return NextResponse.json({ note: result.rows[0] });
  } catch (error) {
    console.error('Note GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch note.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to update this note.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const staff = isStaffRole(user.role);

    const title = String(body.title || '').trim();
    const text = String(body.body || '').trim();
    const noteKind = ['quote', 'speech', 'resource', 'reflection'].includes(body.noteKind) ? body.noteKind : 'quote';
    const mediaUrl = cleanMedia(body.mediaUrl);
    const mediaType = mediaUrl ? (body.mediaType || 'none') : 'none';
    const visibility = staff && ['pending', 'published', 'secret'].includes(body.visibility) ? body.visibility : 'published';

    if (title.length < 2) {
      return NextResponse.json({ error: 'Title must be at least 2 characters.' }, { status: 400 });
    }
    if (text.length < 5) {
      return NextResponse.json({ error: 'Message must be at least 5 characters.' }, { status: 400 });
    }

    const result = await query(
      `UPDATE stick_notes
       SET title = $3, body = $4, note_kind = $5, media_url = $6, media_type = $7,
           visibility = $8, reviewed_by = $9, reviewed_at = NOW()
       WHERE id = $1 AND (user_id = $2 OR $10)
       RETURNING *`,
      [id, user.id, title, text, noteKind, mediaUrl, mediaType, visibility, staff ? user.id : null, staff]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Note not found or permission denied.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'STICK_NOTE_UPDATED',
      entityType: 'stick_notes',
      entityId: id,
      details: { title, noteKind, visibility },
    });

    return NextResponse.json({ success: true, note: result.rows[0] });
  } catch (error) {
    console.error('Note update error:', error);
    return NextResponse.json({ error: 'Failed to update note.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Only staff can moderate notes.' }, { status: 403 });
    }

    const { id } = await params;
    const { visibility } = await request.json();
    if (!['pending', 'published', 'secret'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility value.' }, { status: 400 });
    }

    const result = await query(
      `UPDATE stick_notes
       SET visibility = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, visibility, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'STICK_NOTE_REVIEWED',
      entityType: 'stick_notes',
      entityId: id,
      details: { visibility },
    });

    return NextResponse.json({ success: true, note: result.rows[0] });
  } catch (error) {
    console.error('Note status patch error:', error);
    return NextResponse.json({ error: 'Failed to update note status.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to delete note.' }, { status: 401 });
    }

    const { id } = await params;
    const staff = isStaffRole(user.role);

    const result = await query(
      `DELETE FROM stick_notes
       WHERE id = $1 AND (user_id = $2 OR $3)
       RETURNING id, title`,
      [id, user.id, staff]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Note not found or permission denied.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'STICK_NOTE_DELETED',
      entityType: 'stick_notes',
      entityId: id,
      details: { title: result.rows[0].title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Note delete error:', error);
    return NextResponse.json({ error: 'Failed to delete note.' }, { status: 500 });
  }
}
