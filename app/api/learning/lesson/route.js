import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Only staff can view course progress.' }, { status: 403 });
    }

    const searchParams = new URL(request.url).searchParams;
    const rawArticleId = searchParams.get('articleId');
    const rawCategoryId = searchParams.get('categoryId');
    if (Boolean(rawArticleId) === Boolean(rawCategoryId)) {
      return NextResponse.json({ error: 'Choose a course or lesson.' }, { status: 400 });
    }

    const articleId = rawArticleId ? Number(rawArticleId) : null;
    const categoryId = rawCategoryId ? Number(rawCategoryId) : null;
    if (![articleId, categoryId].filter(Boolean).every((id) => Number.isSafeInteger(id) && id > 0)) {
      return NextResponse.json({ error: 'Choose a valid course or lesson.' }, { status: 400 });
    }

    let course;
    let article = null;
    if (articleId) {
      const articleRes = await query(
        `SELECT a.id, a.category_id, a.title, a.slug, a.status, a.reading_time_minutes,
                ac.name AS category_name
         FROM articles a
         LEFT JOIN article_categories ac ON ac.id = a.category_id
         WHERE a.id = $1`,
        [articleId]
      );
      if (articleRes.rows.length === 0) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
      article = articleRes.rows[0];
      course = { id: article.category_id, name: article.category_name };
    } else {
      const courseRes = await query('SELECT id, name FROM article_categories WHERE id = $1', [categoryId]);
      if (courseRes.rows.length === 0) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
      course = courseRes.rows[0];
    }

    const courseId = course.id;
    const learners = await query(
      `WITH totals AS (
        SELECT COUNT(*)::int AS total_lessons
        FROM articles
        WHERE status = 'published' AND category_id = $2
      ),
      progress AS (
        SELECT p.user_id, COUNT(*)::int AS completed_lessons
        FROM student_learning_progress p
        JOIN articles a ON a.id = p.article_id AND a.status = 'published'
        WHERE a.category_id = $2
        GROUP BY p.user_id
      ),
      activity AS (
        SELECT v.user_id, SUM(v.view_count)::int AS view_count, MAX(v.last_viewed_at) AS last_viewed_at
        FROM student_article_views v
        JOIN articles a ON a.id = v.article_id AND a.category_id = $2
        WHERE ($1::int IS NULL OR a.id = $1)
        GROUP BY v.user_id
      )
      SELECT u.id AS user_id, u.full_name, u.email, u.is_active,
             sp.school_name, sp.class_level,
             (lesson.id IS NOT NULL) AS completed_this_lesson,
             COALESCE(activity.view_count, 0) AS view_count,
             activity.last_viewed_at,
             lesson.completed_at,
             COALESCE(progress.completed_lessons, 0) AS completed_lessons,
             totals.total_lessons,
             enrollment.enrolled_at
      FROM users u
      CROSS JOIN totals
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN student_learning_progress lesson
        ON lesson.user_id = u.id AND lesson.article_id = $1
      LEFT JOIN activity ON activity.user_id = u.id
      LEFT JOIN progress ON progress.user_id = u.id
      LEFT JOIN course_enrollments enrollment
        ON enrollment.user_id = u.id AND enrollment.category_id = $2
      WHERE u.role = 'student'
        AND (enrollment.id IS NOT NULL OR lesson.id IS NOT NULL OR activity.user_id IS NOT NULL)
      ORDER BY enrollment.enrolled_at DESC NULLS LAST, lesson.completed_at DESC NULLS LAST,
               activity.last_viewed_at DESC NULLS LAST, u.full_name ASC`,
      [articleId, courseId]
    );

    return NextResponse.json({ course, article, learners: learners.rows });
  } catch (error) {
    console.error('Course roster error:', error);
    return NextResponse.json({ error: 'Failed to load students for this course.' }, { status: 500 });
  }
}
