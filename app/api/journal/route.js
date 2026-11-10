import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { journalSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const res = await query(
      `SELECT id, title, lesson_reflected, reflection_content, action_commitment, created_at, updated_at
       FROM student_journals
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ journals: res.rows });
  } catch (error) {
    console.error('Fetch journals error:', error);
    return NextResponse.json({ error: 'Failed to fetch journal entries.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = journalSchema.parse(body);

    const res = await query(
      `INSERT INTO student_journals (user_id, title, lesson_reflected, reflection_content, action_commitment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        user.id,
        validatedData.title,
        validatedData.lessonReflected || null,
        validatedData.reflectionContent,
        validatedData.actionCommitment || null,
      ]
    );

    return NextResponse.json({ success: true, journal: res.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create journal entry error:', error);
    if (error.errors) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save reflection.' }, { status: 500 });
  }
}
