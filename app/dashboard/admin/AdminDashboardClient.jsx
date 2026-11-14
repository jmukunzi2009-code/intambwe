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
  Video,
  Pencil,
  Quote,
  Sparkles,
  Heart,
  FileText,
  HelpCircle,
  Upload,
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
import { ThemeModeButton } from '@/components/ThemeProvider';
import { StickTonePicker } from '@/components/StickTonePicker';

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

function getLeaderMediaType(leader) {
  if (['message', 'image', 'video', 'audio'].includes(leader.media_type)) return leader.media_type;
  if (leader.video_url) return 'video';
  if (leader.image_url && leader.image_url !== '/about/profile.png') return 'image';
  return 'message';
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
  schools,
  initialTeam = [],
  initialMoments = [],
  initialNotes = [],
  initialLeaders = [],
  initialFounderImage = '/about/sarah-image.jpg'
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [founderImageUrl, setFounderImageUrl] = useState(initialFounderImage || '/about/sarah-image.jpg');
  const [savingFounderImage, setSavingFounderImage] = useState(false);
  const [users, setUsers] = useState(initialUsers);
  const [meetings, setMeetings] = useState(initialMeetings);
  const [articles, setArticles] = useState(initialArticles);
  const [courseCategories, setCourseCategories] = useState(categories || []);
  const [categoriesList, setCategoriesList] = useState(categories || []);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    iconName: 'BookOpen',
    coverImageUrl: '',
    videoUrl: '',
    status: 'published',
  });

  const [stickNotes, setStickNotes] = useState(initialNotes || []);
  const [stickNotesLoading, setStickNotesLoading] = useState(false);
  const [stickNotesError, setStickNotesError] = useState('');
  const [stickNoteFilter, setStickNoteFilter] = useState('all');
  const [leaderHighlights, setLeaderHighlights] = useState(initialLeaders || []);
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);
  const [leaderForm, setLeaderForm] = useState({
    name: '',
    title: '',
    quote: '',
    highlight: '',
    mediaType: 'message',
    mediaUrl: '',
    imageUrl: '/about/profile.png',
    videoUrl: '',
    category: 'Youth Leadership',
    badge: 'Featured Leader',
    sortOrder: 0,
  });
  const [notesSubTab, setNotesSubTab] = useState('notes');
  const [showEditStickNoteModal, setShowEditStickNoteModal] = useState(false);
  const [editingStickNote, setEditingStickNote] = useState(null);
  const [stickNoteForm, setStickNoteForm] = useState({
    title: '',
    body: '',
    noteKind: 'quote',
    tone: 'tone-gold',
    mediaUrl: '',
    mediaType: 'none',
    visibility: 'published',
  });

  const [showEditResourceModal, setShowEditResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resources, setResources] = useState(initialResources);
  const [messages, setMessages] = useState(initialMessages);

  // Curriculum category-by-category view state
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  // Team & Moments CMS State
  const [teamMembers, setTeamMembers] = useState(initialTeam || []);
  const [communityMoments, setCommunityMoments] = useState(initialMoments || []);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', role: '', bio: '', imageUrl: '/about/profile.png', sortOrder: 0 });

  const [showMomentModal, setShowMomentModal] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);
  const [momentForm, setMomentForm] = useState({ title: '', description: '', imageUrl: '/about/group-photo.jpg', authorQuote: '', authorName: '', sortOrder: 0 });

  // Add Stick Note Modal State
  const [showAddStickNoteModal, setShowAddStickNoteModal] = useState(false);
  const [newStickNoteInput, setNewStickNoteInput] = useState({
    title: '',
    body: '',
    noteKind: 'quote',
    tone: 'tone-gold',
    mediaUrl: '',
    mediaType: 'none',
    visibility: 'published',
  });
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
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    fileType: 'pdf',
    fileUrl: '',
    fileSizeMb: 1.5,
    categoryId: resourceCategories[0]?.id || '',
    isPublic: true,
  });

  // User Management Edit Modal state
  const [editingUser, setEditingUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    role: 'student',
    isActive: true,
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
    venue: 'Rwamagana, Eastern Province, Rwanda',
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
    quizQuestion: '',
    quizOptions: ['', '', '', ''],
    quizCorrectIndex: 0,
    quizExplanation: '',
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

  // Edit Resource
  const handleEditResource = (resource) => {
    setEditingResourceId(resource.id);
    setNewResource({
      title: resource.title || '',
      description: resource.description || '',
      fileType: resource.file_type || 'pdf',
      fileUrl: resource.file_url || '',
      fileSizeMb: resource.file_size_mb || 1.5,
      categoryId: resource.category_id || (resourceCategories[0]?.id || 1),
      isPublic: resource.is_public !== false,
    });
    setShowResourceModal(true);
  };

  // Create or Update Resource
  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      const url = editingResourceId ? `/api/resources?id=${editingResourceId}` : '/api/resources';
      const method = editingResourceId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResource),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save resource');

      const categoryName = resourceCategories.find((category) => category.id === Number(newResource.categoryId))?.name;
      if (editingResourceId) {
        setResources((current) => current.map((r) => r.id === editingResourceId ? { ...r, ...data.resource, category_name: categoryName } : r));
        alert('Resource updated successfully!');
      } else {
        setResources((current) => [{ ...data.resource, category_name: categoryName }, ...current]);
        alert('Resource added successfully!');
      }
      setShowResourceModal(false);
      setEditingResourceId(null);
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

  // --- USER MANAGEMENT HANDLERS ---
  const handleOpenUserEdit = (u) => {
    setEditingUser(u);
    setUserForm({
      fullName: u.full_name || '',
      email: u.email || '',
      role: u.role || 'student',
      isActive: Boolean(u.is_active),
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: editingUser.id,
          fullName: userForm.fullName,
          email: userForm.email,
          role: userForm.role,
          isActive: userForm.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setUsers((prev) => prev.map((u) => u.id === editingUser.id ? {
        ...u,
        full_name: userForm.fullName,
        email: userForm.email,
        role: userForm.role,
        is_active: userForm.isActive,
      } : u));
      setShowUserModal(false);
      setEditingUser(null);
      alert('User account updated successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.role === 'super_admin') {
      alert('Super Admin accounts cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete user account "${u.full_name}" (${u.email})? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users?id=${u.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: u.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      setUsers((prev) => prev.filter((item) => item.id !== u.id));
      alert(data.message || 'User deleted successfully.');
    } catch (err) {
      alert(err.message);
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
      quizQuestion: article.quiz_question || '',
      quizOptions: Array.isArray(article.quiz_options) ? article.quiz_options : (article.quiz_options ? JSON.parse(article.quiz_options) : ['', '', '', '']),
      quizCorrectIndex: Number.isInteger(Number(article.quiz_correct_index)) ? Number(article.quiz_correct_index) : 0,
      quizExplanation: article.quiz_explanation || '',
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

  
  const handleSaveFounderImage = async (url) => {
    setSavingFounderImage(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'founder_image_url', value: url, description: 'Founder Portrait Image' }),
      });
      if (!res.ok) throw new Error('Failed to update founder photo.');
      setFounderImageUrl(url);
      alert('Founder image updated successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingFounderImage(false);
    }
  };

  // --- STICK NOTES HANDLERS ---
  const fetchStickNotes = async () => {
    setStickNotesLoading(true);
    setStickNotesError('');
    try {
      const res = await fetch('/api/notes?manage=1');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load stick notes');
      setStickNotes(data.notes || []);
    } catch (err) {
      console.error(err);
      setStickNotesError(err.message);
    } finally {
      setStickNotesLoading(false);
    }
  };

  const handleCreateStickNote = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStickNoteInput),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create stick note');
      setStickNotes((prev) => [data.note, ...prev]);
      setShowAddStickNoteModal(false);
      setNewStickNoteInput({
        title: '',
        body: '',
        noteKind: 'quote',
        tone: 'tone-gold',
        mediaUrl: '',
        mediaType: 'none',
        visibility: 'published',
      });
      alert(data.message || 'Stick note shared on community wall!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEditStickNote = (note) => {
    setEditingStickNote(note);
    setStickNoteForm({
      title: note.title || '',
      body: note.body || '',
      noteKind: note.note_kind || 'quote',
      tone: note.tone || 'tone-gold',
      mediaUrl: note.media_url || '',
      mediaType: note.media_type || 'none',
      visibility: note.visibility || 'published',
    });
    setShowEditStickNoteModal(true);
  };

  const handleSaveEditStickNote = async (e) => {
    e.preventDefault();
    if (!editingStickNote) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: editingStickNote.id,
          ...stickNoteForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update stick note');
      setStickNotes((prev) => prev.map((n) => (n.id === editingStickNote.id ? { ...n, ...data.note } : n)));
      setShowEditStickNoteModal(false);
      setEditingStickNote(null);
      alert('Stick note updated successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteStickNote = async (note) => {
    if (!confirm(`Permanently delete stick note "${note.title}"?`)) return;
    try {
      const res = await fetch(`/api/notes?id=${note.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete stick note');
      setStickNotes((prev) => prev.filter((n) => n.id !== note.id));
      alert('Stick note deleted.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStickNoteVisibility = async (note, newVisibility) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: note.id,
          visibility: newVisibility,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update visibility');
      setStickNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, visibility: newVisibility } : n)));
    } catch (err) {
      alert(err.message);
    }
  };

  // --- LEADER HIGHLIGHTS HANDLERS ---
  const handleOpenLeaderModal = (leader = null) => {
    if (leader) {
      const mediaType = getLeaderMediaType(leader);
      setEditingLeader(leader);
      setLeaderForm({
        name: leader.name || '',
        title: leader.title || '',
        quote: leader.quote || '',
        highlight: leader.highlight || '',
        mediaType,
        mediaUrl: leader.media_url || (mediaType === 'video' || mediaType === 'audio' ? leader.video_url : mediaType === 'image' ? leader.image_url : '') || '',
        imageUrl: leader.image_url || '/about/profile.png',
        videoUrl: leader.video_url || '',
        category: leader.category || 'Youth Leadership',
        badge: leader.badge || 'Featured Leader',
        sortOrder: leader.sort_order || 0,
      });
    } else {
      setEditingLeader(null);
      setLeaderForm({
        name: '',
        title: '',
        quote: '',
        highlight: '',
        mediaType: 'message',
        mediaUrl: '',
        imageUrl: '/about/profile.png',
        videoUrl: '',
        category: 'Youth Leadership',
        badge: 'Featured Leader',
        sortOrder: leaderHighlights.length + 1,
      });
    }
    setShowLeaderModal(true);
  };

  const handleSaveLeader = async (e) => {
    e.preventDefault();
    try {
      const url = editingLeader ? `/api/leaders/${editingLeader.id}` : '/api/leaders';
      const method = editingLeader ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leaderForm,
          imageUrl: leaderForm.mediaType === 'image' ? leaderForm.mediaUrl : '/about/profile.png',
          videoUrl: leaderForm.mediaType === 'video' ? leaderForm.mediaUrl : '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save leader highlight');

      if (editingLeader) {
        setLeaderHighlights((prev) => prev.map((l) => (l.id === editingLeader.id ? data.leader : l)));
        alert('Leader highlight updated!');
      } else {
        setLeaderHighlights((prev) => [...prev.filter((l) => l.id !== data.leader.id), data.leader]);
        alert('Leader highlight added!');
      }
      setShowLeaderModal(false);
      setEditingLeader(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteLeader = async (leader) => {
    if (!confirm(`Delete leader highlight for "${leader.name}"?`)) return;
    try {
      const res = await fetch(`/api/leaders/${leader.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete leader highlight');
      setLeaderHighlights((prev) => prev.filter((l) => l.id !== leader.id));
      alert('Leader highlight deleted.');
    } catch (err) {
      alert(err.message);
    }
  };

  // --- CATEGORY & COURSE CMS HANDLERS ---
  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategoryId(cat.id);
      setCategoryForm({
        name: cat.name || '',
        slug: cat.slug || '',
        description: cat.description || '',
        iconName: cat.icon_name || 'BookOpen',
        coverImageUrl: cat.cover_image_url || '',
        videoUrl: cat.video_url || '',
        status: cat.status || 'published',
      });
    } else {
      setEditingCategoryId(null);
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        iconName: 'BookOpen',
        coverImageUrl: '',
        videoUrl: '',
        status: 'published',
      });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const url = editingCategoryId ? `/api/categories/${editingCategoryId}` : '/api/categories';
      const method = editingCategoryId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save course category');

      if (editingCategoryId) {
        setCourseCategories((prev) => prev.map((c) => (c.id === editingCategoryId ? { ...c, ...data.category } : c)));
        setCategoriesList((prev) => prev.map((c) => (c.id === editingCategoryId ? { ...c, ...data.category } : c)));
        alert('Course category updated successfully!');
      } else {
        setCourseCategories((prev) => [...prev, data.category]);
        setCategoriesList((prev) => [...prev, data.category]);
        alert('Course category created successfully!');
      }
      setShowCategoryModal(false);
      setEditingCategoryId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!confirm(`Delete course category "${cat.name}"? Articles in this course will be unassigned.`)) return;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');
      setCourseCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setCategoriesList((prev) => prev.filter((c) => c.id !== cat.id));
      if (selectedCourseFilter === String(cat.id)) {
        setSelectedCourseFilter('all');
      }
      alert('Course category removed.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleArticleStatus = async (article, newStatus) => {
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update lesson status');
      setArticles((prev) => prev.map((a) => (a.id === article.id ? { ...a, status: newStatus } : a)));
    } catch (err) {
      alert(err.message);
    }
  };

  // --- ABOUT US CMS HANDLERS ---
  const handleOpenTeamModal = (member = null) => {
    if (member) {
      setEditingTeamMember(member);
      setTeamForm({
        name: member.name || '',
        role: member.role || '',
        bio: member.bio || '',
        imageUrl: member.image_url || '/about/profile.png',
        sortOrder: member.sort_order || 0,
      });
    } else {
      setEditingTeamMember(null);
      setTeamForm({
        name: '',
        role: '',
        bio: '',
        imageUrl: '/about/profile.png',
        sortOrder: teamMembers.length + 1,
      });
    }
    setShowTeamModal(true);
  };

  const handleSaveTeamMember = async (e) => {
    e.preventDefault();
    try {
      const url = editingTeamMember ? `/api/team/${editingTeamMember.id}` : '/api/team';
      const method = editingTeamMember ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save team member');

      if (editingTeamMember) {
        setTeamMembers((prev) => prev.map((m) => (m.id === editingTeamMember.id ? data.member : m)));
        alert('Team profile updated!');
      } else {
        setTeamMembers((prev) => [...prev, data.member]);
        alert('Team profile added!');
      }
      setShowTeamModal(false);
      setEditingTeamMember(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTeamMember = async (member) => {
    if (!confirm(`Delete team profile for "${member.name}"?`)) return;
    try {
      const res = await fetch(`/api/team/${member.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete team member');
      setTeamMembers((prev) => prev.filter((m) => m.id !== member.id));
      alert('Team profile removed.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenMomentModal = (moment = null) => {
    if (moment) {
      setEditingMoment(moment);
      setMomentForm({
        title: moment.title || '',
        description: moment.description || '',
        imageUrl: moment.image_url || '/about/group-photo.jpg',
        authorQuote: moment.author_quote || '',
        authorName: moment.author_name || '',
        sortOrder: moment.sort_order || 0,
      });
    } else {
      setEditingMoment(null);
      setMomentForm({
        title: '',
        description: '',
        imageUrl: '/about/group-photo.jpg',
        authorQuote: '',
        authorName: '',
        sortOrder: communityMoments.length + 1,
      });
    }
    setShowMomentModal(true);
  };

  const handleSaveMoment = async (e) => {
    e.preventDefault();
    try {
      const url = editingMoment ? `/api/moments/${editingMoment.id}` : '/api/moments';
      const method = editingMoment ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(momentForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save community moment');

      if (editingMoment) {
        setCommunityMoments((prev) => prev.map((m) => (m.id === editingMoment.id ? data.moment : m)));
        alert('Community moment updated!');
      } else {
        setCommunityMoments((prev) => [data.moment, ...prev]);
        alert('Community moment published!');
      }
      setShowMomentModal(false);
      setEditingMoment(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMoment = async (moment) => {
    if (!confirm(`Delete moment "${moment.title}"?`)) return;
    try {
      const res = await fetch(`/api/moments/${moment.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete moment');
      setCommunityMoments((prev) => prev.filter((m) => m.id !== moment.id));
      alert('Community moment deleted.');
    } catch (err) {
      alert(err.message);
    }
  };

  // --- INSTANT FILE UPLOAD HELPER ---
  const handleFileUpload = async (file, onUploaded) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onUploaded(data.url);
      alert('File uploaded successfully!');
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
    <div className="dashboard-layout admin-dashboard-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="dashboard-sidebar admin-dashboard-sidebar">
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

        <nav className="dashboard-sidebar-nav admin-dashboard-nav" aria-label="Admin dashboard sections" style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
            onClick={() => {
              setActiveTab('notes');
              if (stickNotes.length === 0) fetchStickNotes();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'notes' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <Quote size={18} style={{ color: 'var(--color-gold)' }} />
            <span>Sticky Notes &amp; Quotes Wall</span>
          </button>

          <button 
            onClick={() => setActiveTab('about_cms')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'about_cms' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <Sparkles size={18} style={{ color: 'var(--color-gold)' }} />
            <span>About Us Page CMS</span>
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
      <main className="dashboard-main admin-dashboard-main">
        {/* TOPBAR */}
        <header className="dashboard-topbar admin-dashboard-topbar">
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
              {activeTab === 'notes' && 'Sticky Notes, Quotes & Wall Moderation'}
              {activeTab === 'about_cms' && 'About Us CMS (Leadership Team & Community Moments)'}
              {activeTab === 'audit' && 'Security & Operational Audit Trail'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeModeButton />
            {activeTab === 'notes' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={fetchStickNotes} className="btn btn-outline btn-sm">
                  <RefreshCw size={14} className={stickNotesLoading ? 'spin' : ''} />
                  <span>Refresh Wall</span>
                </button>
                <button onClick={() => setShowAddStickNoteModal(true)} className="btn btn-emerald btn-sm">
                  <Plus size={16} />
                  <span>Add Note / Quote</span>
                </button>
              </div>
            )}

            {activeTab === 'about_cms' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleOpenTeamModal()} className="btn btn-emerald btn-sm">
                  <Plus size={16} />
                  <span>Add Team Member</span>
                </button>
                <button onClick={() => handleOpenMomentModal()} className="btn btn-gold btn-sm">
                  <Plus size={16} />
                  <span>Add Moment</span>
                </button>
              </div>
            )}

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
                  venue: 'Rwamagana, Eastern Province, Rwanda', capacity: 200, status: 'published',
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
        <div className="dashboard-content admin-dashboard-content">

          {/* 1. OVERVIEW TAB WITH RECHARTS */}
          {activeTab === 'overview' && (
            <div className="admin-dashboard-overview">
              {/* METRICS CARDS */}
              <div className="admin-dashboard-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
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
              <div className="admin-dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px', marginBottom: '32px' }}>
                
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
              <div className="admin-dashboard-activity" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
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
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleOpenUserEdit(u)}
                              className="btn btn-sm btn-outline"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Edit user details and role"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            {u.role !== 'super_admin' && (
                              <button
                                onClick={() => handleToggleUserActive(u.id, u.is_active)}
                                className={`btn btn-sm ${u.is_active ? 'btn-outline' : 'btn-emerald'}`}
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              >
                                {u.is_active ? 'Suspend' : 'Activate'}
                              </button>
                            )}
                            {u.role !== 'super_admin' && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="btn btn-sm btn-outline"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-danger)' }}
                                title="Delete user account"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            )}
                          </div>
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

          {/* 6. ARTICLES & COURSE CMS TAB */}
          {activeTab === 'articles' && (
            <div>
              {/* CATEGORY & COURSE FILTER PILLS */}
              <div className="card" style={{ marginBottom: '24px', padding: '18px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest)', margin: 0 }}>
                      Curriculum &amp; Course Builder Studio
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
                      Select a leadership course to manage its units and lessons, or click &ldquo;+ Add Course&rdquo; to create a new curriculum track.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleOpenCategoryModal()} className="btn btn-emerald btn-sm">
                      <Plus size={15} /> <span>Add Course / Category</span>
                    </button>
                    <button 
                      onClick={() => {
                        setEditingArticleId(null);
                        const targetCatId = selectedCourseFilter === 'all' ? (courseCategories[0]?.id || 1) : Number(selectedCourseFilter);
                        setNewArticle({
                          title: '', slug: '', categoryId: targetCatId, introduction: '', content: '',
                          learningObjectives: '', practicalExercises: '', criticalThinkingQuestions: '',
                          reflectionActivity: '', readingTimeMinutes: 5, coverImageUrl: '', videoUrl: '', status: 'published',
                        });
                        setShowArticleModal(true);
                      }} 
                      className="btn btn-gold btn-sm"
                    >
                      <Plus size={15} /> <span>Add Lesson</span>
                    </button>
                  </div>
                </div>

                {/* FILTER PILLS */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--color-border-light)', paddingTop: '12px' }}>
                  <button
                    onClick={() => setSelectedCourseFilter('all')}
                    className={`btn btn-sm ${selectedCourseFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  >
                    All Curriculum ({articles.length})
                  </button>
                  {courseCategories.map((c) => {
                    const count = articles.filter((a) => Number(a.category_id) === Number(c.id)).length;
                    const isSelected = String(selectedCourseFilter) === String(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCourseFilter(String(c.id))}
                        className={`btn btn-sm ${isSelected ? 'btn-emerald' : 'btn-outline'}`}
                        style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span>{c.name}</span>
                        <span style={{ fontSize: '0.74rem', opacity: 0.85, background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: '10px' }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* COURSE DETAILS & SPECIFIC LESSONS */}
              {selectedCourseFilter !== 'all' ? (() => {
                const selectedCat = courseCategories.find((c) => String(c.id) === String(selectedCourseFilter));
                const courseLessons = articles
                  .filter((a) => Number(a.category_id) === Number(selectedCourseFilter))
                  .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || Number(a.id) - Number(b.id));

                if (!selectedCat) return null;

                return (
                  <div>
                    {/* COURSE HEADER BANNER */}
                    <div className="card" style={{ marginBottom: '24px', padding: '24px', borderLeft: '4px solid var(--color-emerald)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span className="badge badge-emerald">{selectedCat.status || 'published'}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>Slug: <code>{selectedCat.slug}</code></span>
                        </div>
                        <h2 style={{ fontSize: '1.4rem', color: 'var(--color-forest)', marginBottom: '8px' }}>
                          {selectedCat.name}
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '750px' }}>
                          {selectedCat.description || 'Leadership development track empowering secondary school leaders with practical skills.'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingArticleId(null);
                            setNewArticle({
                              title: '', slug: '', categoryId: selectedCat.id, introduction: '', content: '',
                              learningObjectives: '', practicalExercises: '', criticalThinkingQuestions: '',
                              reflectionActivity: '', readingTimeMinutes: 5, coverImageUrl: '', videoUrl: '', status: 'published',
                            });
                            setShowArticleModal(true);
                          }}
                          className="btn btn-emerald btn-sm"
                        >
                          <Plus size={15} /> <span>Add Lesson to this Course</span>
                        </button>
                        <button onClick={() => handleOpenCategoryModal(selectedCat)} className="btn btn-outline btn-sm">
                          <Pencil size={14} /> <span>Edit Course</span>
                        </button>
                        <Link href={`/courses/${selectedCat.id}`} className="btn btn-outline btn-sm">
                          <Eye size={14} /> <span>Preview</span>
                        </Link>
                        <button 
                          onClick={() => handleDeleteCategory(selectedCat)} 
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={14} /> <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* LESSONS CARDS GRID */}
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--color-forest)' }}>
                        Lessons in this Course ({courseLessons.length})
                      </h4>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>
                        Organized sequentially for students
                      </span>
                    </div>

                    {courseLessons.length === 0 ? (
                      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#FFFFFF' }}>
                        <BookOpen size={36} style={{ color: 'var(--color-emerald)', margin: '0 auto 12px auto' }} />
                        <h4 style={{ fontSize: '1.1rem' }}>No lessons added to &ldquo;{selectedCat.name}&rdquo; yet</h4>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px', maxWidth: '440px', margin: '8px auto 20px auto' }}>
                          Start building this course by adding its first lesson with reading content, video masterclass, and practical reflection.
                        </p>
                        <button
                          onClick={() => {
                            setEditingArticleId(null);
                            setNewArticle({
                              title: '', slug: '', categoryId: selectedCat.id, introduction: '', content: '',
                              learningObjectives: '', practicalExercises: '', criticalThinkingQuestions: '',
                              reflectionActivity: '', readingTimeMinutes: 5, coverImageUrl: '', videoUrl: '', status: 'published',
                            });
                            setShowArticleModal(true);
                          }}
                          className="btn btn-emerald btn-sm"
                        >
                          <Plus size={15} /> <span>Add First Lesson</span>
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
                        {courseLessons.map((art, index) => (
                          <div 
                            key={art.id} 
                            className="card"
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              overflow: 'hidden',
                              borderRadius: '12px',
                              border: '1px solid rgba(20, 36, 56, 0.08)',
                              transition: 'transform 200ms ease, box-shadow 200ms ease'
                            }}
                          >
                            <div style={{ height: '140px', width: '100%', position: 'relative', backgroundColor: 'var(--color-bg-soft)', overflow: 'hidden' }}>
                              {art.cover_image_url ? (
                                <img src={art.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--color-emerald)', background: 'var(--color-success-soft)' }}>
                                  <BookOpen size={32} />
                                </div>
                              )}
                              <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                                <span className="badge badge-forest" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                                  Lesson {String(index + 1).padStart(2, '0')}
                                </span>
                              </div>
                              <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                                <span className={`badge ${art.status === 'published' ? 'badge-emerald' : 'badge-gold'}`} style={{ fontSize: '0.72rem' }}>
                                  {art.status}
                                </span>
                              </div>
                            </div>

                            <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <h4 style={{ fontSize: '1.05rem', color: 'var(--color-forest)', marginBottom: '8px', lineHeight: 1.4 }}>
                                {art.title}
                              </h4>
                              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>
                                {art.introduction ? art.introduction.slice(0, 110) + '...' : 'Interactive leadership lesson with practical applications.'}
                              </p>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-text-subtle)', marginBottom: '14px', borderTop: '1px solid var(--color-border-light)', paddingTop: '10px' }}>
                                <span>{art.reading_time_minutes} min read</span>
                                {art.video_url && <span style={{ color: 'var(--color-gold-hover)', fontWeight: 600 }}>✓ Video Masterclass</span>}
                              </div>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <Link href={`/explore/${art.slug}`} className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: '0.74rem' }}>
                                  Preview
                                </Link>
                                <button onClick={() => handleEditArticle(art)} className="btn btn-emerald btn-sm" style={{ padding: '4px 8px', fontSize: '0.74rem' }}>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleArticleStatus(art, art.status === 'published' ? 'draft' : 'published')}
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                                >
                                  {art.status === 'published' ? 'Draft' : 'Publish'}
                                </button>
                                <button 
                                  onClick={() => handleDeleteArticle(art)} 
                                  className="btn btn-outline btn-sm" 
                                  style={{ padding: '4px 8px', fontSize: '0.74rem', color: 'var(--color-danger)' }}
                                  title="Delete lesson"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })() : (
                /* ALL COURSES OVERVIEW */
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {courseCategories.map((course) => {
                      const count = articles.filter((a) => Number(a.category_id) === Number(course.id)).length;
                      return (
                        <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '14px', border: '1px solid rgba(20, 36, 56, 0.08)' }}>
                          <div style={{ height: '160px', width: '100%', position: 'relative', backgroundColor: '#142438' }}>
                            {course.cover_image_url ? (
                              <img src={course.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--color-gold)' }}>
                                <BookOpen size={40} />
                              </div>
                            )}
                            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                              <span className="badge badge-emerald">{count} {count === 1 ? 'lesson' : 'lessons'}</span>
                            </div>
                          </div>
                          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest)', marginBottom: '8px' }}>
                              {course.name}
                            </h3>
                            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '18px' }}>
                              {course.description || 'Practical youth leadership course curriculum and critical thinking exercises.'}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border-light)', paddingTop: '14px' }}>
                              <button
                                onClick={() => setSelectedCourseFilter(String(course.id))}
                                className="btn btn-emerald btn-sm"
                                style={{ flex: 1 }}
                              >
                                View Lessons ({count})
                              </button>
                              <button
                                onClick={() => {
                                  setEditingArticleId(null);
                                  setNewArticle({
                                    title: '', slug: '', categoryId: course.id, introduction: '', content: '',
                                    learningObjectives: '', practicalExercises: '', criticalThinkingQuestions: '',
                                    reflectionActivity: '', readingTimeMinutes: 5, coverImageUrl: '', videoUrl: '', status: 'published',
                                  });
                                  setShowArticleModal(true);
                                }}
                                className="btn btn-outline btn-sm"
                              >
                                + Lesson
                              </button>
                              <button onClick={() => handleOpenCategoryModal(course)} className="btn btn-outline btn-sm">
                                <Pencil size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <a href={res.file_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                              Open
                            </a>
                            <button 
                              onClick={() => handleEditResource(res)}
                              className="btn btn-sm btn-outline"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Edit resource details"
                            >
                              <Pencil size={12} /> Edit
                            </button>
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

          {/* ABOUT US & TEAM PROFILES TAB */}
          {activeTab === 'about_cms' && (
            <div>
              
              {/* SECTION 0: FOUNDER PORTRAIT & BIOGRAPHY */}
              <div className="card" style={{ marginBottom: '24px', padding: '24px', borderLeft: '4px solid var(--color-gold)', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <span className="badge badge-gold" style={{ marginBottom: '6px' }}>Organization Leadership</span>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest)', margin: 0 }}>
                      Founder &amp; Executive Director Portrait (Irakoze Sarah Divine)
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.86rem', marginTop: '4px' }}>
                      Change the hero founder photo displayed on the public About page (/about) through upload or URL.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-gold)', flexShrink: 0, backgroundColor: '#0f1e2f' }}>
                    <img src={founderImageUrl} alt="Founder preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <label className="btn btn-emerald btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        <Upload size={14} />
                        <span>Upload New Founder Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, (url) => handleSaveFounderImage(url));
                          }}
                        />
                      </label>
                      <button
                        onClick={() => {
                          const url = prompt('Enter new Founder photo URL or path:', founderImageUrl);
                          if (url && url.trim()) handleSaveFounderImage(url.trim());
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        Enter URL / Path
                      </button>
                      <a href="/about" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                        View on /about →
                      </a>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
                      Current path: <code>{founderImageUrl}</code> {savingFounderImage && '— Saving…'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: THE PEOPLE BEHIND EACH STEP */}
              <div className="card" style={{ marginBottom: '24px', padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>The people behind each step — Team Profiles</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                    Add, edit, or update team member photos, titles, and bios displayed on the public About page.
                  </p>
                </div>
                <button onClick={() => handleOpenTeamModal()} className="btn btn-emerald btn-sm">
                  <Plus size={16} /> <span>Add Team Member</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '22px', marginBottom: '40px' }}>
                {teamMembers.map((member) => (
                  <div key={member.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(20, 36, 56, 0.08)' }}>
                    <div style={{ height: '220px', width: '100%', position: 'relative', backgroundColor: '#0f1e2f', overflow: 'hidden' }}>
                      <img src={member.image_url || '/about/profile.png'} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
                        <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>{member.role}</span>
                      </div>
                    </div>
                    <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ fontSize: '1.15rem', color: 'var(--color-forest)', marginBottom: '8px' }}>{member.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>{member.bio}</p>
                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border-light)', paddingTop: '12px' }}>
                        <button onClick={() => handleOpenTeamModal(member)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                          <Pencil size={13} /> Edit
                        </button>
                        <button onClick={() => handleDeleteTeamMember(member)} className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)' }}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* SECTION 2: GOOD COMPANY, MEANINGFUL LEARNING & JOYFUL GROWTH */}
              <div className="card" style={{ marginBottom: '24px', padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Good company, meaningful learning, and joyful growth — Community Moments</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                    Publish memorable leadership moments, stories, photos, and messages from the student community.
                  </p>
                </div>
                <button onClick={() => handleOpenMomentModal()} className="btn btn-gold btn-sm">
                  <Plus size={16} /> <span>Add Community Moment</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
                {communityMoments.map((moment) => (
                  <div key={moment.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(20, 36, 56, 0.08)' }}>
                    <div style={{ height: '180px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                      <img src={moment.image_url || '/about/group-photo.jpg'} alt={moment.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--color-forest)', marginBottom: '8px' }}>{moment.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '14px' }}>{moment.description}</p>
                      {moment.author_quote && (
                        <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-success-soft)', borderRadius: '6px', fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--color-forest)', marginBottom: '14px' }}>
                          &ldquo;{moment.author_quote}&rdquo;
                          {moment.author_name && <div style={{ fontStyle: 'normal', fontWeight: 600, marginTop: '2px', fontSize: '0.76rem' }}>— {moment.author_name}</div>}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border-light)', paddingTop: '12px' }}>
                        <button onClick={() => handleOpenMomentModal(moment)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                          <Pencil size={13} /> Edit
                        </button>
                        <button onClick={() => handleDeleteMoment(moment)} className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)' }}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          
          {/* 8. STICKY NOTES & QUOTES WALL CMS TAB */}
          {activeTab === 'notes' && (
            <div>
              {/* SUB-TABS: COMMUNITY STICKY NOTES VS FEATURED LEADER HIGHLIGHTS */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
                <button
                  type="button"
                  onClick={() => setNotesSubTab('notes')}
                  className={`btn ${notesSubTab === 'notes' ? 'btn-emerald' : 'btn-outline'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Quote size={16} />
                  <span>Community Sticky Notes ({stickNotes.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNotesSubTab('leaders')}
                  className={`btn ${notesSubTab === 'leaders' ? 'btn-gold' : 'btn-outline'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Sparkles size={16} />
                  <span>Featured Leader Highlights &amp; Quotes ({leaderHighlights.length})</span>
                </button>
              </div>

              {notesSubTab === 'leaders' ? (
                /* LEADER HIGHLIGHTS SECTION */
                <div>
                  <div className="card" style={{ marginBottom: '24px', padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--color-forest)' }}>
                        Featured Transformational Leaders &amp; Wisdom Highlights
                      </h3>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
                        Manage the inspiring leaders, quotes, and milestone highlights shown on the public Community page.
                      </p>
                    </div>
                    <button onClick={() => handleOpenLeaderModal()} className="btn btn-gold btn-sm">
                      <Plus size={16} /> <span>Add Leader Highlight</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
                    {leaderHighlights.map((leader, index) => (
                      <div key={`${leader.id}-${index}`} className="card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '14px', border: '1px solid rgba(20, 36, 56, 0.08)', padding: '22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                          <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>{leader.badge || 'Featured Leader'}</span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)', textTransform: 'capitalize' }}>
                            {getLeaderMediaType(leader)} - Order: {leader.sort_order}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                          <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--color-gold)' }}>
                            <img src={leader.image_url || '/about/profile.png'} alt={leader.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '1.1rem', color: 'var(--color-forest)', margin: 0 }}>{leader.name}</h4>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', fontWeight: 600 }}>{leader.title}</div>
                          </div>
                        </div>

                        {getLeaderMediaType(leader) === 'message' && (
                          <div style={{ paddingLeft: '12px', borderLeft: '3px solid var(--color-gold)', marginBottom: '14px', flex: 1 }}>
                            <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--color-forest)', margin: 0, lineHeight: 1.5 }}>
                              &ldquo;{leader.quote}&rdquo;
                            </p>
                          </div>
                        )}

                        {getLeaderMediaType(leader) === 'message' && leader.highlight && (
                          <div style={{ padding: '10px 12px', backgroundColor: '#F4F8F6', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-text-main)', marginBottom: '14px' }}>
                            <strong>Impact:</strong> {leader.highlight}
                          </div>
                        )}

                        {getLeaderMediaType(leader) !== 'message' && (
                          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: '0 0 14px' }}>
                            This {getLeaderMediaType(leader)} highlight is shown in its matching community filter.
                          </p>
                        )}

                        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border-light)', paddingTop: '12px', marginTop: 'auto' }}>
                          <button onClick={() => handleOpenLeaderModal(leader)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                            <Pencil size={13} /> Edit
                          </button>
                          <button onClick={() => handleDeleteLeader(leader)} className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)' }}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* STICKY NOTES SECTION */
                <div>
              {/* HEADER BANNER */}
              <div className="card" style={{ marginBottom: '24px', padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--color-forest)' }}>
                    Community Sticky Notes, Quotes &amp; Media Moderation
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
                    Review, approve, publish, edit, or delete leadership quotes, speeches, reflections, and media shared across Rwanda.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={fetchStickNotes} className="btn btn-outline btn-sm">
                    <RefreshCw size={14} className={stickNotesLoading ? 'spin' : ''} />
                    <span>Refresh Wall</span>
                  </button>
                  <button onClick={() => setShowAddStickNoteModal(true)} className="btn btn-emerald btn-sm">
                    <Plus size={16} />
                    <span>Add Note / Quote</span>
                  </button>
                </div>
              </div>

              {/* FILTER PILLS */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                <button
                  onClick={() => setStickNoteFilter('all')}
                  className={`btn btn-sm ${stickNoteFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                >
                  All Notes ({stickNotes.length})
                </button>
                <button
                  onClick={() => setStickNoteFilter('published')}
                  className={`btn btn-sm ${stickNoteFilter === 'published' ? 'btn-emerald' : 'btn-outline'}`}
                >
                  Published on Wall ({stickNotes.filter((n) => n.visibility === 'published').length})
                </button>
                <button
                  onClick={() => setStickNoteFilter('pending')}
                  className={`btn btn-sm ${stickNoteFilter === 'pending' ? 'btn-gold' : 'btn-outline'}`}
                >
                  Pending Review ({stickNotes.filter((n) => n.visibility === 'pending').length})
                </button>
                <button
                  onClick={() => setStickNoteFilter('secret')}
                  className={`btn btn-sm ${stickNoteFilter === 'secret' ? 'btn-primary' : 'btn-outline'}`}
                >
                  Private / Suspended ({stickNotes.filter((n) => n.visibility === 'secret').length})
                </button>
              </div>

              {stickNotesLoading ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                  Loading community notes &amp; wall contributions…
                </div>
              ) : stickNotesError && stickNotes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
                  <p style={{ color: 'var(--color-danger)', marginBottom: '14px' }}>{stickNotesError}</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button onClick={fetchStickNotes} className="btn btn-outline btn-sm">
                      <RefreshCw size={14} /> Retry Loading Notes
                    </button>
                    <button onClick={() => setShowAddStickNoteModal(true)} className="btn btn-emerald btn-sm">
                      <Plus size={14} /> Add New Note
                    </button>
                  </div>
                </div>
              ) : stickNotes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
                  <Quote size={36} style={{ color: 'var(--color-gold)', margin: '0 auto 12px' }} />
                  <h4>No notes found</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                    Click &ldquo;Add Note / Quote&rdquo; to share leadership thoughts, advice, or resources on the community board.
                  </p>
                  <button onClick={() => setShowAddStickNoteModal(true)} className="btn btn-emerald btn-sm">
                    <Plus size={15} /> Add First Note
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
                  {stickNotes
                    .filter((n) => stickNoteFilter === 'all' || n.visibility === stickNoteFilter)
                    .map((note) => {
                      const isPublished = note.visibility === 'published';
                      const isPending = note.visibility === 'pending';
                      return (
                        <div
                          key={note.id}
                          className="card"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '12px',
                            borderLeft: `4px solid ${isPublished ? 'var(--color-emerald)' : isPending ? 'var(--color-gold)' : 'var(--color-danger)'}`,
                            backgroundColor: isPending ? '#FFFDF8' : '#FFFFFF',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span className="badge badge-gold" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {note.note_kind}
                            </span>
                            <span
                              className={`badge ${isPublished ? 'badge-emerald' : isPending ? 'badge-gold' : 'badge-forest'}`}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {note.visibility}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1.1rem', color: 'var(--color-forest)', marginBottom: '8px' }}>
                            {note.title}
                          </h4>

                          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: 1.6, flex: 1, whiteSpace: 'pre-wrap', marginBottom: '14px' }}>
                            {note.body}
                          </p>

                          {note.media_type === 'image' && note.media_url && (
                            <div style={{ marginBottom: '14px', borderRadius: '8px', overflow: 'hidden', maxHeight: '180px' }}>
                              <img src={note.media_url} alt={note.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}

                          {note.media_type === 'video' && note.media_url && (
                            <div style={{ marginBottom: '14px', fontSize: '0.82rem', padding: '8px 12px', background: '#F4F7F5', borderRadius: '6px' }}>
                              <a href={note.media_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-forest)', fontWeight: 600 }}>
                                <Video size={15} /> <span>Watch attached video</span> <ExternalLink size={12} />
                              </a>
                            </div>
                          )}

                          {note.media_type === 'pdf' && note.media_url && (
                            <div style={{ marginBottom: '14px', fontSize: '0.82rem', padding: '8px 12px', background: '#F4F7F5', borderRadius: '6px' }}>
                              <a href={note.media_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-forest)', fontWeight: 600 }}>
                                <FileText size={15} /> <span>Open shared PDF</span> <ExternalLink size={12} />
                              </a>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-subtle)', marginBottom: '14px', borderTop: '1px solid var(--color-border-light)', paddingTop: '10px' }}>
                            <div>
                              <strong>{note.full_name || 'Anonymous Leader'}</strong>
                              {note.school_name && <span> • {note.school_name}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-gold)' }}>
                              <Heart size={14} fill="currentColor" />
                              <span>{note.like_count || 0}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--color-border-light)', paddingTop: '12px' }}>
                            {isPublished ? (
                              <button
                                onClick={() => handleToggleStickNoteVisibility(note, 'secret')}
                                className="btn btn-outline btn-sm"
                                style={{ flex: 1, fontSize: '0.78rem' }}
                              >
                                Suspend / Hide
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStickNoteVisibility(note, 'published')}
                                className="btn btn-emerald btn-sm"
                                style={{ flex: 1, fontSize: '0.78rem' }}
                              >
                                Approve &amp; Publish
                              </button>
                            )}

                            <button onClick={() => handleOpenEditStickNote(note)} className="btn btn-outline btn-sm" style={{ padding: '6px 10px' }}>
                              <Pencil size={13} />
                            </button>

                            <button onClick={() => handleDeleteStickNote(note)} className="btn btn-outline btn-sm" style={{ padding: '6px 10px', color: 'var(--color-danger)' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
                </div>
              )}
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

      {/* ADD / EDIT RESOURCE MODAL */}
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
              <h3 style={{ fontSize: '1.25rem' }}>{editingResourceId ? 'Edit Educational Resource' : 'Add Educational Resource / Download'}</h3>
              <button onClick={() => { setShowResourceModal(false); setEditingResourceId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
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
                <button type="button" onClick={() => { setShowResourceModal(false); setEditingResourceId(null); }} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald">{editingResourceId ? 'Save Changes' : 'Publish Resource'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER ACCOUNT MODAL */}
      {showUserModal && editingUser && (
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
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-emerald" style={{ marginBottom: '4px' }}>User Account</span>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Edit User: {editingUser.full_name}</h3>
              </div>
              <button onClick={() => { setShowUserModal(false); setEditingUser(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={userForm.role}
                    disabled={editingUser.role === 'super_admin'}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Mentor</option>
                    <option value="event_manager">Event Manager</option>
                    <option value="content_editor">Content Editor</option>
                    <option value="admin">Administrator</option>
                    {editingUser.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select
                    className="form-select"
                    value={userForm.isActive ? 'active' : 'suspended'}
                    disabled={editingUser.role === 'super_admin'}
                    onChange={(e) => setUserForm({ ...userForm, isActive: e.target.value === 'active' })}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => { setShowUserModal(false); setEditingUser(null); }} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald">Save User Account</button>
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

              <StickTonePicker
                value={newStickNoteInput.tone}
                onChange={(tone) => setNewStickNoteInput((previous) => ({ ...previous, tone }))}
              />

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

              {/* LIVE COURSE LESSONS CONTEXT BOX */}
              {(() => {
                const catLessons = articles.filter((a) => Number(a.category_id) === Number(newArticle.categoryId));
                const catObj = categories.find((c) => Number(c.id) === Number(newArticle.categoryId));
                return (
                  <div style={{ backgroundColor: '#F8FAF9', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--color-border-light)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.86rem', color: 'var(--color-forest)' }}>
                        Course: {catObj?.name || 'Selected Track'} ({catLessons.length} {catLessons.length === 1 ? 'lesson' : 'lessons'} published)
                      </strong>
                      <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                        {editingArticleId ? 'Editing Lesson' : `Adding Step #${catLessons.length + 1}`}
                      </span>
                    </div>
                    {catLessons.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', margin: 0 }}>
                        No lessons in this course yet. This article will be the first step for students.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {catLessons.map((l, i) => (
                          <span key={l.id} style={{ fontSize: '0.76rem', backgroundColor: '#FFFFFF', padding: '3px 8px', borderRadius: '4px', border: '1px solid #dbe2de', color: 'var(--color-text-main)' }}>
                            {i + 1}. {l.title.slice(0, 32)}…
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

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

              <StickTonePicker
                value={stickNoteForm.tone}
                onChange={(tone) => setStickNoteForm((previous) => ({ ...previous, tone }))}
              />

              <div className="form-group">
                <label className="form-label">Reading time (minutes)</label>
                <input type="number" min="1" className="form-input" value={newArticle.readingTimeMinutes} onChange={(e) => setNewArticle({ ...newArticle, readingTimeMinutes: Number(e.target.value) })} />
              </div>

              {/* LESSON COMPLETION TEST / KNOWLEDGE CHECK BUILDER */}
              <div style={{ backgroundColor: '#F8FAF9', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border-light)', marginTop: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <HelpCircle size={18} style={{ color: 'var(--color-emerald)' }} />
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--color-forest)', margin: 0 }}>
                    Lesson Completion Test &amp; Comprehension Check (Step Test)
                  </h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Students must answer this test question correctly to mark this lesson complete, record progression, and unlock course certificates.
                </p>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Test Question *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newArticle.quizQuestion || ''}
                    onChange={(e) => setNewArticle({ ...newArticle, quizQuestion: e.target.value })}
                    placeholder="e.g. What is the fundamental foundation of self-leadership taught in this lesson?"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                  <label className="form-label" style={{ marginBottom: '2px' }}>
                    4 Multiple Choice Options (Select radio for the Correct Answer) *
                  </label>
                  {[0, 1, 2, 3].map((optIdx) => (
                    <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: Number(newArticle.quizCorrectIndex) === optIdx ? 'var(--color-emerald)' : 'var(--color-text-subtle)' }}>
                        <input
                          type="radio"
                          name="quizCorrectIndex"
                          checked={Number(newArticle.quizCorrectIndex) === optIdx}
                          onChange={() => setNewArticle({ ...newArticle, quizCorrectIndex: optIdx })}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--color-emerald)', cursor: 'pointer' }}
                        />
                        Option {String.fromCharCode(65 + optIdx)}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={newArticle.quizOptions?.[optIdx] || ''}
                        onChange={(e) => {
                          const nextOpts = [...(newArticle.quizOptions || ['', '', '', ''])];
                          nextOpts[optIdx] = e.target.value;
                          setNewArticle({ ...newArticle, quizOptions: nextOpts });
                        }}
                        placeholder={`Answer text for Option ${String.fromCharCode(65 + optIdx)}${Number(newArticle.quizCorrectIndex) === optIdx ? ' (Marked as Correct Answer)' : ''}`}
                        style={{ flex: 1, fontSize: '0.88rem' }}
                      />
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Key Takeaway / Explanation shown upon completion</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={newArticle.quizExplanation || ''}
                    onChange={(e) => setNewArticle({ ...newArticle, quizExplanation: e.target.value })}
                    placeholder="Brief explanation confirming the core insight and encouraging the student..."
                  />
                </div>
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

      {/* ADD STICKY NOTE MODAL */}
      {showAddStickNoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Share Note, Quote or Resource on Community Wall</h3>
              <button onClick={() => setShowAddStickNoteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleCreateStickNote}>
              <div className="form-group">
                <label className="form-label">Author / Attributed Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newStickNoteInput.title}
                  onChange={(e) => setNewStickNoteInput({ ...newStickNoteInput, title: e.target.value })}
                  placeholder="e.g. Irakoze Sarah Divine or Youth Leader"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quote / Message Text *</label>
                <textarea
                  rows={4}
                  required
                  className="form-textarea"
                  value={newStickNoteInput.body}
                  onChange={(e) => setNewStickNoteInput({ ...newStickNoteInput, body: e.target.value })}
                  placeholder="Share inspiring leadership words, quotes, or practical reflections..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Kind</label>
                  <select
                    className="form-select"
                    value={newStickNoteInput.noteKind}
                    onChange={(e) => setNewStickNoteInput({ ...newStickNoteInput, noteKind: e.target.value })}
                  >
                    <option value="quote">Quote</option>
                    <option value="reflection">Reflection</option>
                    <option value="advice">Leadership Advice</option>
                    <option value="idea">Idea</option>
                    <option value="resource">Resource</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Media Type</label>
                  <select
                    className="form-select"
                    value={newStickNoteInput.mediaType}
                    onChange={(e) => setNewStickNoteInput({ ...newStickNoteInput, mediaType: e.target.value })}
                  >
                    <option value="none">None (Text Only)</option>
                    <option value="image">Image Attachment</option>
                    <option value="pdf">PDF Document Link</option>
                    <option value="video">Video Link</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Media URL (Image, PDF, or Video Link)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newStickNoteInput.mediaUrl}
                  onChange={(e) => setNewStickNoteInput({ ...newStickNoteInput, mediaUrl: e.target.value })}
                  placeholder="https://... or /about/photo.jpg or /resource.pdf"
                />

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', padding: '3px 8px', fontSize: '0.74rem' }}>
                    <Upload size={12} /> Upload File (Image / PDF)
                    <input
                      type="file"
                      accept="image/*,.pdf,video/mp4"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const isPdf = file.name.toLowerCase().endsWith('.pdf');
                          const isVid = file.name.toLowerCase().endsWith('.mp4');
                          handleFileUpload(file, (url) => setNewStickNoteInput((prev) => ({
                            ...prev,
                            mediaUrl: url,
                            mediaType: isPdf ? 'pdf' : isVid ? 'video' : 'image'
                          })));
                        }
                      }}
                    />
                  </label>
                </div>

              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowAddStickNoteModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald">Publish to Community Wall</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM MEMBER MODAL */}
      {showTeamModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{editingTeamMember ? 'Edit Team Profile' : 'Add Team Member'}</h3>
              <button onClick={() => setShowTeamModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveTeamMember}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="e.g. Irakoze Sarah Divine"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role / Job Title *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={teamForm.role}
                  onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                  placeholder="e.g. Founder &amp; Executive Director"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Profile Image URL (Local or Remote)</label>
                <input
                  type="text"
                  className="form-input"
                  value={teamForm.imageUrl}
                  onChange={(e) => setTeamForm({ ...teamForm, imageUrl: e.target.value })}
                  placeholder="/about/sarah-image.jpg or https://..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Bio / Contribution *</label>
                <textarea
                  rows={3}
                  required
                  className="form-textarea"
                  value={teamForm.bio}
                  onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })}
                  placeholder="Describe their leadership impact, role, and focus area..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Display Sort Order</label>
                <input
                  type="number"
                  className="form-input"
                  value={teamForm.sortOrder}
                  onChange={(e) => setTeamForm({ ...teamForm, sortOrder: Number(e.target.value) })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowTeamModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald">{editingTeamMember ? 'Save Changes' : 'Create Profile'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMMUNITY MOMENT MODAL */}
      {showMomentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{editingMoment ? 'Edit Community Moment' : 'Add Community Moment'}</h3>
              <button onClick={() => setShowMomentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveMoment}>
              <div className="form-group">
                <label className="form-label">Moment Title *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={momentForm.title}
                  onChange={(e) => setMomentForm({ ...momentForm, title: e.target.value })}
                  placeholder="e.g. Good Company, Meaningful Learning &amp; Joyful Growth"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Moment Photo URL (Local or Remote)</label>
                <input
                  type="text"
                  className="form-input"
                  value={momentForm.imageUrl}
                  onChange={(e) => setMomentForm({ ...momentForm, imageUrl: e.target.value })}
                  placeholder="/about/group-photo.jpg or https://..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Story *</label>
                <textarea
                  rows={3}
                  required
                  className="form-textarea"
                  value={momentForm.description}
                  onChange={(e) => setMomentForm({ ...momentForm, description: e.target.value })}
                  placeholder="Share what made this gathering or conference moment memorable..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Community Message / Quote (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={momentForm.authorQuote}
                    onChange={(e) => setMomentForm({ ...momentForm, authorQuote: e.target.value })}
                    placeholder="e.g. Strong teams grow through honest conversations."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Attributed To</label>
                  <input
                    type="text"
                    className="form-input"
                    value={momentForm.authorName}
                    onChange={(e) => setMomentForm({ ...momentForm, authorName: e.target.value })}
                    placeholder="e.g. Sarah or Kigali Youth Delegate"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowMomentModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald">{editingMoment ? 'Save Changes' : 'Publish Moment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* COURSE CATEGORY MODAL */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{editingCategoryId ? 'Edit Leadership Course / Track' : 'Create New Leadership Course / Track'}</h3>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className="form-group">
                <label className="form-label">Course / Category Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={categoryForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = editingCategoryId ? categoryForm.slug : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setCategoryForm({ ...categoryForm, name, slug: autoSlug });
                  }}
                  placeholder="e.g. Ethical Leadership &amp; Governance"
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL Slug *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="e.g. ethical-leadership-governance"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Overview / Description</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Describe what young leaders will master in this course track..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course Card Image</label>
                <p className="course-image-help">Choose a unique image for this course. Students will see it on the Learn page.</p>
                <div className="course-image-controls">
                  <input
                    type="text"
                    className="form-input"
                    value={categoryForm.coverImageUrl}
                    onChange={(e) => setCategoryForm({ ...categoryForm, coverImageUrl: e.target.value })}
                    placeholder="Paste an image URL or upload a different image"
                  />
                  <label className="btn btn-outline btn-sm course-image-upload">
                    <FileUp size={15} />
                    <span>Choose image</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        handleFileUpload(file, (url) => setCategoryForm((prev) => ({ ...prev, coverImageUrl: url })));
                      }}
                    />
                  </label>
                </div>
                {categoryForm.coverImageUrl && (
                  <div className="course-image-preview">
                    <img src={categoryForm.coverImageUrl} alt="Course card image preview" />
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setCategoryForm((prev) => ({ ...prev, coverImageUrl: '' }))}
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Video Introduction Link (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={categoryForm.videoUrl}
                  onChange={(e) => setCategoryForm({ ...categoryForm, videoUrl: e.target.value })}
                  placeholder="YouTube, Vimeo, or /meeting.mp4"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Icon Name</label>
                  <select
                    className="form-select"
                    value={categoryForm.iconName}
                    onChange={(e) => setCategoryForm({ ...categoryForm, iconName: e.target.value })}
                  >
                    <option value="BookOpen">BookOpen (Standard)</option>
                    <option value="Award">Award (Achievement)</option>
                    <option value="Users">Users (Team &amp; People)</option>
                    <option value="TrendingUp">TrendingUp (Growth)</option>
                    <option value="ShieldCheck">ShieldCheck (Integrity)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Publication Status</label>
                  <select
                    className="form-select"
                    value={categoryForm.status}
                    onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald">{editingCategoryId ? 'Save Changes' : 'Create Course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STICKY NOTE MODAL */}
      {showEditStickNoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Edit Sticky Note &amp; Contribution</h3>
              <button onClick={() => setShowEditStickNoteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveEditStickNote}>
              <div className="form-group">
                <label className="form-label">Author / Attributed Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={stickNoteForm.title}
                  onChange={(e) => setStickNoteForm({ ...stickNoteForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quote / Message Text *</label>
                <textarea
                  rows={4}
                  required
                  className="form-textarea"
                  value={stickNoteForm.body}
                  onChange={(e) => setStickNoteForm({ ...stickNoteForm, body: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Kind</label>
                  <select
                    className="form-select"
                    value={stickNoteForm.noteKind}
                    onChange={(e) => setStickNoteForm({ ...stickNoteForm, noteKind: e.target.value })}
                  >
                    <option value="quote">Quote</option>
                    <option value="reflection">Reflection</option>
                    <option value="advice">Leadership Advice</option>
                    <option value="idea">Idea</option>
                    <option value="speech">Speech Excerpt</option>
                    <option value="resource">Resource</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Media Type</label>
                  <select
                    className="form-select"
                    value={stickNoteForm.mediaType}
                    onChange={(e) => setStickNoteForm({ ...stickNoteForm, mediaType: e.target.value })}
                  >
                    <option value="none">None (Text Only)</option>
                    <option value="image">Image Attachment</option>
                    <option value="pdf">PDF Document Link</option>
                    <option value="video">Video Link</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Media URL (Image, PDF, or Video Link)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={stickNoteForm.mediaUrl}
                    onChange={(e) => setStickNoteForm({ ...stickNoteForm, mediaUrl: e.target.value })}
                    placeholder="https://... or /uploads/..."
                  />
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <FileUp size={15} />
                    <span>Upload</span>
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e.target.files[0], (url) => setStickNoteForm((prev) => ({ ...prev, mediaUrl: url, mediaType: prev.mediaType === 'none' ? 'image' : prev.mediaType })))}
                    />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Wall Visibility</label>
                <select
                  className="form-select"
                  value={stickNoteForm.visibility}
                  onChange={(e) => setStickNoteForm({ ...stickNoteForm, visibility: e.target.value })}
                >
                  <option value="published">Published on Community Wall</option>
                  <option value="pending">Pending Review</option>
                  <option value="secret">Private / Hidden</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowEditStickNoteModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEADER HIGHLIGHT MODAL */}
      {showLeaderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{editingLeader ? 'Edit Leader Highlight' : 'Add Transformational Leader Highlight'}</h3>
              <button onClick={() => setShowLeaderModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveLeader}>
              <div className="form-group">
                <label className="form-label">Leader Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={leaderForm.name}
                  onChange={(e) => setLeaderForm({ ...leaderForm, name: e.target.value })}
                  placeholder="e.g. Paul Kagame or Irakoze Sarah Divine"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Title / Organization / Role *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={leaderForm.title}
                  onChange={(e) => setLeaderForm({ ...leaderForm, title: e.target.value })}
                  placeholder="e.g. President of Rwanda or Youth Council Representative"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Highlight Type *</label>
                <select
                  className="form-input"
                  value={leaderForm.mediaType}
                  onChange={(e) => setLeaderForm({ ...leaderForm, mediaType: e.target.value, mediaUrl: '' })}
                >
                  <option value="message">Message</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                </select>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', marginTop: '4px', display: 'block' }}>
                  To post written words, choose Message and fill in the message below. To post a photo, choose Image and paste its URL or upload the image. Visitors will find each post under the matching filter on the Community page.
                </span>
              </div>

              {leaderForm.mediaType === 'message' && (
                <div className="form-group">
                  <label className="form-label">Message to Display on the Community Page *</label>
                  <textarea
                    rows={3}
                    required
                    className="form-textarea"
                    value={leaderForm.quote}
                    onChange={(e) => setLeaderForm({ ...leaderForm, quote: e.target.value })}
                    placeholder="Write the message to share with the community..."
                  />
                </div>
              )}

              {(leaderForm.mediaType === 'image' || leaderForm.mediaType === 'video' || leaderForm.mediaType === 'audio') && (
                <div className="form-group">
                  <label className="form-label">
                    {leaderForm.mediaType === 'image' ? 'Highlight Image *' : leaderForm.mediaType === 'video' ? 'Highlight Video *' : 'Highlight Audio *'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={leaderForm.mediaUrl}
                      onChange={(e) => setLeaderForm({ ...leaderForm, mediaUrl: e.target.value })}
                      placeholder={leaderForm.mediaType === 'video' ? 'YouTube URL or uploaded video' : 'Paste a media URL or upload a file'}
                    />
                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      <FileUp size={15} />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept={leaderForm.mediaType === 'image' ? 'image/*' : leaderForm.mediaType === 'video' ? 'video/*' : 'audio/*'}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e.target.files[0], (url) => setLeaderForm((prev) => ({ ...prev, mediaUrl: url })))}
                      />
                    </label>
                  </div>
                  {leaderForm.mediaType === 'video' && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', marginTop: '4px', display: 'block' }}>
                      Paste a YouTube link or upload a video file. Uploaded files are limited to 25 MB.
                    </span>
                  )}
                  {leaderForm.mediaType === 'image' && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', marginTop: '4px', display: 'block' }}>
                      Choose a photo file to upload, or paste its direct image URL. It will appear under Images on the Community page.
                    </span>
                  )}
                  {leaderForm.mediaType === 'audio' && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', marginTop: '4px', display: 'block' }}>
                      Supported audio formats include MP3, WAV, OGG, M4A, AAC, and FLAC. Uploads are limited to 25 MB.
                    </span>
                  )}
                </div>
              )}

              {leaderForm.mediaType === 'message' && (
                <div className="form-group">
                  <label className="form-label">Key Leadership Impact / Highlight Summary</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={leaderForm.highlight}
                    onChange={(e) => setLeaderForm({ ...leaderForm, highlight: e.target.value })}
                    placeholder="Add context or summarize the message..."
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Highlight Badge</label>
                  <input
                    type="text"
                    className="form-input"
                    value={leaderForm.badge}
                    onChange={(e) => setLeaderForm({ ...leaderForm, badge: e.target.value })}
                    placeholder="e.g. National Visionary"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    value={leaderForm.category}
                    onChange={(e) => setLeaderForm({ ...leaderForm, category: e.target.value })}
                    placeholder="e.g. Vision & Governance"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowLeaderModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-gold">{editingLeader ? 'Save Changes' : 'Publish Leader Highlight'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
