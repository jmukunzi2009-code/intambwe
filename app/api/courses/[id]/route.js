import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';

export const runtime = 'nodejs';

function validateCourse(body) {
  const name = String(body.name || '').trim();
  const slug = String(body.slug || '').trim().toLowerCase();
  const description = String(body.description || '').trim();
  const coverImageUrl = String(body.coverImageUrl || '').trim();
  const videoUrl = String(body.videoUrl || '').trim();
  const status = body.status || 'published';
  const validMedia = (value) => !value || /^https?:\/\//i.test(value) || value.startsWith('data:') || (value.startsWith('/') && !value.startsWith('//'));

  if (name.length < 2 || name.length > 150) return { error: 'Course name must be between 2 and 150 characters.' };
  if (!slug) return { error: 'Use a valid course URL slug.' };
  if (!validMedia(coverImageUrl)) return { error: 'Enter a valid image URL or local path.' };
  if (!validMedia(videoUrl)) return { error: 'Enter a valid video URL or local path.' };
  if (!['draft', 'published', 'archived'].includes(status)) return { error: 'Choose draft, published, or archived.' };

  return { name, slug, description, coverImageUrl: coverImageUrl || null, videoUrl: videoUrl || null, status };
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const courseId = Number(id);
    const result = await query(
      `SELECT ac.*, COUNT(DISTINCT a.id) as lesson_count,
              COUNT(DISTINCT ce.user_id) as student_count
       FROM article_categories ac
       LEFT JOIN articles a ON a.category_id = ac.id
       LEFT JOIN course_enrollments ce ON ce.category_id = ac.id
       WHERE ac.id = $1
       GROUP BY ac.id`,
      [courseId]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    return NextResponse.json({ course: result.rows[0] });
  } catch (error) {
    console.error('Course GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve course.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Only staff can update courses.' }, { status: 403 });
    }

    const { id } = await params;
    const courseId = Number(id);
    if (!Number.isSafeInteger(courseId) || courseId < 1) {
      return NextResponse.json({ error: 'Choose a valid course.' }, { status: 400 });
    }

    const body = await request.json();
    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const parsed = validateCourse(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const result = await query(
      `UPDATE article_categories
       SET name = $2, slug = $3, description = $4, cover_image_url = $5, video_url = $6, status = $7
       WHERE id = $1
       RETURNING *`,
      [courseId, parsed.name, parsed.slug, parsed.description || null, parsed.coverImageUrl, parsed.videoUrl, parsed.status]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });

    await logAudit({
      userId: user.id,
      action: 'COURSE_UPDATED',
      entityType: 'article_categories',
      entityId: courseId,
      details: { name: parsed.name, slug: parsed.slug, status: parsed.status },
    });

    return NextResponse.json({ success: true, course: result.rows[0] });
  } catch (error) {
    console.error('Update course error:', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'A course with this name or URL already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update course.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Only staff can update course status.' }, { status: 403 });
    }

    const { id } = await params;
    const courseId = Number(id);
    const { status } = await request.json();
    if (!['draft', 'published', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Status must be draft, published, or archived.' }, { status: 400 });
    }

    const result = await query(
      `UPDATE article_categories SET status = $2 WHERE id = $1 RETURNING *`,
      [courseId, status]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });

    await logAudit({
      userId: user.id,
      action: 'COURSE_STATUS_CHANGED',
      entityType: 'article_categories',
      entityId: courseId,
      details: { status },
    });

    return NextResponse.json({ success: true, course: result.rows[0] });
  } catch (error) {
    console.error('Course status patch error:', error);
    return NextResponse.json({ error: 'Failed to update course status.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Only staff can delete courses.' }, { status: 403 });
    }

    const { id } = await params;
    const courseId = Number(id);

    // Unlink any articles so foreign keys don't block
    await query('UPDATE articles SET category_id = NULL WHERE category_id = $1', [courseId]);
    await query('DELETE FROM course_enrollments WHERE category_id = $1', [courseId]);

    const result = await query(
      'DELETE FROM article_categories WHERE id = $1 RETURNING id, name',
      [courseId]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });

    await logAudit({
      userId: user.id,
      action: 'COURSE_DELETED',
      entityType: 'article_categories',
      entityId: courseId,
      details: { name: result.rows[0].name },
    });

    return NextResponse.json({ success: true, message: `Course "${result.rows[0].name}" deleted.` });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json({ error: 'Failed to delete course.' }, { status: 500 });
  }
}
