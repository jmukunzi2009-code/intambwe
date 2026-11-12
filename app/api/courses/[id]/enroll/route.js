import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(_request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Sign in or create a student account to start this course.' }, { status: 401 });
    if (user.role !== 'student' || !user.is_active) {
      return NextResponse.json({ error: 'An active student account is required to start a course.' }, { status: 403 });
    }

    const { id } = await params;
    const categoryId = Number(id);
    if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
      return NextResponse.json({ error: 'Choose a valid course.' }, { status: 400 });
    }

    const courseRes = await query(
      "SELECT id, name FROM article_categories WHERE id = $1 AND status = 'published'",
      [categoryId]
    );
    if (courseRes.rows.length === 0) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });

    const enrolled = await query(
      `INSERT INTO course_enrollments (user_id, category_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, category_id) DO NOTHING
       RETURNING id`,
      [user.id, categoryId]
    );

    if (enrolled.rows.length > 0) {
      await logAudit({
        userId: user.id,
        action: 'COURSE_ENROLLED',
        entityType: 'article_categories',
        entityId: categoryId,
        details: { courseName: courseRes.rows[0].name },
      });
    }

    return NextResponse.json({ success: true, enrolled: true, course: courseRes.rows[0] });
  } catch (error) {
    console.error('Course enrollment error:', error);
    return NextResponse.json({ error: 'Failed to start this course.' }, { status: 500 });
  }
}
