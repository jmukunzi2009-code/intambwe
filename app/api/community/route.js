import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';

export async function GET() {
  try {
    const res = await query(
      `SELECT dt.*, u.full_name as author_name, sp.school_name,
              COUNT(dr.id) as response_count
       FROM discussion_topics dt
       JOIN users u ON dt.user_id = u.id
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       LEFT JOIN discussion_responses dr ON dt.id = dr.topic_id AND dr.is_approved = true
       WHERE dt.is_approved = true
       GROUP BY dt.id, u.full_name, sp.school_name
       ORDER BY dt.is_pinned DESC, dt.created_at DESC`
    );

    return NextResponse.json({ topics: res.rows });
  } catch (error) {
    console.error('Community get error:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to post in community dialogues.' }, { status: 401 });
    }

    const { title, content } = await request.json();

    if (!title || !content || content.trim().length < 15) {
      return NextResponse.json({ error: 'Please provide a descriptive title and message (at least 15 characters).' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO discussion_topics (user_id, title, content, is_approved)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [user.id, title.trim(), content.trim()]
    );

    await logAudit({
      userId: user.id,
      action: 'COMMUNITY_TOPIC_CREATED',
      entityType: 'discussion_topics',
      entityId: res.rows[0].id,
      details: { title },
    });

    return NextResponse.json({
      success: true,
      message: 'Dialogue topic posted successfully!',
      topic: res.rows[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Community post error:', error);
    return NextResponse.json({ error: 'Failed to create discussion topic' }, { status: 500 });
  }
}
