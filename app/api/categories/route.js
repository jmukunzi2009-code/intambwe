import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';
import { categorySchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await query(
      `SELECT ac.*,
              COUNT(DISTINCT a.id) as article_count,
              COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'published') as published_article_count
       FROM article_categories ac
       LEFT JOIN articles a ON a.category_id = ac.id
       GROUP BY ac.id
       ORDER BY ac.id ASC`
    );

    return NextResponse.json({ categories: result.rows });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Only staff can manage categories.' }, { status: 403 });
    }

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
      `INSERT INTO article_categories (name, slug, description, icon_name, cover_image_url, video_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        cat.name,
        cat.slug,
        cat.description || null,
        cat.iconName || 'BookOpen',
        cat.coverImageUrl || null,
        cat.videoUrl || null,
        cat.status || 'published',
      ]
    );

    const newCat = result.rows[0];

    await logAudit({
      userId: user.id,
      action: 'CATEGORY_CREATED',
      entityType: 'article_categories',
      entityId: newCat.id,
      details: { name: newCat.name, slug: newCat.slug },
    });

    return NextResponse.json({ success: true, category: { ...newCat, article_count: 0 } }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'A category with this name or slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create category.' }, { status: 500 });
  }
}
