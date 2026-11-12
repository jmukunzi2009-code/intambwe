import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

const KINDS = ['reflection', 'quote', 'speech', 'resource'];
const VISIBILITY = ['pending', 'published', 'secret'];

function cleanMedia(url) {
  const value = String(url || '').trim();
  if (!value) return null;
  const local = value.startsWith('/') && !value.startsWith('//');
  const remote = /^https?:\/\//i.test(value);
  const dataUri = value.startsWith('data:');
  if (!local && !remote && !dataUri) return null;
  return value;
}

function validNoteInput(body) {
  const title = String(body.title || '').trim();
  const text = String(body.body || '').trim();
  const allowedKinds = ['quote', 'speech', 'resource', 'reflection', 'idea', 'advice'];
  const noteKind = allowedKinds.includes(body.noteKind) ? body.noteKind : 'quote';
  const mediaUrl = cleanMedia(body.mediaUrl);
  let requestedMediaType = ['image', 'pdf', 'video', 'none'].includes(body.mediaType) ? body.mediaType : 'none';
  if (requestedMediaType === 'none' && mediaUrl) {
    if (mediaUrl.toLowerCase().endsWith('.pdf') || mediaUrl.includes('application/pdf')) {
      requestedMediaType = 'pdf';
    } else if (mediaUrl.toLowerCase().endsWith('.mp4') || mediaUrl.includes('youtube') || mediaUrl.includes('vimeo')) {
      requestedMediaType = 'video';
    } else {
      requestedMediaType = 'image';
    }
  }
  const mediaType = mediaUrl ? requestedMediaType : 'none';

  if (title.length < 2 || title.length > 250) {
    return { error: 'The title / author name must be between 2 and 250 characters.' };
  }
  if (text.length < 3 || text.length > 10000) {
    return { error: 'Your note message must be between 3 and 10,000 characters.' };
  }

  return { title, text, noteKind, mediaUrl, mediaType };
}

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const searchParams = new URL(request.url).searchParams;
    const manage = searchParams.get('manage') === '1';
    const mine = searchParams.get('mine') === '1';
    const staff = user && isStaffRole(user.role);

    if (manage && !staff) {
      return NextResponse.json({ error: 'Only staff can review stick notes.' }, { status: 403 });
    }
    if (mine && !user) {
      return NextResponse.json({ error: 'Sign in to view your contributions.' }, { status: 401 });
    }

    const params = [user?.id || null];
    let filter = "WHERE n.visibility = 'published' AND n.note_kind <> 'reflection'";

    if (manage) {
      filter = '';
    } else if (mine) {
      params.push(user.id);
      filter = `WHERE n.user_id = $${params.length} AND n.note_kind <> 'reflection'`;
    }

    const result = await query(
      `SELECT n.*, u.full_name, u.role, sp.school_name,
              COUNT(DISTINCT likes.user_id)::int AS like_count,
              COALESCE(BOOL_OR(my_like.user_id IS NOT NULL), false) AS liked_by_me
       FROM stick_notes n
       JOIN users u ON u.id = n.user_id
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       LEFT JOIN stick_note_likes likes ON likes.note_id = n.id
       LEFT JOIN stick_note_likes my_like ON my_like.note_id = n.id AND my_like.user_id = $1
       ${filter}
       GROUP BY n.id, u.id, sp.school_name
       ORDER BY n.created_at DESC
       LIMIT 200`,
      params
    );

    return NextResponse.json({ notes: result.rows });
  } catch (error) {
    console.error('Stick notes fetch error:', error);
    return NextResponse.json({ error: 'Failed to load stick notes.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to share a stick note.' }, { status: 401 });
    }
    if (!user.is_active) {
      return NextResponse.json({ error: 'This account is suspended.' }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'The contribution form could not be read. Please try again.' }, { status: 400 });
    }

    const input = validNoteInput(body);
    if (input.error) return NextResponse.json({ error: input.error }, { status: 400 });

    const staff = isStaffRole(user.role);
    const visibility = staff && VISIBILITY.includes(body.visibility) ? body.visibility : 'pending';

    const result = await query(
      `INSERT INTO stick_notes (user_id, title, body, note_kind, media_url, media_type, visibility, reviewed_by, reviewed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $7 = 'pending' THEN NULL ELSE NOW() END)
       RETURNING *`,
      [user.id, input.title, input.text, input.noteKind, input.mediaUrl, input.mediaType, visibility, staff && visibility !== 'pending' ? user.id : null]
    );

    await logAudit({
      userId: user.id,
      action: 'STICK_NOTE_CREATED',
      entityType: 'stick_notes',
      entityId: result.rows[0].id,
      details: { title: input.title, visibility, noteKind: input.noteKind },
    });

    return NextResponse.json({
      success: true,
      note: { ...result.rows[0], full_name: user.full_name, role: user.role, school_name: user.school_name || null },
      message: visibility === 'published'
        ? 'Your contribution is now on the community wall.'
        : 'Your contribution was saved and is waiting for staff review.',
    }, { status: 201 });
  } catch (error) {
    console.error('Stick note create error:', error);
    return NextResponse.json({
      error: error?.code === '42P01'
        ? 'The community notes table is missing. Run the database migrations, then try again.'
        : 'We could not save your contribution. Please try again.',
    }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to update a contribution.' }, { status: 401 });
    }

    const body = await request.json();
    const noteId = Number(body.noteId);
    if (!Number.isSafeInteger(noteId) || noteId < 1) {
      return NextResponse.json({ error: 'Choose a valid contribution.' }, { status: 400 });
    }
    const staff = isStaffRole(user.role);

    if (VISIBILITY.includes(body.visibility)) {
      if (!staff) {
        return NextResponse.json({ error: 'Only staff can change contribution visibility.' }, { status: 403 });
      }

      const result = await query(
        `UPDATE stick_notes
         SET visibility = $2, reviewed_by = $3, reviewed_at = NOW()
         WHERE id = $1 AND note_kind <> 'reflection'
         RETURNING *`,
        [noteId, body.visibility, user.id]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Contribution not found or cannot be published.' }, { status: 404 });
      }

      await logAudit({
        userId: user.id,
        action: 'STICK_NOTE_REVIEWED',
        entityType: 'stick_notes',
        entityId: noteId,
        details: { visibility: body.visibility },
      });

      return NextResponse.json({ success: true, note: result.rows[0] });
    }

    const input = validNoteInput(body);
    if (input.error) return NextResponse.json({ error: input.error }, { status: 400 });

    const result = await query(
      `UPDATE stick_notes
       SET title = $3, body = $4, note_kind = $5, media_url = $6, media_type = $7,
           visibility = CASE WHEN $8 THEN visibility ELSE 'pending' END,
           reviewed_by = CASE WHEN $8 THEN reviewed_by ELSE NULL END,
           reviewed_at = CASE WHEN $8 THEN reviewed_at ELSE NULL END
       WHERE id = $1 AND (user_id = $2 OR $8)
         AND note_kind <> 'reflection'
       RETURNING *`,
      [noteId, user.id, input.title, input.text, input.noteKind, input.mediaUrl, input.mediaType, staff]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contribution not found or you do not have permission to edit it.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'STICK_NOTE_UPDATED',
      entityType: 'stick_notes',
      entityId: noteId,
      details: { title: input.title, noteKind: input.noteKind },
    });

    return NextResponse.json({
      success: true,
      note: { ...result.rows[0], full_name: user.full_name, role: user.role, school_name: user.school_name || null },
      message: staff ? 'Contribution updated.' : 'Contribution updated and sent for staff review.',
    });
  } catch (error) {
    console.error('Stick note update error:', error);
    return NextResponse.json({ error: 'We could not update your contribution. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to remove a contribution.' }, { status: 401 });
    }

    const noteId = new URL(request.url).searchParams.get('id');
    const staff = isStaffRole(user.role);
    const result = await query(
      `DELETE FROM stick_notes
       WHERE id = $1 AND (user_id = $2 OR $3)
       RETURNING id, title, user_id`,
      [noteId, user.id, staff]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Stick note not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'STICK_NOTE_DELETED',
      entityType: 'stick_notes',
      entityId: noteId,
      details: { title: result.rows[0].title, deletedByOwner: Number(result.rows[0].user_id) === Number(user.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Stick note delete error:', error);
    return NextResponse.json({ error: 'Failed to delete the stick note.' }, { status: 500 });
  }
}
