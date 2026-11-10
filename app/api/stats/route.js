import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [
      usersRes,
      studentsRes,
      schoolsRes,
      meetingsRes,
      registrationsRes,
      articlesRes,
      resourcesRes,
      challengesRes,
    ] = await Promise.all([
      query("SELECT COUNT(*) FROM users WHERE is_active = true"),
      query("SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = true"),
      query("SELECT COUNT(*) FROM schools"),
      query("SELECT COUNT(*) FROM meetings"),
      query("SELECT COUNT(*) FROM event_registrations"),
      query("SELECT COUNT(*) FROM articles WHERE status = 'published'"),
      query("SELECT COUNT(*) FROM resources WHERE is_public = true"),
      query("SELECT COUNT(*) FROM challenge_submissions"),
    ]);

    return NextResponse.json({
      totalUsers: parseInt(usersRes.rows[0].count, 10),
      totalStudents: parseInt(studentsRes.rows[0].count, 10),
      totalSchools: parseInt(schoolsRes.rows[0].count, 10),
      totalMeetings: parseInt(meetingsRes.rows[0].count, 10),
      totalRegistrations: parseInt(registrationsRes.rows[0].count, 10),
      totalArticles: parseInt(articlesRes.rows[0].count, 10),
      totalResources: parseInt(resourcesRes.rows[0].count, 10),
      totalChallengeSubmissions: parseInt(challengesRes.rows[0].count, 10),
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve stats' }, { status: 500 });
  }
}
