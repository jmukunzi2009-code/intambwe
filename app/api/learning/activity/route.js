import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized to view student learning activity.' }, { status: 403 });
    }

    const result = await query(
      `WITH lesson_activity AS (
         SELECT user_id, article_id, view_count, first_viewed_at, last_viewed_at
         FROM student_article_views
         UNION ALL
         SELECT p.user_id, p.article_id, 0, p.completed_at, p.completed_at
         FROM student_learning_progress p
         WHERE NOT EXISTS (
           SELECT 1
           FROM student_article_views v
           WHERE v.user_id = p.user_id AND v.article_id = p.article_id
         )
       ),
       student_progress AS (
         SELECT p.user_id, COUNT(*)::int AS completed_lessons
         FROM student_learning_progress p
         JOIN articles a ON a.id = p.article_id AND a.status = 'published'
         GROUP BY p.user_id
       ),
       published_lessons AS (
         SELECT COUNT(*)::int AS total_lessons
         FROM articles
         WHERE status = 'published'
       )
       SELECT activity.user_id, u.full_name, u.email, sp.school_name,
              activity.article_id, a.title AS article_title, a.slug AS article_slug,
              activity.view_count, activity.first_viewed_at, activity.last_viewed_at,
              (p.id IS NOT NULL) AS completed,
              COALESCE(progress.completed_lessons, 0) AS completed_lessons,
              published_lessons.total_lessons
       FROM lesson_activity activity
       JOIN users u ON u.id = activity.user_id
       JOIN articles a ON a.id = activity.article_id AND a.status = 'published'
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       LEFT JOIN student_learning_progress p
         ON p.user_id = activity.user_id AND p.article_id = activity.article_id
       LEFT JOIN student_progress progress ON progress.user_id = activity.user_id
       CROSS JOIN published_lessons
       WHERE u.role = 'student'
       ORDER BY activity.last_viewed_at DESC
       LIMIT 250`
    );

    return NextResponse.json({ activity: result.rows });
  } catch (error) {
    console.error('Student learning activity error:', error);
    return NextResponse.json({ error: 'Failed to retrieve student learning activity.' }, { status: 500 });
  }
}
