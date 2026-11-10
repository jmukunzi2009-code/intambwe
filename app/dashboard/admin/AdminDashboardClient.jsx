'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileCheck, 
  BookOpen, 
  FolderDown, 
  Mail, 
  ShieldAlert, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Printer, 
  UserPlus,
  RefreshCw,
  Sliders,
  MessageSquare,
  Trash2,
  TrendingUp,
  Award,
  Eye,
  ExternalLink,
  ShieldCheck,
  FileUp,
  Video
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

const CHART_COLORS = ['#123B2A', '#167A50', '#D4A72C', '#3B82F6', '#8B5CF6'];

function formatDate(value) {
  const date = String(value ?? '').slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return '—';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export default function AdminDashboardClient({ 
  currentUser, 
  initialMetrics, 
  initialUsers, 
  initialMeetings, 
  initialArticles, 
  initialResources, 
  initialMessages, 
  initialAuditLogs,
  categories,
  resourceCategories,
  schools 
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState(initialUsers);
  const [meetings, setMeetings] = useState(initialMeetings);
  const [articles, setArticles] = useState(initialArticles);
  const [resources, setResources] = useState(initialResources);
  const [messages, setMessages] = useState(initialMessages);
  const [meetingYearFilter, setMeetingYearFilter] = useState('all');
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [learningActivity, setLearningActivity] = useState([]);
  const [learningActivityLoading, setLearningActivityLoading] = useState(false);
  const [learningActivityLoaded, setLearningActivityLoaded] = useState(false);
  const canManageAttendance = hasPermission(currentUser.role, PERMISSIONS.ATTENDANCE_MANAGE);

  // Attendance management state
  const [selectedMeetingForAttendance, setSelectedMeetingForAttendance] = useState(meetings[0]?.id || null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Walk-in Registration Modal
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinData, setWalkinData] = useState({
    fullName: '',
    email: '',
    school: schools[0]?.name || 'Lycée de Kigali',
    classLevel: 'Senior 5',
    phone: '',
    notes: 'On-site registration at registration desk',
  });
  const [walkinLoading, setWalkinLoading] = useState(false);

  // Agenda Builder state
  const [selectedMeetingForAgenda, setSelectedMeetingForAgenda] = useState(meetings[0]?.id || null);
  const [agendaList, setAgendaList] = useState([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [newAgendaItem, setNewAgendaItem] = useState({
    sessionTitle: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    speakerName: '',
    facilitatorName: '',
    sortOrder: 1,
  });

  // Resources Modal state
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    fileType: 'pdf',
    fileUrl: '',
    fileSizeMb: 1.5,
    categoryId: resourceCategories[0]?.id || '',
    isPublic: true,
  });

  // Selected message for details modal
  const [selectedMessage, setSelectedMessage] = useState(null);

  // New Meeting Modal
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    meetingNumber: `INT-CONF-${new Date().getFullYear()}-${String(meetings.length + 1).padStart(2, '0')}`,
    title: '',
    theme: '',
    description: '',
    eventDate: '',
    startTime: '09:00',
    endTime: '16:00',
    venue: 'Kigali, Rwanda',
    capacity: 200,
    status: 'published',
  });

  // New Article Modal
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    slug: '',
    categoryId: categories[0]?.id || 1,
    introduction: '',
    content: '',
    learningObjectives: '',
    practicalExercises: '',
    criticalThinkingQuestions: '',
    reflectionActivity: '',
    readingTimeMinutes: 5,
    coverImageUrl: '',
    videoUrl: '',
    status: 'published',
  });

  const years = [...new Set(meetings.map((meeting) => String(meeting.event_date).slice(0, 4)))].sort((a, b) => b.localeCompare(a));
  const filteredMeetings = meetings
    .filter((meeting) => meetingYearFilter === 'all' || String(meeting.event_date).slice(0, 4) === meetingYearFilter)
    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

  // New Staff Modal (Super Admin only)
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'admin',
  });

  // User search
  const [userSearch, setUserSearch] = useState('');

  // Fetch Attendance
  const fetchAttendance = async (meetingId) => {
    if (!meetingId) {
      setSelectedMeetingForAttendance(null);
      setAttendanceList([]);
      return;
    }
    setSelectedMeetingForAttendance(meetingId);
    setAttendanceLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/attendance`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load conference attendees');
      setAttendanceList(data.participants || []);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Fetch Agenda
  const fetchAgenda = async (meetingId) => {
    setSelectedMeetingForAgenda(meetingId);
    setAgendaLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/agenda`);
      const data = await res.json();
      if (res.ok) {
        setAgendaList(data.agenda || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgendaLoading(false);
    }
  };

  // Walk-in Registration Submit
  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMeetingForAttendance) return;

    setWalkinLoading(true);
    try {
      const res = await fetch(`/api/meetings/${selectedMeetingForAttendance}/walkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walkinData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register walk-in delegate');

      alert(data.message || 'Delegate registered successfully!');
      setShowWalkinModal(false);
      setWalkinData({
        fullName: '',
        email: '',
        school: schools[0]?.name || 'Lycée de Kigali',
        classLevel: 'Senior 5',
        phone: '',
        notes: '',
      });
      fetchAttendance(selectedMeetingForAttendance);
    } catch (err) {
      alert(err.message);
    } finally {
      setWalkinLoading(false);
    }
  };

  // Generate Certificate for Delegate
  const handleGenerateCertificate = async (userId, meetingId) => {
    try {
      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, meetingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue certificate');

      alert(`Certificate Issued! Code: ${data.certificate.certificate_code}`);
      window.open(data.verificationUrl, '_blank');
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Agenda Item
  const handleAddAgendaItem = async (e) => {
    e.preventDefault();
    if (!selectedMeetingForAgenda) return;

    try {
      const res = await fetch(`/api/meetings/${selectedMeetingForAgenda}/agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgendaItem),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add session');

      setAgendaList([...agendaList, data.item]);
      setNewAgendaItem({
        sessionTitle: '',
        description: '',
        startTime: '10:00',
        endTime: '11:00',
        speakerName: '',
        facilitatorName: '',
        sortOrder: agendaList.length + 2,
      });
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Agenda Item
  const handleDeleteAgendaItem = async (itemId) => {
    if (!confirm('Remove this session from the agenda?')) return;
    try {
      const res = await fetch(`/api/meetings/${selectedMeetingForAgenda}/agenda?itemId=${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAgendaList(agendaList.filter((item) => item.id !== itemId));
      }
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  // Create Resource
  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResource),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create resource');

      const categoryName = resourceCategories.find((category) => category.id === Number(newResource.categoryId))?.name;
      setResources((current) => [{ ...data.resource, category_name: categoryName }, ...current]);
      setShowResourceModal(false);
      alert('Resource added successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Resource
  const handleDeleteResource = async (id) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      const res = await fetch(`/api/resources?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setResources(resources.filter((r) => r.id !== id));
      }
    } catch (err) {
      alert('Failed to delete resource');
    }
  };

  // Toggle Resource Status (Active / Suspended)
  const handleToggleResourceStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/resources?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setResources(resources.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)));
      }
    } catch (err) {
      alert('Failed to update resource status');
    }
  };

  // Mark attendance status
  const handleMarkAttendance = async (userId, status) => {
    if (!selectedMeetingForAttendance) return;
    try {
      const res = await fetch(`/api/meetings/${selectedMeetingForAttendance}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });
      if (res.ok) {
        setAttendanceList((prev) =>
          prev.map((p) => (p.user_id === userId ? { ...p, attendance_status: status } : p))
        );
      }
    } catch (err) {
      alert('Failed to mark attendance');
    }
  };

  // Toggle user active status
  const handleToggleUserActive = async (targetUserId, currentStatus) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, isActive: !currentStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, is_active: !currentStatus } : u))
        );
      }
    } catch (err) {
      alert('Failed to update user');
    }
  };

  // Create Meeting
  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(editingMeetingId ? `/api/meetings/${editingMeetingId}` : '/api/meetings', {
        method: editingMeetingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMeeting),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create meeting');

      setMeetings((current) => editingMeetingId
        ? current.map((meeting) => meeting.id === editingMeetingId ? { ...meeting, ...data.meeting } : meeting)
        : [{ ...data.meeting, registration_count: 0, attendance_count: 0 }, ...current]);
      setShowMeetingModal(false);
      setEditingMeetingId(null);
      alert(editingMeetingId ? 'Conference updated successfully!' : 'Conference created successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeetingId(meeting.id);
    setNewMeeting({
      meetingNumber: meeting.meeting_number,
      title: meeting.title,
      theme: meeting.theme,
      description: meeting.description,
      eventDate: String(meeting.event_date).slice(0, 10),
      startTime: meeting.start_time?.slice(0, 5) || '',
      endTime: meeting.end_time?.slice(0, 5) || '',
      venue: meeting.venue,
      capacity: Number(meeting.capacity) || 100,
      status: meeting.status,
      summary: meeting.summary || '',
      outcomes: meeting.outcomes || '',
      recommendations: meeting.recommendations || '',
      coverImageUrl: meeting.cover_image_url || '',
      videoUrl: meeting.video_url || '',
    });
    setShowMeetingModal(true);
  };

  const handleDeleteMeeting = async (meeting) => {
    if (!confirm(`Delete "${meeting.title}" and its registrations and attendance records? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete conference');
      setMeetings((current) => current.filter((item) => item.id !== meeting.id));
      if (selectedMeetingForAttendance === meeting.id) {
        setSelectedMeetingForAttendance(null);
        setAttendanceList([]);
      }
      alert('Conference deleted.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Create Article
  const handleCreateArticle = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(editingArticleId ? `/api/articles/${editingArticleId}` : '/api/articles', {
        method: editingArticleId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArticle),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create article');

      const categoryName = categories.find((category) => category.id === Number(newArticle.categoryId))?.name;
      setArticles((current) => editingArticleId
        ? current.map((article) => article.id === editingArticleId ? { ...article, ...data.article, category_name: categoryName } : article)
        : [{ ...data.article, category_name: categoryName }, ...current]);
      setShowArticleModal(false);
      setEditingArticleId(null);
      alert(editingArticleId ? 'Article updated successfully!' : 'Article created successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditArticle = (article) => {
    setEditingArticleId(article.id);
    setNewArticle({
      title: article.title,
      slug: article.slug,
      categoryId: Number(article.category_id || categories.find((category) => category.name === article.category_name)?.id || categories[0]?.id || 1),
      introduction: article.introduction,
      content: article.content,
      learningObjectives: article.learning_objectives || '',
      practicalExercises: article.practical_exercises || '',
      criticalThinkingQuestions: article.critical_thinking_questions || '',
      reflectionActivity: article.reflection_activity || '',
      readingTimeMinutes: Number(article.reading_time_minutes) || 5,
      coverImageUrl: article.cover_image_url || '',
      videoUrl: article.video_url || '',
      status: article.status,
    });
    setShowArticleModal(true);
  };

  const handleDeleteArticle = async (article) => {
    if (!confirm(`Delete "${article.title}"? Its learning progress will also be removed.`)) return;
    try {
      const res = await fetch(`/api/articles/${article.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete article');
      setArticles((current) => current.filter((item) => item.id !== article.id));
      alert('Article deleted.');
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchLearningActivity = async () => {
    setLearningActivityLoading(true);
    try {
      const res = await fetch('/api/learning/activity');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load student learning activity');
      setLearningActivity(data.activity || []);
      setLearningActivityLoaded(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLearningActivityLoading(false);
    }
  };

  // Create Staff
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create staff account');

      setUsers([data.user, ...users]);
      setShowStaffModal(false);
      alert('Staff account created successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.school_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Chart data preparation
  const chartMeetingData = meetings.map((m) => ({
    name: m.title.length > 18 ? m.title.slice(0, 18) + '...' : m.title,
    registered: Number(m.registration_count) || 0,
    attended: Number(m.attendance_count) || 0,
    capacity: Number(m.capacity) || 100,
  }));

  const chartRoleData = [
    { name: 'Students', value: users.filter((u) => u.role === 'student').length },
    { name: 'Admins', value: users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length },
    { name: 'Event Staff', value: users.filter((u) => u.role === 'event_manager').length },
    { name: 'Mentors', value: users.filter((u) => u.role === 'mentor').length },
  ].filter((d) => d.value > 0);

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="dashboard-sidebar">
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image src="/intambwe-emblem.png" alt="INTAMBWE" width={40} height={44} className="brand-emblem dashboard-emblem" />
            <div>
              <div style={{ fontFamily: 'var(--font-headings)', fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>
                INTAMBWE
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-gold)', fontWeight: 600 }}>
                ADMIN CONSOLE
              </div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button 
            onClick={() => setActiveTab('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'overview' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <LayoutDashboard size={18} style={{ color: 'var(--color-gold)' }} />
            <span>Overview & Analytics</span>
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'users' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <Users size={18} style={{ color: 'var(--color-gold)' }} />
            <span>Users & Roles ({users.length})</span>
          </button>

          <button 
            onClick={() => setActiveTab('meetings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'meetings' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <Calendar size={18} style={{ color: 'var(--color-gold)' }} />
            <span>Conferences ({meetings.length})</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('agenda');
              if (selectedMeetingForAgenda) fetchAgenda(selectedMeetingForAgenda);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'agenda' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <Clock size={18} style={{ color: 'var(--color-gold)' }} />
            <span>Agenda Builder</span>
          </button>

          {canManageAttendance && <button 
            onClick={() => {
              setActiveTab('attendance');
              if (selectedMeetingForAttendance) fetchAttendance(selectedMeetingForAttendance);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'attendance' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <FileCheck size={18} style={{ color: 'var(--color-gold)' }} />
            <span>Attendance & Walk-in</span>
          </button>}

          <button 
            onClick={() => setActiveTab('articles')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'articles' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <BookOpen size={18} style={{ color: 'var(--color-gold)' }} />
            <span>Curriculum CMS ({articles.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('learning');
              if (!learningActivityLoaded) fetchLearningActivity();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'learning' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <TrendingUp size={18} style={{ color: 'var(--color-gold)' }} />
            <span>Student Learning Activity</span>
          </button>

          <button 
            onClick={() => setActiveTab('resources')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'resources' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <FolderDown size={18} style={{ color: 'var(--color-gold)' }} />
            <span>Resources ({resources.length})</span>
          </button>

          <button 
            onClick={() => setActiveTab('messages')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'messages' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <Mail size={18} style={{ color: 'var(--color-gold)' }} />
            <span>Messages ({messages.length})</span>
          </button>

          <button 
            onClick={() => setActiveTab('audit')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'audit' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <ShieldAlert size={18} style={{ color: 'var(--color-gold)' }} />
            <span>Audit Trail Logs</span>
          </button>
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ fontSize: '0.82rem', color: '#b9c7bf', marginBottom: '4px' }}>
            Logged in as <strong>{currentUser.full_name}</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Role: {currentUser.role}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/" className="btn btn-outline-white btn-sm" style={{ flex: 1, padding: '6px 10px', fontSize: '0.78rem' }}>
              Public Site
            </Link>
            <form action="/api/auth/logout" method="POST" style={{ flex: 1 }}>
              <button type="submit" className="btn btn-outline-white btn-sm" style={{ width: '100%', padding: '6px 10px', fontSize: '0.78rem' }}>
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="dashboard-main">
        {/* TOPBAR */}
        <header className="dashboard-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-forest)' }}>
              {activeTab === 'overview' && 'Executive Leadership Analytics & Overview'}
              {activeTab === 'users' && 'User & Identity Management'}
              {activeTab === 'meetings' && 'Conferences & Summits Master Management'}
              {activeTab === 'agenda' && 'Official Conference Agenda Builder'}
              {activeTab === 'attendance' && 'Physical Attendance & On-Site Walk-In Roster'}
              {activeTab === 'articles' && 'Curriculum & Articles Content Management'}
              {activeTab === 'learning' && 'Student Learning Activity'}
              {activeTab === 'resources' && 'Learning Resources & Digital Downloads'}
              {activeTab === 'messages' && 'Incoming Contact Communications'}
              {activeTab === 'audit' && 'Security & Operational Audit Trail'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeTab === 'resources' && (
              <button onClick={() => setShowResourceModal(true)} className="btn btn-emerald btn-sm">
                <Plus size={16} />
                <span>Add Resource</span>
              </button>
            )}

            {activeTab === 'attendance' && (
              <button onClick={() => setShowWalkinModal(true)} className="btn btn-gold btn-sm">
                <UserPlus size={16} />
                <span>Register Walk-in Delegate</span>
              </button>
            )}

            {activeTab === 'meetings' && (
              <button onClick={() => {
                setEditingMeetingId(null);
                setNewMeeting({
                  meetingNumber: `INT-CONF-${new Date().getFullYear()}-${String(meetings.length + 1).padStart(2, '0')}`,
                  title: '', theme: '', description: '', eventDate: '', startTime: '09:00', endTime: '16:00',
                  venue: 'Kigali, Rwanda', capacity: 200, status: 'published',
                  summary: '', outcomes: '', recommendations: '', coverImageUrl: '', videoUrl: '',
                });
                setShowMeetingModal(true);
              }} className="btn btn-emerald btn-sm">
                <Plus size={16} />
                <span>Create Conference</span>
              </button>
            )}

            {activeTab === 'articles' && (
              <button onClick={() => {
                setEditingArticleId(null);
                setNewArticle({
                  title: '', slug: '', categoryId: categories[0]?.id || 1, introduction: '', content: '',
                  learningObjectives: '', practicalExercises: '', criticalThinkingQuestions: '',
                  reflectionActivity: '', readingTimeMinutes: 5, coverImageUrl: '', videoUrl: '', status: 'published',
                });
                setShowArticleModal(true);
              }} className="btn btn-emerald btn-sm">
                <Plus size={16} />
                <span>Create Article</span>
              </button>
            )}

            {activeTab === 'learning' && (
              <button onClick={fetchLearningActivity} className="btn btn-outline btn-sm" disabled={learningActivityLoading}>
                <RefreshCw size={15} />
                <span>Refresh activity</span>
              </button>
            )}

            {activeTab === 'users' && currentUser.role === 'super_admin' && (
              <button onClick={() => setShowStaffModal(true)} className="btn btn-gold btn-sm">
                <UserPlus size={16} />
                <span>Add Staff Account</span>
              </button>
            )}
          </div>
        </header>

        {/* CONTENT PANELS */}
        <div className="dashboard-content">

          {/* 1. OVERVIEW TAB WITH RECHARTS */}
          {activeTab === 'overview' && (
            <div>
              {/* METRICS CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--color-forest)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Registered Users
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-forest)', margin: '6px 0' }}>
                    {initialMetrics.totalUsers}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-emerald)' }}>
                    Active youth & staff members
                  </div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--color-gold)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Secondary Students
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-gold)', margin: '6px 0' }}>
                    {initialMetrics.totalStudents}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    Enrolled delegates
                  </div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--color-emerald)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Partner Schools
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-emerald)', margin: '6px 0' }}>
                    {initialMetrics.totalSchools}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    Across Rwandan districts
                  </div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid #1a73e8' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Total Registrations
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1a73e8', margin: '6px 0' }}>
                    {initialMetrics.totalRegistrations}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    Conference attendee seats
                  </div>
                </div>
              </div>

              {/* RECHARTS ANALYTICS CHARTS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px', marginBottom: '32px' }}>
                
                {/* Conference Registrations Bar Chart */}
                <div className="card">
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={20} style={{ color: 'var(--color-emerald)' }} />
                    <span>Conference Participation Metrics</span>
                  </h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartMeetingData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8E5" />
                        <XAxis dataKey="name" fontSize={11} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                        <YAxis fontSize={11} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="registered" fill="var(--color-emerald)" name="Registered" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="capacity" fill="#D4A72C" name="Capacity" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Account Roles Distribution Pie Chart */}
                <div className="card">
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} style={{ color: 'var(--color-gold)' }} />
                    <span>Platform User Demographics</span>
                  </h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartRoleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartRoleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* RECENT ACTIVITY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
                <div className="card">
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', color: 'var(--color-forest)' }}>
                    Conferences Status Summary
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {meetings.map((m) => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#F8FAF9', borderRadius: 'var(--radius-sm)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.title}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>{formatDate(m.event_date)} • {m.venue}</div>
                        </div>
                        <span className="badge badge-emerald">{m.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', color: 'var(--color-forest)' }}>
                    Latest System Audit Logs
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {initialAuditLogs.slice(0, 5).map((log) => (
                      <div key={log.id} style={{ fontSize: '0.82rem', padding: '8px 12px', borderBottom: '1px solid var(--color-border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong style={{ color: 'var(--color-emerald)' }}>{log.action}</strong>
                          <span style={{ color: 'var(--color-text-subtle)' }}>{formatTime(log.created_at)}</span>
                        </div>
                        <div style={{ color: 'var(--color-text-muted)' }}>
                          User: {log.user_email || 'System'} {log.entity_type ? `• Target: ${log.entity_type}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. USERS MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
                <div style={{ position: 'relative', width: '320px' }}>
                  <input
                    type="text"
                    placeholder="Search users by name, email, school..."
                    className="form-input"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                  Total accounts: <strong>{filteredUsers.length}</strong>
                </div>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name & Email</th>
                      <th>Role</th>
                      <th>School & Level</th>
                      <th>Country</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>{u.email}</div>
                        </td>
                        <td>
                          <span className={`badge ${u.role === 'super_admin' ? 'badge-gold' : u.role === 'admin' ? 'badge-forest' : 'badge-emerald'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <div>{u.school_name || 'N/A'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>{u.class_level || ''}</div>
                        </td>
                        <td>{u.country || 'Rwanda'}</td>
                        <td>
                          {u.is_active ? (
                            <span style={{ color: 'var(--color-emerald)', fontWeight: 600, fontSize: '0.82rem' }}>Active</span>
                          ) : (
                            <span style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.82rem' }}>Suspended</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>
                          {formatDate(u.created_at)}
                        </td>
                        <td>
                          {u.role !== 'super_admin' && (
                            <button
                              onClick={() => handleToggleUserActive(u.id, u.is_active)}
                              className={`btn btn-sm ${u.is_active ? 'btn-outline' : 'btn-emerald'}`}
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              {u.is_active ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. CONFERENCES MANAGEMENT TAB */}
          {activeTab === 'meetings' && (
            <div>
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '18px', padding: '18px 22px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ marginBottom: '4px' }}>Conference calendar</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>Select a year to find events and open each attendee roster.</p>
                </div>
                <label style={{ minWidth: '180px' }}>
                  <span className="form-label">Conference year</span>
                  <select className="form-select" value={meetingYearFilter} onChange={(event) => setMeetingYearFilter(event.target.value)}>
                    <option value="all">All years</option>
                    {years.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </label>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Meeting #</th>
                      <th>Title & Theme</th>
                      <th>Date & Year</th>
                      <th>Venue</th>
                      <th>Capacity</th>
                      <th>Registered</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMeetings.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 700, color: 'var(--color-forest)' }}>#{m.meeting_number}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{m.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{m.theme}</div>
                        </td>
                        <td>
                          <div>{formatDate(m.event_date)}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>{m.start_time?.slice(0, 5)} - {m.end_time?.slice(0, 5)}</div>
                        </td>
                        <td>{m.venue}</td>
                        <td>{m.capacity} seats</td>
                        <td>
                          <div><strong>{m.registration_count || 0}</strong> registered</div>
                          <div style={{ color: 'var(--color-emerald)', fontSize: '0.78rem' }}>{m.attendance_count || 0} present</div>
                        </td>
                        <td>
                          <span className="badge badge-emerald">{m.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Link href={`/conferences/${m.id}`} className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                              View
                            </Link>
                            {canManageAttendance && <button 
                              onClick={() => {
                                setSelectedMeetingForAttendance(m.id);
                                fetchAttendance(m.id);
                                setActiveTab('attendance');
                              }} 
                              className="btn btn-emerald btn-sm" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              Attendees
                            </button>}
                            <button onClick={() => handleEditMeeting(m)} className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Edit</button>
                            <button onClick={() => handleDeleteMeeting(m)} className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-danger)' }} aria-label={`Delete ${m.title}`}>
                              <Trash2 size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedMeetingForAgenda(m.id);
                                fetchAgenda(m.id);
                                setActiveTab('agenda');
                              }} 
                              className="btn btn-outline btn-sm" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              Agenda
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. AGENDA BUILDER TAB */}
          {activeTab === 'agenda' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Select Conference:</label>
                  <select 
                    className="form-select"
                    style={{ width: 'auto', minWidth: '280px' }}
                    value={selectedMeetingForAgenda || ''}
                    onChange={(e) => fetchAgenda(Number(e.target.value))}
                  >
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        #{m.meeting_number}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button onClick={() => window.print()} className="btn btn-outline btn-sm">
                  <Printer size={16} />
                  <span>Print Agenda Sheet</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'flex-start' }}>
                {/* ADD SESSION FORM */}
                <div className="card" style={{ borderLeft: '4px solid var(--color-emerald)' }}>
                  <h4 style={{ fontSize: '1.15rem', marginBottom: '14px', color: 'var(--color-forest)' }}>
                    Add Session to Agenda
                  </h4>
                  <form onSubmit={handleAddAgendaItem}>
                    <div className="form-group">
                      <label className="form-label">Session Title *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={newAgendaItem.sessionTitle}
                        onChange={(e) => setNewAgendaItem({ ...newAgendaItem, sessionTitle: e.target.value })}
                        placeholder="e.g. Keynote Address or Panel Discussion"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Start Time</label>
                        <input
                          type="time"
                          className="form-input"
                          value={newAgendaItem.startTime}
                          onChange={(e) => setNewAgendaItem({ ...newAgendaItem, startTime: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End Time</label>
                        <input
                          type="time"
                          className="form-input"
                          value={newAgendaItem.endTime}
                          onChange={(e) => setNewAgendaItem({ ...newAgendaItem, endTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Speaker (Optional)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newAgendaItem.speakerName}
                          onChange={(e) => setNewAgendaItem({ ...newAgendaItem, speakerName: e.target.value })}
                          placeholder="e.g. Dr. Rutayisire"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Facilitator</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newAgendaItem.facilitatorName}
                          onChange={(e) => setNewAgendaItem({ ...newAgendaItem, facilitatorName: e.target.value })}
                          placeholder="e.g. Student Council Rep"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description / Session Brief</label>
                      <textarea
                        rows={2}
                        className="form-textarea"
                        value={newAgendaItem.description}
                        onChange={(e) => setNewAgendaItem({ ...newAgendaItem, description: e.target.value })}
                        placeholder="Brief summary of activities and discussions..."
                      />
                    </div>

                    <button type="submit" className="btn btn-emerald btn-sm" style={{ width: '100%' }}>
                      <Plus size={16} />
                      <span>Add Session to Agenda</span>
                    </button>
                  </form>
                </div>

                {/* SESSIONS ORDERED LIST */}
                <div className="card">
                  <h4 style={{ fontSize: '1.15rem', marginBottom: '16px', color: 'var(--color-forest)' }}>
                    Current Schedule ({agendaList.length} sessions)
                  </h4>

                  {agendaLoading ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>Loading agenda items...</p>
                  ) : agendaList.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No agenda sessions have been created for this summit yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {agendaList.map((item) => (
                        <div key={item.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          padding: '14px',
                          backgroundColor: '#F8FAF9',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: '3px solid var(--color-gold)'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-emerald)' }}>
                              {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-forest)' }}>
                              {item.session_title}
                            </div>
                            {item.description && (
                              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                {item.description}
                              </div>
                            )}
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', marginTop: '6px' }}>
                              {item.speaker_name && <span>Speaker: {item.speaker_name} </span>}
                              {item.facilitator_name && <span>• Facilitator: {item.facilitator_name}</span>}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteAgendaItem(item.id)}
                            className="btn btn-outline btn-sm" 
                            style={{ padding: '4px 6px', color: 'var(--color-danger)' }}
                            title="Delete session"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. ATTENDANCE & WALK-IN REGISTRATION TAB */}
          {activeTab === 'attendance' && canManageAttendance && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Select Conference:</label>
                  <select 
                    className="form-select"
                    style={{ width: 'auto', minWidth: '280px' }}
                    value={selectedMeetingForAttendance || ''}
                    onChange={(e) => fetchAttendance(Number(e.target.value))}
                  >
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        #{m.meeting_number}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowWalkinModal(true)} className="btn btn-gold btn-sm">
                    <UserPlus size={16} />
                    <span>Register Walk-in Attendee</span>
                  </button>
                  <button onClick={() => window.print()} className="btn btn-outline btn-sm">
                    <Printer size={16} />
                    <span>Print Roster</span>
                  </button>
                  <button onClick={() => fetchAttendance(selectedMeetingForAttendance)} className="btn btn-sm btn-outline">
                    <RefreshCw size={14} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {selectedMeetingForAttendance && (
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '18px', padding: '18px 22px', flexWrap: 'wrap' }}>
                  <div>
                    <span className="badge badge-gold">Conference roster</span>
                    <h3 style={{ marginTop: '8px' }}>{meetings.find((meeting) => meeting.id === selectedMeetingForAttendance)?.title}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div><strong style={{ fontSize: '1.35rem', color: 'var(--color-forest)' }}>{attendanceList.length}</strong><div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Registered</div></div>
                    <div><strong style={{ fontSize: '1.35rem', color: 'var(--color-emerald)' }}>{attendanceList.filter((attendee) => attendee.attendance_status === 'present').length}</strong><div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Present</div></div>
                  </div>
                </div>
              )}

              {attendanceLoading ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading registered delegates...</div>
              ) : attendanceList.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: 'var(--color-text-muted)' }}>No students have registered for this conference yet. Click &quot;Register Walk-in Attendee&quot; to add delegates arriving on-site.</p>
                </div>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Delegate Name</th>
                        <th>Email & Phone</th>
                        <th>School & Class</th>
                        <th>Registered on</th>
                        <th>Attendance</th>
                        <th>Update attendance</th>
                        <th>Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceList.map((att) => (
                        <tr key={att.user_id}>
                          <td style={{ fontWeight: 600 }}>{att.full_name}</td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>{att.email}</div>
                            {att.phone && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>{att.phone}</div>}
                          </td>
                          <td>
                            <div>{att.school_name || 'N/A'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>{att.class_level}</div>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>
                            {formatDate(att.registered_at)}
                          </td>
                          <td>
                            <span className={`badge ${att.attendance_status === 'present' ? 'badge-emerald' : att.attendance_status === 'absent' ? 'badge-forest' : 'badge-gold'}`}>
                              {att.attendance_status ? att.attendance_status.toUpperCase() : 'PENDING'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button 
                                onClick={() => handleMarkAttendance(att.user_id, 'present')}
                                className="btn btn-sm btn-emerald" 
                                style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                              >
                                Present
                              </button>
                              <button 
                                onClick={() => handleMarkAttendance(att.user_id, 'late')}
                                className="btn btn-sm btn-gold" 
                                style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                              >
                                Late
                              </button>
                              <button 
                                onClick={() => handleMarkAttendance(att.user_id, 'absent')}
                                className="btn btn-sm btn-outline" 
                                style={{ padding: '3px 7px', fontSize: '0.72rem', color: 'var(--color-danger)' }}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                          <td>
                            {att.attendance_status === 'present' ? (
                              <button
                                onClick={() => handleGenerateCertificate(att.user_id, selectedMeetingForAttendance)}
                                className="btn btn-sm btn-outline"
                                style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Award size={13} style={{ color: 'var(--color-gold)' }} />
                                <span>Issue Certificate</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>Mark present first</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 6. ARTICLES CMS TAB */}
          {activeTab === 'articles' && (
            <div>
              <div className="card" style={{ marginBottom: '20px', padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Publish learning that students can see and hear</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    Add a cover image and a video link to make each leadership lesson more engaging.
                  </p>
                </div>
                <span className="badge badge-emerald"><FileUp size={14} /> Images & video links supported</span>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Reading Time</th>
                      <th>Cover Image / Video</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((art) => (
                      <tr key={art.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                            {art.cover_image_url ? (
                              <img src={art.cover_image_url} alt="" loading="lazy" style={{ width: '52px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '52px', height: '48px', display: 'grid', placeItems: 'center', background: 'var(--color-success-soft)', color: 'var(--color-emerald)', borderRadius: '8px', flexShrink: 0 }}>
                                <BookOpen size={19} />
                              </div>
                            )}
                            <span style={{ fontWeight: 600 }}>{art.title}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-gold">{art.category_name}</span>
                        </td>
                        <td>{art.reading_time_minutes} min</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                            {art.cover_image_url && <span style={{ color: 'var(--color-emerald)' }}>✓ Photo</span>}
                            {art.video_url && <span style={{ color: 'var(--color-gold-hover)' }}>✓ Video</span>}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-emerald">{art.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minWidth: '180px' }}>
                            <Link href={`/explore/${art.slug}`} className="btn btn-outline btn-sm" style={{ padding: '4px 9px', fontSize: '0.75rem' }}>
                              View
                            </Link>
                            <button onClick={() => handleEditArticle(art)} className="btn btn-emerald btn-sm" style={{ padding: '4px 9px', fontSize: '0.75rem' }}>
                              Edit
                            </button>
                            <button onClick={() => handleDeleteArticle(art)} className="btn btn-outline btn-sm" style={{ padding: '4px 8px', color: 'var(--color-danger)' }} aria-label={`Delete ${art.title}`}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'learning' && (
            <div>
              <div className="card" style={{ marginBottom: '18px' }}>
                <h3 style={{ marginBottom: '6px' }}>How students are learning</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  This private staff view records lesson visits from signed-in student accounts, not anonymous visitors.
                </p>
              </div>
              {learningActivityLoading ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading student learning activity…</div>
              ) : learningActivity.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '38px' }}>
                  <BookOpen size={30} style={{ color: 'var(--color-emerald)', marginBottom: '10px' }} />
                  <h3>No student learning activity yet</h3>
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '6px' }}>Lesson visits and completions will appear here when students use published lessons.</p>
                </div>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr><th>Student</th><th>School</th><th>Lesson activity</th><th>Visits</th><th>Course progress</th><th>Learning status</th><th>Last active</th></tr>
                    </thead>
                    <tbody>
                      {learningActivity.map((item) => (
                        <tr key={`${item.user_id}-${item.article_id}`}>
                          <td><strong>{item.full_name}</strong><div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>{item.email}</div></td>
                          <td>{item.school_name || '—'}</td>
                          <td><Link href={`/explore/${item.article_slug}`} style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>{item.article_title}</Link></td>
                          <td>{item.view_count}</td>
                          <td>{item.completed_lessons} / {item.total_lessons} lessons</td>
                          <td><span className={`badge ${item.completed ? 'badge-emerald' : 'badge-gold'}`}>{item.completed ? 'Completed' : 'Exploring'}</span></td>
                          <td>{formatDateTime(item.last_viewed_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 7. RESOURCES MANAGEMENT TAB */}
          {activeTab === 'resources' && (
            <div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title & Description</th>
                      <th>Category</th>
                      <th>File Type</th>
                      <th>Size</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((res) => (
                      <tr key={res.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{res.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{res.description?.slice(0, 80)}...</div>
                        </td>
                        <td>{res.category_name || 'General Tool'}</td>
                        <td>
                          <span className="badge badge-emerald">{res.file_type.toUpperCase()}</span>
                        </td>
                        <td>{res.file_size_mb ? `${res.file_size_mb} MB` : 'N/A'}</td>
                        <td>
                          <span className={`badge ${res.status === 'active' ? 'badge-emerald' : 'badge-forest'}`}>
                            {res.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <a href={res.file_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                              Open
                            </a>
                            <button 
                              onClick={() => handleToggleResourceStatus(res.id, res.status || 'active')}
                              className="btn btn-sm btn-outline"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              {res.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button 
                              onClick={() => handleDeleteResource(res.id)}
                              className="btn btn-sm btn-outline"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-danger)' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. CONTACT MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sender</th>
                      <th>Subject</th>
                      <th>Message Snippet</th>
                      <th>Phone</th>
                      <th>Received</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>No contact inquiries yet.</td>
                      </tr>
                    ) : (
                      messages.map((msg) => (
                        <tr key={msg.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{msg.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>{msg.email}</div>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--color-forest)' }}>{msg.subject}</td>
                          <td style={{ maxWidth: '300px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            {msg.message?.slice(0, 70)}...
                          </td>
                          <td>{msg.phone || 'N/A'}</td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>
                            {formatDate(msg.created_at)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                onClick={() => setSelectedMessage(msg)}
                                className="btn btn-emerald btn-sm" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              >
                                Read
                              </button>
                              <a 
                                href={`mailto:${msg.email}?subject=RE: INTAMBWE - ${encodeURIComponent(msg.subject)}`}
                                className="btn btn-outline btn-sm" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              >
                                Reply Email
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. AUDIT LOGS TAB */}
          {activeTab === 'audit' && (
            <div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>User Account</th>
                      <th>Entity Type</th>
                      <th>Target ID</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialAuditLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>
                          {formatDateTime(log.created_at)}
                        </td>
                        <td>
                          <span className="badge badge-forest">{log.action}</span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{log.user_email || `User #${log.user_id || 'System'}`}</td>
                        <td>{log.entity_type || 'system'}</td>
                        <td>{log.entity_id || '-'}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>{log.ip_address || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* WALK-IN REGISTRATION MODAL */}
      {showWalkinModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Register On-Site Walk-In Delegate</h3>
              <button onClick={() => setShowWalkinModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleWalkinSubmit}>
              <div className="form-group">
                <label className="form-label">Delegate Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={walkinData.fullName}
                  onChange={(e) => setWalkinData({ ...walkinData, fullName: e.target.value })}
                  placeholder="e.g. Samuel Mugisha"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={walkinData.email}
                  onChange={(e) => setWalkinData({ ...walkinData, email: e.target.value })}
                  placeholder="e.g. samuel@ldk.rw"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Secondary School *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={walkinData.school}
                    onChange={(e) => setWalkinData({ ...walkinData, school: e.target.value })}
                    placeholder="e.g. Lycée de Kigali"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Class / Level</label>
                  <input
                    type="text"
                    className="form-input"
                    value={walkinData.classLevel}
                    onChange={(e) => setWalkinData({ ...walkinData, classLevel: e.target.value })}
                    placeholder="e.g. Senior 5"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  value={walkinData.phone}
                  onChange={(e) => setWalkinData({ ...walkinData, phone: e.target.value })}
                  placeholder="+250 788 000 000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  className="form-input"
                  value={walkinData.notes}
                  onChange={(e) => setWalkinData({ ...walkinData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowWalkinModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={walkinLoading} className="btn btn-emerald">
                  {walkinLoading ? 'Checking in...' : 'Check-In as Present'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD RESOURCE MODAL */}
      {showResourceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '550px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Add Educational Resource / Download</h3>
              <button onClick={() => setShowResourceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleCreateResource}>
              <div className="form-group">
                <label className="form-label">Resource Title *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  placeholder="e.g. Student Council Meeting Agenda Template"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">File Type *</label>
                  <select
                    className="form-select"
                    value={newResource.fileType}
                    onChange={(e) => setNewResource({ ...newResource, fileType: e.target.value })}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="guide">Leadership Guide</option>
                    <option value="worksheet">Interactive Worksheet</option>
                    <option value="presentation">Presentation Slides</option>
                    <option value="case_study">Case Study</option>
                    <option value="video">Video Recording Link</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">File Size (MB)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={newResource.fileSizeMb}
                    onChange={(e) => setNewResource({ ...newResource, fileSizeMb: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={newResource.categoryId}
                  onChange={(e) => setNewResource({ ...newResource, categoryId: e.target.value })}
                >
                  <option value="">Uncategorized</option>
                  {resourceCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">File URL / Download Link *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newResource.fileUrl}
                  onChange={(e) => setNewResource({ ...newResource, fileUrl: e.target.value })}
                  placeholder="https://... or /resources/filename.pdf"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Summary *</label>
                <textarea
                  rows={3}
                  required
                  className="form-textarea"
                  value={newResource.description}
                  onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                  placeholder="Brief explanation of how student leaders should use this resource..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowResourceModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald">Publish Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MESSAGE DETAILS MODAL */}
      {selectedMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '580px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest)' }}>Contact Inquiry Details</h3>
              <button onClick={() => setSelectedMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#F8FAF9', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.9rem' }}>
              <div><strong>Sender:</strong> {selectedMessage.name}</div>
              <div><strong>Email:</strong> {selectedMessage.email}</div>
              {selectedMessage.phone && <div><strong>Phone:</strong> {selectedMessage.phone}</div>}
              <div><strong>Date:</strong> {formatDateTime(selectedMessage.created_at)}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-forest)', marginBottom: '4px' }}>
                Subject: {selectedMessage.subject}
              </div>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-text-main)', whiteSpace: 'pre-line' }}>
                {selectedMessage.message}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedMessage(null)} className="btn btn-outline">Close</button>
              <a 
                href={`mailto:${selectedMessage.email}?subject=RE: INTAMBWE - ${encodeURIComponent(selectedMessage.subject)}`} 
                className="btn btn-gold"
              >
                Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MEETING MODAL */}
      {showMeetingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem' }}>{editingMeetingId ? 'Edit Conference' : 'Create New Leadership Summit'}</h3>
              <button onClick={() => { setShowMeetingModal(false); setEditingMeetingId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleCreateMeeting}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Meeting Number</label>
                  <input type="text" required className="form-input" value={newMeeting.meetingNumber} onChange={(e) => setNewMeeting({ ...newMeeting, meetingNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity (Seats)</label>
                  <input type="number" required className="form-input" value={newMeeting.capacity} onChange={(e) => setNewMeeting({ ...newMeeting, capacity: Number(e.target.value) })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Summit Title</label>
                <input type="text" required className="form-input" value={newMeeting.title} onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })} placeholder="e.g. Annual Rwanda Youth Leadership Summit" />
              </div>

              <div className="form-group">
                <label className="form-label">Theme</label>
                <input type="text" required className="form-input" value={newMeeting.theme} onChange={(e) => setNewMeeting({ ...newMeeting, theme: e.target.value })} placeholder="e.g. Ethical Action in Secondary Schools" />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} required className="form-textarea" value={newMeeting.description} onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Conference date and year</label>
                  <input type="date" required className="form-input" value={newMeeting.eventDate} onChange={(e) => setNewMeeting({ ...newMeeting, eventDate: e.target.value })} />
                  <small style={{ color: 'var(--color-text-subtle)' }}>{newMeeting.eventDate ? `Conference year: ${newMeeting.eventDate.slice(0, 4)}` : 'Select the event year in the date picker.'}</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Start</label>
                  <input type="time" className="form-input" value={newMeeting.startTime} onChange={(e) => setNewMeeting({ ...newMeeting, startTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">End</label>
                  <input type="time" className="form-input" value={newMeeting.endTime} onChange={(e) => setNewMeeting({ ...newMeeting, endTime: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Venue</label>
                <input type="text" required className="form-input" value={newMeeting.venue} onChange={(e) => setNewMeeting({ ...newMeeting, venue: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Conference status</label>
                <select className="form-select" value={newMeeting.status} onChange={(e) => setNewMeeting({ ...newMeeting, status: e.target.value })}>
                  {['draft', 'published', 'registration_open', 'registration_closed', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Conference image URL (optional)</label>
                  <input className="form-input" value={newMeeting.coverImageUrl || ''} onChange={(e) => setNewMeeting({ ...newMeeting, coverImageUrl: e.target.value })} placeholder="https://... or /images/conference.jpg" />
                </div>
                <div className="form-group">
                  <label className="form-label">Conference video URL (optional)</label>
                  <input className="form-input" value={newMeeting.videoUrl || ''} onChange={(e) => setNewMeeting({ ...newMeeting, videoUrl: e.target.value })} placeholder="https://... or /meeting.mp4" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => { setShowMeetingModal(false); setEditingMeetingId(null); }} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald">{editingMeetingId ? 'Save changes' : 'Publish Conference'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ARTICLE MODAL WITH PHOTO & VIDEO URLS */}
      {showArticleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem' }}>{editingArticleId ? 'Edit Leadership Lesson' : 'Create Leadership Curriculum Article'}</h3>
              <button onClick={() => { setShowArticleModal(false); setEditingArticleId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleCreateArticle}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Article Title</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={newArticle.title} 
                    onChange={(e) => {
                      const t = e.target.value;
                      const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setNewArticle({ ...newArticle, title: t, slug });
                    }} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={newArticle.categoryId}
                    onChange={(e) => setNewArticle({ ...newArticle, categoryId: Number(e.target.value) })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Cover Image URL or local path</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newArticle.coverImageUrl} 
                    onChange={(e) => setNewArticle({ ...newArticle, coverImageUrl: e.target.value })} 
                    placeholder="https://... or /images/leadership.jpg"
                  />
                  <small style={{ display: 'block', marginTop: '6px', color: 'var(--color-text-subtle)' }}>Use a public image URL or a file in the project&apos;s public folder.</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Video URL or local video path</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newArticle.videoUrl} 
                    onChange={(e) => setNewArticle({ ...newArticle, videoUrl: e.target.value })} 
                    placeholder="YouTube/Vimeo URL or /meeting.mp4"
                  />
                  <small style={{ display: 'block', marginTop: '6px', color: 'var(--color-text-subtle)' }}>YouTube/Vimeo links embed; MP4, WebM, and Ogg links play in the lesson.</small>
                </div>
              </div>
              {newArticle.coverImageUrl && (
                <div className="form-group">
                  <label className="form-label">Image preview</label>
                  <img src={newArticle.coverImageUrl} alt="Article cover preview" style={{ display: 'block', width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">URL Slug</label>
                <input type="text" required className="form-input" value={newArticle.slug} onChange={(e) => setNewArticle({ ...newArticle, slug: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Introduction Summary</label>
                <textarea rows={2} required className="form-textarea" value={newArticle.introduction} onChange={(e) => setNewArticle({ ...newArticle, introduction: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Main Explanations & Content</label>
                <textarea rows={6} required className="form-textarea" value={newArticle.content} onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Learning Objectives (One per line)</label>
                <textarea rows={3} className="form-textarea" value={newArticle.learningObjectives} onChange={(e) => setNewArticle({ ...newArticle, learningObjectives: e.target.value })} placeholder="1. Understand...&#10;2. Apply..." />
              </div>

              <div className="form-group">
                <label className="form-label">Practical Exercises</label>
                <textarea rows={2} className="form-textarea" value={newArticle.practicalExercises} onChange={(e) => setNewArticle({ ...newArticle, practicalExercises: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Critical Thinking Questions</label>
                <textarea rows={2} className="form-textarea" value={newArticle.criticalThinkingQuestions} onChange={(e) => setNewArticle({ ...newArticle, criticalThinkingQuestions: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Reflection Activity</label>
                  <textarea rows={3} className="form-textarea" value={newArticle.reflectionActivity} onChange={(e) => setNewArticle({ ...newArticle, reflectionActivity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Publication status</label>
                  <select className="form-select" value={newArticle.status} onChange={(e) => setNewArticle({ ...newArticle, status: e.target.value })}>
                    {['draft', 'submitted', 'approved', 'published', 'rejected', 'archived'].map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reading time (minutes)</label>
                <input type="number" min="1" className="form-input" value={newArticle.readingTimeMinutes} onChange={(e) => setNewArticle({ ...newArticle, readingTimeMinutes: Number(e.target.value) })} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => { setShowArticleModal(false); setEditingArticleId(null); }} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald">{editingArticleId ? 'Save changes' : 'Save article'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL (SUPER ADMIN ONLY) */}
      {showStaffModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Create Authorized Staff Account</h3>
              <button onClick={() => setShowStaffModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" required className="form-input" value={newStaff.fullName} onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Staff Email</label>
                <input type="email" required className="form-input" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password</label>
                <input type="password" required minLength={8} className="form-input" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Role</label>
                <select className="form-select" value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}>
                  <option value="admin">Administrator</option>
                  <option value="event_manager">Event Manager</option>
                  <option value="content_editor">Content Editor</option>
                  <option value="mentor">Mentor / Speaker</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowStaffModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-gold">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
