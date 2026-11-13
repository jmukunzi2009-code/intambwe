import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';

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

    let pathwayCertificate = null;
    let courseCertificate = null;
    if (isCompleted) {
      if (article.rows[0].category_id) {
        const courseProgress = await query(
          `SELECT ac.id, ac.name, COUNT(a.id)::int AS total,
                  COUNT(p.id)::int AS completed
           FROM article_categories ac
           JOIN articles a ON a.category_id = ac.id AND a.status = 'published'
           LEFT JOIN student_learning_progress p
             ON p.article_id = a.id AND p.user_id = $1
           WHERE ac.id = $2
           GROUP BY ac.id, ac.name`,
          [user.id, article.rows[0].category_id]
        );
        const course = courseProgress.rows[0];
        if (course && course.total > 0 && course.completed >= course.total) {
          const certCode = `INT-CERT-${new Date().getFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
          const createdCourse = await query(
            `INSERT INTO certificates
               (user_id, category_id, certificate_code, title, issue_date, verification_url, certificate_kind)
             VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'course')
             ON CONFLICT (user_id, category_id) WHERE category_id IS NOT NULL DO NOTHING
             RETURNING *`,
            [user.id, course.id, certCode, `${course.name} Leadership Course`, `/certificates/${certCode}`]
          );
          courseCertificate = createdCourse.rows[0] || (await query(
            'SELECT * FROM certificates WHERE user_id = $1 AND category_id = $2',
            [user.id, course.id]
          )).rows[0];

          if (createdCourse.rows.length > 0) {
            await logAudit({
              userId: user.id,
              action: 'COURSE_CERTIFICATE_ISSUED',
              entityType: 'certificates',
              entityId: courseCertificate.id,
              details: { certCode, categoryId: course.id, courseName: course.name, completedLessons: course.completed },
            });
          }
        }
      }

      const totals = await query("SELECT COUNT(*)::int AS total FROM articles WHERE status = 'published'");
      const done = await query(
        `SELECT COUNT(*)::int AS completed
         FROM student_learning_progress p
         JOIN articles a ON a.id = p.article_id AND a.status = 'published'
         WHERE p.user_id = $1`,
        [user.id]
      );
      const total = totals.rows[0].total;
      const completed = done.rows[0].completed;
      if (total > 0 && completed >= total) {
        const certCode = `INT-CERT-${new Date().getFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
        const created = await query(
          `INSERT INTO certificates (user_id, certificate_code, title, issue_date, verification_url, certificate_kind)
           VALUES ($1, $2, $3, CURRENT_DATE, $4, 'pathway')
           ON CONFLICT (user_id) WHERE certificate_kind = 'pathway' DO NOTHING
           RETURNING *`,
          [user.id, certCode, 'INTAMBWE Leadership Pathway', `/certificates/${certCode}`]
        );
        pathwayCertificate = created.rows[0] || (await query(
          "SELECT * FROM certificates WHERE user_id = $1 AND certificate_kind = 'pathway'",
          [user.id]
        )).rows[0];
        if (created.rows.length > 0) {
          await logAudit({
            userId: user.id,
            action: 'PATHWAY_CERTIFICATE_ISSUED',
            entityType: 'certificates',
            entityId: pathwayCertificate.id,
            details: { certCode, completedLessons: completed },
          });
        }
      }
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
      courseCertificate,
      pathwayCertificate,
      message: courseCertificate
        ? `You completed ${courseCertificate.title}. Your course certificate is ready!`
        : pathwayCertificate
        ? 'You finished every published lesson. Your leadership pathway certificate is ready!'
        : isCompleted
          ? 'Lesson marked as completed. Your learning progress has been saved.'
          : 'Lesson unmarked.',
    });
  } catch (error) {
    console.error('Toggle progress error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
