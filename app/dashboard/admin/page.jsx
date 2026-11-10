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
    query('SELECT * FROM article_categories ORDER BY id ASC'),
    query('SELECT * FROM resource_categories ORDER BY id ASC'),
    query('SELECT * FROM schools ORDER BY name ASC'),
    query('SELECT COUNT(*) FROM users'),
    query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
    query('SELECT COUNT(*) FROM schools'),
    query('SELECT COUNT(*) FROM event_registrations'),
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
    />
  );
}
