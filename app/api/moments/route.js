import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const res = await query(
      `SELECT * FROM community_moments WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC`
    );
    return NextResponse.json({ moments: res.rows });
  } catch (error) {
    console.error('Fetch community moments error:', error);
    return NextResponse.json({ error: 'Failed to load community moments' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const imageUrl = String(body.imageUrl || '').trim() || '/about/group-photo.jpg';
    const authorQuote = String(body.authorQuote || '').trim();
    const authorName = String(body.authorName || '').trim();
    const sortOrder = Number(body.sortOrder) || 0;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO community_moments (title, description, image_url, author_quote, author_name, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING *`,
      [title, description, imageUrl, authorQuote, authorName, sortOrder]
    );

    return NextResponse.json({ success: true, moment: res.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create community moment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create moment' }, { status: 500 });
  }
}
