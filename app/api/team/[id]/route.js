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

    const name = String(body.name || '').trim();
    const role = String(body.role || '').trim();
    const bio = String(body.bio || '').trim();
    const imageUrl = String(body.imageUrl || '').trim();
    const sortOrder = Number(body.sortOrder) || 0;
    const isActive = body.isActive !== false;

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required.' }, { status: 400 });
    }

    const res = await query(
      `UPDATE team_members
       SET name = $1, role = $2, bio = $3, image_url = $4, sort_order = $5, is_active = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, role, bio, imageUrl, sortOrder, isActive, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, member: res.rows[0] });
  } catch (error) {
    console.error('Update team member error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update team member' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await query(`DELETE FROM team_members WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete team member error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete team member' }, { status: 500 });
  }
}
