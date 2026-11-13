import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { articleSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const isNumeric = /^\d+$/.test(id);
    const whereClause = isNumeric ? 'WHERE a.id = $1' : 'WHERE a.slug = $1';

    const result = await query(
      `SELECT a.*,
              ac.name AS category_name, ac.slug AS category_slug, ac.icon_name,
              u.full_name AS author_name, u.role AS author_role
       FROM articles a
       JOIN article_categories ac ON a.category_id = ac.id
       LEFT JOIN users u ON a.author_id = u.id
       ${whereClause}`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    const article = result.rows[0];
    const related = await query(
      `SELECT a.id, a.title, a.slug, a.reading_time_minutes, a.published_at, ac.name AS category_name
       FROM articles a
       JOIN article_categories ac ON a.category_id = ac.id
       WHERE a.category_id = $1 AND a.id != $2 AND a.status = 'published'
       LIMIT 3`,
      [article.category_id, article.id]
    );

    return NextResponse.json({ article, related: related.rows });
  } catch (error) {
    console.error('Article fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch article.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.ARTICLES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to update articles.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    if (!body.introduction && body.content) {
      body.introduction = body.content.slice(0, 220).replace(/\n+/g, ' ').trim();
    }
    if (!body.slug && body.title) {
      body.slug = body.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const parsed = articleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const article = parsed.data;
    const optionsJson = Array.isArray(article.quizOptions)
      ? JSON.stringify(article.quizOptions)
      : (typeof article.quizOptions === 'string' ? article.quizOptions : null);

    const result = await query(
      `UPDATE articles
       SET category_id = $2, title = $3, slug = $4, introduction = $5, content = $6,
           learning_objectives = $7, practical_exercises = $8, critical_thinking_questions = $9,
           reflection_activity = $10, reading_time_minutes = $11, sort_order = $12, status = $13,
           cover_image_url = $14, video_url = $15,
           quiz_question = $16, quiz_options = $17, quiz_correct_index = $18, quiz_explanation = $19,
           published_at = CASE WHEN $13 = 'published' THEN COALESCE(published_at, NOW()) ELSE published_at END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        article.categoryId,
        article.title,
        article.slug,
        article.introduction || article.content.slice(0, 200),
        article.content,
        article.learningObjectives || null,
        article.practicalExercises || null,
        article.criticalThinkingQuestions || null,
        article.reflectionActivity || null,
        article.readingTimeMinutes || 5,
        article.sortOrder || 1,
        article.status || 'published',
        article.coverImageUrl || null,
        article.videoUrl || null,
        article.quizQuestion || null,
        optionsJson,
        Number.isInteger(article.quizCorrectIndex) ? article.quizCorrectIndex : 0,
        article.quizExplanation || null,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'ARTICLE_UPDATED',
      entityType: 'articles',
      entityId: id,
      details: { title: article.title, slug: article.slug },
    });

    return NextResponse.json({ success: true, article: result.rows[0] });
  } catch (error) {
    console.error('Update article error:', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'An article with this URL slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update article.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.ARTICLES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to update lessons.' }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await request.json();
    if (!['published', 'suspended', 'draft', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Choose published, suspended, draft, or archived.' }, { status: 400 });
    }

    const result = await query(
      `UPDATE articles
       SET status = $2,
           published_at = CASE WHEN $2 = 'published' THEN COALESCE(published_at, NOW()) ELSE published_at END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, status`,
      [id, status]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'ARTICLE_STATUS_CHANGED',
      entityType: 'articles',
      entityId: id,
      details: { status, title: result.rows[0].title },
    });

    return NextResponse.json({ success: true, article: result.rows[0] });
  } catch (error) {
    console.error('Article status error:', error);
    return NextResponse.json({ error: 'Failed to update the lesson.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.ARTICLES_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized to delete articles.' }, { status: 403 });
    }

    const { id } = await params;
    const result = await query('DELETE FROM articles WHERE id = $1 RETURNING id, title', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'ARTICLE_DELETED',
      entityType: 'articles',
      entityId: id,
      details: { title: result.rows[0].title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete article error:', error);
    return NextResponse.json({ error: 'Failed to delete article.' }, { status: 500 });
  }
}
