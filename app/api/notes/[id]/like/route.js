import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

async function validateRequest(request, params) {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: 'Sign in to like a community note.' }, { status: 401 }) };
  if (!user.is_active) return { response: NextResponse.json({ error: 'This account is suspended.' }, { status: 403 }) };

  const { id } = await params;
  const noteId = Number(id);
  if (!Number.isSafeInteger(noteId) || noteId < 1) {
    return { response: NextResponse.json({ error: 'Choose a valid note.' }, { status: 400 }) };
  }

  const note = await query(
    "SELECT id FROM stick_notes WHERE id = $1 AND visibility = 'published' AND note_kind <> 'reflection'",
    [noteId]
  );
  if (note.rows.length === 0) return { response: NextResponse.json({ error: 'Community note not found.' }, { status: 404 }) };

  return { user, noteId };
}

async function likeState(noteId, userId) {
  const result = await query(
    `SELECT COUNT(*)::int AS like_count,
            BOOL_OR(user_id = $2) AS liked_by_me
     FROM stick_note_likes
     WHERE note_id = $1`,
    [noteId, userId]
  );
  return result.rows[0];
}

export async function POST(_request, { params }) {
  try {
    const access = await validateRequest(_request, params);
    if (access.response) return access.response;

    await query(
      `INSERT INTO stick_note_likes (note_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (note_id, user_id) DO NOTHING`,
      [access.noteId, access.user.id]
    );
    return NextResponse.json({ success: true, ...await likeState(access.noteId, access.user.id) });
  } catch (error) {
    console.error('Like community note error:', error);
    return NextResponse.json({ error: 'Failed to like this note.' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const access = await validateRequest(_request, params);
    if (access.response) return access.response;

    await query('DELETE FROM stick_note_likes WHERE note_id = $1 AND user_id = $2', [access.noteId, access.user.id]);
    return NextResponse.json({ success: true, ...await likeState(access.noteId, access.user.id) });
  } catch (error) {
    console.error('Unlike community note error:', error);
    return NextResponse.json({ error: 'Failed to update your note reaction.' }, { status: 500 });
  }
}
