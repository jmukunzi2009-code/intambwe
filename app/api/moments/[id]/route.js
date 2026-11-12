import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const imageUrl = String(body.imageUrl || '').trim();
    const authorQuote = String(body.authorQuote || '').trim();
    const authorName = String(body.authorName || '').trim();
    const sortOrder = Number(body.sortOrder) || 0;
    const isActive = body.isActive !== false;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
    }

    const res = await query(
      `UPDATE community_moments
       SET title = $1, description = $2, image_url = $3, author_quote = $4, author_name = $5, sort_order = $6, is_active = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, description, imageUrl, authorQuote, authorName, sortOrder, isActive, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Community moment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, moment: res.rows[0] });
  } catch (error) {
    console.error('Update community moment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update moment' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await query(`DELETE FROM community_moments WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete community moment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete moment' }, { status: 500 });
  }
}
