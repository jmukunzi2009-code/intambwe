import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized to update leader highlights' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const name = String(body.name || '').trim();
    const title = String(body.title || '').trim();
    const quote = String(body.quote || '').trim();
    const highlight = String(body.highlight || '').trim();
    const imageUrl = String(body.imageUrl || '').trim() || '/about/profile.png';
    const videoUrl = String(body.videoUrl || '').trim() || null;
    const category = String(body.category || 'Leadership Impact').trim();
    const badge = String(body.badge || 'Featured Leader').trim();
    const sortOrder = Number(body.sortOrder) || 0;

    if (!name || !title || !quote) {
      return NextResponse.json({ error: 'Name, title, and quote are required.' }, { status: 400 });
    }

    const res = await query(
      `UPDATE leader_highlights
       SET name = $2, title = $3, quote = $4, highlight = $5, image_url = $6, video_url = $7,
           category = $8, badge = $9, sort_order = $10, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, name, title, quote, highlight, imageUrl, videoUrl, category, badge, sortOrder]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Leader highlight not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, leader: res.rows[0] });
  } catch (error) {
    console.error('Update leader highlight error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update leader highlight' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized to delete leader highlights' }, { status: 403 });
    }

    const { id } = await params;
    const res = await query('DELETE FROM leader_highlights WHERE id = $1 RETURNING id', [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Leader highlight not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete leader highlight error:', error);
    return NextResponse.json({ error: 'Failed to delete leader highlight' }, { status: 500 });
  }
}
