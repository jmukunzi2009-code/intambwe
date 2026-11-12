import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const res = await query(
      `SELECT * FROM team_members WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC`
    );
    return NextResponse.json({ team: res.rows, members: res.rows });
  } catch (error) {
    console.error('Fetch team members error:', error);
    return NextResponse.json({ error: 'Failed to load team members' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const name = String(body.name || '').trim();
    const role = String(body.role || '').trim();
    const bio = String(body.bio || '').trim();
    const imageUrl = String(body.imageUrl || '').trim() || '/about/profile.png';
    const sortOrder = Number(body.sortOrder) || 0;

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required.' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO team_members (name, role, bio, image_url, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *`,
      [name, role, bio, imageUrl, sortOrder]
    );

    return NextResponse.json({ success: true, member: res.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create team member error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create team member' }, { status: 500 });
  }
}
