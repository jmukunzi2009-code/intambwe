import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();

    const challengesRes = await query(
      `SELECT c.*,
              COUNT(DISTINCT cs.id) as submission_count
       FROM challenges c
       LEFT JOIN challenge_submissions cs ON c.id = cs.challenge_id
       WHERE c.is_active = true
       GROUP BY c.id
       ORDER BY c.start_date DESC`
    );

    let mySubmissions = [];
    if (user) {
      const subRes = await query(
        `SELECT cs.*, c.title as challenge_title
         FROM challenge_submissions cs
         JOIN challenges c ON cs.challenge_id = c.id
         WHERE cs.user_id = $1
         ORDER BY cs.submitted_at DESC`,
        [user.id]
      );
      mySubmissions = subRes.rows;
    }

    return NextResponse.json({
      challenges: challengesRes.rows,
      mySubmissions,
    });
  } catch (error) {
    console.error('Challenges API error:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to submit a challenge solution.' }, { status: 401 });
    }

    const { challengeId, submissionText, attachmentUrl } = await request.json();

    if (!challengeId || !submissionText || submissionText.trim().length < 10) {
      return NextResponse.json({ error: 'Please provide a detailed submission (minimum 10 characters).' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO challenge_submissions (challenge_id, user_id, submission_text, attachment_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [challengeId, user.id, submissionText.trim(), attachmentUrl || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Your challenge solution was submitted successfully! INTAMBWE mentors will review it.',
      submission: res.rows[0],
    });
  } catch (error) {
    console.error('Challenge submission error:', error);
    return NextResponse.json({ error: 'Failed to submit challenge.' }, { status: 500 });
  }
}
