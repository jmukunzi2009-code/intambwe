import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ completedArticles: [] });
    }

    const res = await query(
      'SELECT article_id, completed_at FROM student_learning_progress WHERE user_id = $1',
      [user.id]
    );

    return NextResponse.json({
      completedArticles: res.rows.map((r) => r.article_id),
      details: res.rows,
    });
  } catch (error) {
    console.error('Learning progress error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to track learning progress.' }, { status: 401 });
    }

    const body = await request.json();
    const articleId = Number(body.articleId);
    if (!Number.isSafeInteger(articleId) || articleId < 1) {
      return NextResponse.json({ error: 'A valid lesson is required.' }, { status: 400 });
    }

    const article = await query(
      `SELECT id, category_id
       FROM articles
       WHERE id = $1 AND status = 'published'`,
      [articleId]
    );
    if (article.rows.length === 0) {
      return NextResponse.json({ error: 'Published lesson not found.' }, { status: 404 });
    }

    // Check if already completed
    const existing = await query(
      'SELECT id FROM student_learning_progress WHERE user_id = $1 AND article_id = $2',
      [user.id, articleId]
    );

    let isCompleted = false;
    if (existing.rows.length > 0) {
      // Toggle off
      await query(
        'DELETE FROM student_learning_progress WHERE user_id = $1 AND article_id = $2',
        [user.id, articleId]
      );
      isCompleted = false;
    } else {
      // Toggle on
      await query(
        'INSERT INTO student_learning_progress (user_id, article_id) VALUES ($1, $2)',
        [user.id, articleId]
      );
      isCompleted = true;
    }

    // Calculate course stats and next lesson for real-time progress feedback
    let courseStats = null;
    let nextLesson = null;
    if (article.rows[0].category_id) {
      const catId = article.rows[0].category_id;
      const statsRes = await query(
        `SELECT COUNT(a.id)::int AS total,
                COUNT(p.id)::int AS completed
         FROM articles a
         LEFT JOIN student_learning_progress p ON p.article_id = a.id AND p.user_id = $1
         WHERE a.category_id = $2 AND a.status = 'published'`,
        [user.id, catId]
      );
      const total = statsRes.rows[0]?.total || 0;
      const completed = statsRes.rows[0]?.completed || 0;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      const nextRes = await query(
        `SELECT a.id, a.title, a.slug
         FROM articles a
         LEFT JOIN student_learning_progress p ON p.article_id = a.id AND p.user_id = $1
         WHERE a.category_id = $2 AND a.status = 'published' AND p.id IS NULL
         ORDER BY a.sort_order ASC, a.id ASC
         LIMIT 1`,
        [user.id, catId]
      );

      courseStats = {
        total,
        completed,
        percent,
        allCompleted: total > 0 && completed >= total,
      };
      if (nextRes.rows.length > 0) {
        nextLesson = nextRes.rows[0];
      }
    }

    return NextResponse.json({
      success: true,
      isCompleted,
      courseStats,
      nextLesson,
      message: isCompleted
        ? 'Lesson marked as completed. Pass the course final test to earn a certificate.'
        : 'Lesson unmarked.',
    });
  } catch (error) {
    console.error('Toggle progress error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
