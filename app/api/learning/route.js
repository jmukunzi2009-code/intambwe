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

    const { articleId } = await request.json();
    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      isCompleted,
      message: isCompleted 
        ? 'Lesson marked as completed! Added to your learning record.' 
        : 'Lesson unmarked.',
    });
  } catch (error) {
    console.error('Toggle progress error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
