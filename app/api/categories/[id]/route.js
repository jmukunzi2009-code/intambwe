import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';
import { categorySchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Only staff can edit categories.' }, { status: 403 });
    }

    const { id } = await params;
    const catId = Number(id);
    const body = await request.json();
    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const cat = parsed.data;
    const result = await query(
      `UPDATE article_categories
       SET name = $2, slug = $3, description = $4, icon_name = $5,
           cover_image_url = $6, video_url = $7, status = $8
       WHERE id = $1
       RETURNING *`,
      [
        catId,
        cat.name,
        cat.slug,
        cat.description || null,
        cat.iconName || 'BookOpen',
        cat.coverImageUrl || null,
        cat.videoUrl || null,
        cat.status || 'published',
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'CATEGORY_UPDATED',
      entityType: 'article_categories',
      entityId: catId,
      details: { name: cat.name, slug: cat.slug },
    });

    return NextResponse.json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error('Update category error:', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'A category with this name or slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update category.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Only staff can delete categories.' }, { status: 403 });
    }

    const { id } = await params;
    const catId = Number(id);

    // Unlink referencing articles first
    await query('UPDATE articles SET category_id = NULL WHERE category_id = $1', [catId]);
    await query('DELETE FROM course_enrollments WHERE category_id = $1', [catId]);

    const result = await query(
      'DELETE FROM article_categories WHERE id = $1 RETURNING id, name',
      [catId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'CATEGORY_DELETED',
      entityType: 'article_categories',
      entityId: catId,
      details: { name: result.rows[0].name },
    });

    return NextResponse.json({ success: true, message: `Category "${result.rows[0].name}" deleted.` });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category.' }, { status: 500 });
  }
}
