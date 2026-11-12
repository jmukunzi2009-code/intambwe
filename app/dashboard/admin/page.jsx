import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole } from '@/lib/permissions';
import { query } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';

export const metadata = {
  title: 'Executive Admin Console | INTAMBWE',
  description: 'Manage users, inter-school conferences, agendas, attendance records, curriculum articles, and view audit logs.',
};

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (!isStaffRole(currentUser.role)) {
    redirect('/dashboard/student');
  }

  // Fetch all administrative records in parallel
  const [
    usersRes,
    meetingsRes,
    articlesRes,
    resourcesRes,
    messagesRes,
    auditLogsRes,
    categoriesRes,
    resourceCategoriesRes,
    schoolsRes,
    usersCount,
    studentsCount,
    schoolsCount,
    regCount,
    teamRes,
    momentsRes,
    notesRes,
  ] = await Promise.all([
    query(`
      SELECT u.id, u.full_name, u.email, u.role, u.is_active, u.created_at,
             sp.school_name, sp.class_level, sp.country, sp.phone
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      ORDER BY u.created_at DESC
    `),
    query(`
      SELECT m.*, 
             COUNT(DISTINCT er.user_id) as registration_count,
             COUNT(DISTINCT ar.user_id) as attendance_count
      FROM meetings m
      LEFT JOIN event_registrations er ON m.id = er.meeting_id
      LEFT JOIN attendance_records ar ON m.id = ar.meeting_id AND ar.status = 'present'
      GROUP BY m.id
      ORDER BY m.event_date DESC
    `),
    query(`
      SELECT a.*, ac.name as category_name
      FROM articles a
      JOIN article_categories ac ON a.category_id = ac.id
      ORDER BY a.created_at DESC
    `),
    query(`
      SELECT r.*, rc.name as category_name
      FROM resources r
      LEFT JOIN resource_categories rc ON r.category_id = rc.id
      ORDER BY r.created_at DESC
    `),
    query(`
      SELECT * FROM contact_messages ORDER BY created_at DESC
    `),
    query(`
      SELECT al.*, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 25
    `),
    query(`
      SELECT ac.*, COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'published')::int AS lesson_count,
             COUNT(DISTINCT ce.user_id)::int AS student_count
      FROM article_categories ac
      LEFT JOIN articles a ON a.category_id = ac.id
      LEFT JOIN course_enrollments ce ON ce.category_id = ac.id
      GROUP BY ac.id
      ORDER BY ac.id ASC
    `),
    query('SELECT * FROM resource_categories ORDER BY id ASC'),
    query('SELECT * FROM schools ORDER BY name ASC'),
    query('SELECT COUNT(*) FROM users'),
    query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
    query('SELECT COUNT(*) FROM schools'),
    query('SELECT COUNT(*) FROM event_registrations'),
    query('SELECT * FROM team_members ORDER BY sort_order ASC, id ASC'),
    query('SELECT * FROM community_moments ORDER BY sort_order ASC, id ASC'),
    query(`
      SELECT n.*, u.full_name, u.role, sp.school_name,
             COUNT(DISTINCT likes.user_id)::int AS like_count,
             COALESCE(BOOL_OR(my_like.user_id IS NOT NULL), false) AS liked_by_me
      FROM stick_notes n
      JOIN users u ON u.id = n.user_id
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN stick_note_likes likes ON likes.note_id = n.id
      LEFT JOIN stick_note_likes my_like ON my_like.note_id = n.id AND my_like.user_id = $1
      GROUP BY n.id, u.id, sp.school_name
      ORDER BY n.created_at DESC
      LIMIT 120
    `, [currentUser?.id || null]),
  ]);

  const metrics = {
    totalUsers: parseInt(usersCount.rows[0].count, 10),
    totalStudents: parseInt(studentsCount.rows[0].count, 10),
    totalSchools: parseInt(schoolsCount.rows[0].count, 10),
    totalRegistrations: parseInt(regCount.rows[0].count, 10),
  };

  return (
    <AdminDashboardClient
      currentUser={currentUser}
      initialMetrics={metrics}
      initialUsers={usersRes.rows}
      initialMeetings={meetingsRes.rows}
      initialArticles={articlesRes.rows}
      initialResources={resourcesRes.rows}
      initialMessages={messagesRes.rows}
      initialAuditLogs={auditLogsRes.rows}
      categories={categoriesRes.rows}
      resourceCategories={resourceCategoriesRes.rows}
      schools={schoolsRes.rows}
      initialTeam={teamRes.rows}
      initialMoments={momentsRes.rows}
      initialNotes={notesRes.rows}
    />
  );
}
