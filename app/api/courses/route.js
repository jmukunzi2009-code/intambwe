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
  const validMedia = (value) => !value || /^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//'));

  if (name.length < 3 || name.length > 100) return { error: 'Course name must be between 3 and 100 characters.' };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: 'Use a valid course URL slug.' };
  if (description.length > 4000) return { error: 'Course description must be 4,000 characters or fewer.' };
  if (coverImageUrl.length > 2048 || !validMedia(coverImageUrl)) return { error: 'Enter a valid image URL or local path.' };
  if (videoUrl.length > 2048 || !validMedia(videoUrl)) return { error: 'Enter a valid video URL or local path.' };
  if (!['draft', 'published', 'archived'].includes(status)) return { error: 'Choose draft, published, or archived.' };

  return { name, slug, description, coverImageUrl: coverImageUrl || null, videoUrl: videoUrl || null, status };
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'Only staff can create courses.' }, { status: 403 });
    }

    const parsed = validateCourse(await request.json());
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const result = await query(
      `INSERT INTO article_categories (name, slug, description, cover_image_url, video_url, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [parsed.name, parsed.slug, parsed.description || null, parsed.coverImageUrl, parsed.videoUrl, parsed.status]
    );

    await logAudit({
      userId: user.id,
      action: 'COURSE_CREATED',
      entityType: 'article_categories',
      entityId: result.rows[0].id,
      details: { name: parsed.name, slug: parsed.slug },
    });

    return NextResponse.json({ success: true, course: { ...result.rows[0], lesson_count: 0 } }, { status: 201 });
  } catch (error) {
    console.error('Create course error:', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'A course with this name or URL already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create course.' }, { status: 500 });
  }
}
