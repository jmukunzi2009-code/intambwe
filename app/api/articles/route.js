import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { articleSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const search = searchParams.get('q');

    let conditions = ["a.status = 'published'"];
    const params = [];

    if (categorySlug) {
      params.push(categorySlug);
      conditions.push(`ac.slug = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(a.title ILIKE $${params.length} OR a.introduction ILIKE $${params.length} OR a.content ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const res = await query(
      `SELECT a.id, a.title, a.slug, a.introduction, a.reading_time_minutes, a.published_at, a.cover_image_url, a.video_url,
              ac.name as category_name, ac.slug as category_slug, ac.icon_name,
              u.full_name as author_name
       FROM articles a
       JOIN article_categories ac ON a.category_id = ac.id
       LEFT JOIN users u ON a.author_id = u.id
       ${whereClause}
       ORDER BY a.published_at DESC`,
      params
    );

    // Also get categories with counts
    const catRes = await query(
      `SELECT ac.id, ac.name, ac.slug, ac.description, ac.icon_name,
              COUNT(a.id) as article_count
       FROM article_categories ac
       LEFT JOIN articles a ON ac.id = a.category_id AND a.status = 'published'
       GROUP BY ac.id
       ORDER BY ac.id ASC`
    );

    return NextResponse.json({
      articles: res.rows,
      categories: catRes.rows,
    });
  } catch (error) {
    console.error('Articles API error:', error);
    return NextResponse.json({ error: 'Failed to fetch articles.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.ARTICLES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to create articles.' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = articleSchema.parse(body);

    const res = await query(
      `INSERT INTO articles (
        category_id, author_id, title, slug, introduction, content,
        learning_objectives, practical_exercises, critical_thinking_questions,
        reflection_activity, reading_time_minutes, status, cover_image_url, video_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        validatedData.categoryId,
        user.id,
        validatedData.title,
        validatedData.slug,
        validatedData.introduction,
        validatedData.content,
        validatedData.learningObjectives || null,
        validatedData.practicalExercises || null,
        validatedData.criticalThinkingQuestions || null,
        validatedData.reflectionActivity || null,
        validatedData.readingTimeMinutes || 5,
        validatedData.status || 'draft',
        validatedData.coverImageUrl || null,
        validatedData.videoUrl || null,
      ]
    );

    const newArticle = res.rows[0];

    await logAudit({
      userId: user.id,
      action: 'ARTICLE_CREATED',
      entityType: 'articles',
      entityId: newArticle.id,
      details: { title: newArticle.title, slug: newArticle.slug },
    });

    return NextResponse.json({ success: true, article: newArticle }, { status: 201 });
  } catch (error) {
    console.error('Create article error:', error);
    if (error?.issues?.length) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create article.' }, { status: 500 });
  }
}
