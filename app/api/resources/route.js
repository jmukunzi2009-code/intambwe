import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const all = searchParams.get('all'); // for admin

    let conditions = [];
    const params = [];

    if (!all) {
      conditions.push("r.status = 'active' AND r.is_public = true");
    }

    if (category) {
      params.push(category);
      conditions.push(`rc.slug = $${params.length}`);
    }

    if (type) {
      params.push(type);
      conditions.push(`r.file_type = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const res = await query(
      `SELECT r.*, rc.name as category_name, rc.slug as category_slug
       FROM resources r
       LEFT JOIN resource_categories rc ON r.category_id = rc.id
       ${whereClause}
       ORDER BY r.created_at DESC`,
      params
    );

    const categoriesRes = await query(
      `SELECT rc.id, rc.name, rc.slug, COUNT(r.id) as resource_count
       FROM resource_categories rc
       LEFT JOIN resources r ON rc.id = r.category_id AND r.status = 'active' AND r.is_public = true
       GROUP BY rc.id
       ORDER BY rc.id ASC`
    );

    return NextResponse.json({
      resources: res.rows,
      categories: categoriesRes.rows,
    });
  } catch (error) {
    console.error('Resources API error:', error);
    return NextResponse.json({ error: 'Failed to fetch resources.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.RESOURCES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to add resources.' }, { status: 403 });
    }

    const { title, description, fileType, fileUrl, fileSizeMb, categoryId, isPublic } = await request.json();

    if (typeof title !== 'string' || !title.trim() ||
        typeof fileUrl !== 'string' || !fileUrl.trim()) {
      return NextResponse.json({ error: 'Title and file URL or path are required.' }, { status: 400 });
    }

    const parsedCategoryId = categoryId ? Number(categoryId) : null;
    const parsedFileSizeMb = fileSizeMb === '' || fileSizeMb == null ? null : Number(fileSizeMb);

    const res = await query(
      `INSERT INTO resources (title, description, file_type, file_url, file_size_mb, category_id, is_public, uploaded_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING *`,
      [
        title.trim(),
        (description || '').trim(),
        fileType || 'pdf',
        fileUrl.trim(),
        parsedFileSizeMb,
        parsedCategoryId,
        isPublic !== false,
        user.id,
      ]
    );

    await logAudit({
      userId: user.id,
      action: 'RESOURCE_CREATED',
      entityType: 'resources',
      entityId: res.rows[0].id,
      details: { title, fileType },
    });

    return NextResponse.json({ success: true, resource: res.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create resource error:', error);
    return NextResponse.json({
      error: 'Failed to create resource.',
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.RESOURCES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to update resources.' }, { status: 403 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || body.id;
    if (!id) {
      return NextResponse.json({ error: 'Resource ID is required.' }, { status: 400 });
    }

    const { title, description, fileType, fileUrl, fileSizeMb, categoryId, isPublic, status } = body;

    const res = await query(
      `UPDATE resources
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           file_type = COALESCE($4, file_type),
           file_url = COALESCE($5, file_url),
           file_size_mb = COALESCE($6, file_size_mb),
           category_id = $7,
           is_public = COALESCE($8, is_public),
           status = COALESCE($9, status),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        title ? title.trim() : null,
        description != null ? description.trim() : null,
        fileType || null,
        fileUrl ? fileUrl.trim() : null,
        fileSizeMb != null ? Number(fileSizeMb) : null,
        categoryId ? Number(categoryId) : null,
        isPublic != null ? Boolean(isPublic) : null,
        status || null,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'RESOURCE_UPDATED',
      entityType: 'resources',
      entityId: id,
      details: { title, status },
    });

    return NextResponse.json({ success: true, resource: res.rows[0] });
  } catch (error) {
    console.error('Update resource error:', error);
    return NextResponse.json({ error: 'Failed to update resource.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.RESOURCES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to delete resources.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Resource ID is required.' }, { status: 400 });
    }

    await query('DELETE FROM resources WHERE id = $1', [id]);

    await logAudit({
      userId: user.id,
      action: 'RESOURCE_DELETED',
      entityType: 'resources',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'Resource deleted.' });
  } catch (error) {
    console.error('Delete resource error:', error);
    return NextResponse.json({ error: 'Failed to delete resource.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.RESOURCES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to update resources.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { status, title, description, fileUrl, fileType, isPublic, categoryId } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Resource ID is required.' }, { status: 400 });
    }

    const updates = [];
    const params = [id];

    if (status) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }
    if (title) {
      params.push(title.trim());
      updates.push(`title = $${params.length}`);
    }
    if (description != null) {
      params.push(description.trim());
      updates.push(`description = $${params.length}`);
    }
    if (fileUrl) {
      params.push(fileUrl.trim());
      updates.push(`file_url = $${params.length}`);
    }
    if (fileType) {
      params.push(fileType);
      updates.push(`file_type = $${params.length}`);
    }
    if (typeof isPublic === 'boolean') {
      params.push(isPublic);
      updates.push(`is_public = $${params.length}`);
    }
    if (categoryId !== undefined) {
      params.push(categoryId ? Number(categoryId) : null);
      updates.push(`category_id = $${params.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields provided to update.' }, { status: 400 });
    }

    const res = await query(
      `UPDATE resources SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      params
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'RESOURCE_UPDATED',
      entityType: 'resources',
      entityId: id,
      details: { status, title },
    });

    return NextResponse.json({ success: true, resource: res.rows[0] });
  } catch (error) {
    console.error('Update resource error:', error);
    return NextResponse.json({ error: 'Failed to update resource.' }, { status: 500 });
  }
}
