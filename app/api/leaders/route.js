import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const res = await query(
      `SELECT * FROM leader_highlights WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC`
    );
    return NextResponse.json({ leaders: res.rows });
  } catch (error) {
    console.error('Fetch leader highlights error:', error);
    return NextResponse.json({ error: 'Failed to load leader highlights' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized to add leader highlights' }, { status: 403 });
    }

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
      `INSERT INTO leader_highlights (name, title, quote, highlight, image_url, video_url, category, badge, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
       RETURNING *`,
      [name, title, quote, highlight, imageUrl, videoUrl, category, badge, sortOrder]
    );

    return NextResponse.json({ success: true, leader: res.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create leader highlight error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create leader highlight' }, { status: 500 });
  }
}
