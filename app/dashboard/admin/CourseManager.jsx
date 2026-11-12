'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Eye, Pencil, Plus, Trash2, Users, Video, CheckCircle2, AlertCircle } from 'lucide-react';

const EMPTY_COURSE = {
  name: '',
  slug: '',
  description: '',
  coverImageUrl: '',
  videoUrl: '',
  status: 'published',
};

function toSlug(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CourseManager({
  courses,
  articles,
  onCourseSaved,
  onCourseDeleted,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onToggleLessonStatus
}) {
  const [editingCourse, setEditingCourse] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [openCourseId, setOpenCourseId] = useState(null);
  const [rosters, setRosters] = useState({});
  const [loadingRosterId, setLoadingRosterId] = useState(null);
  const [rosterErrors, setRosterErrors] = useState({});

  const openForm = (course = null) => {
    setEditingCourse(course);
    setFormOpen(true);
    setForm(course ? {
      name: course.name,
      slug: course.slug,
      description: course.description || '',
      coverImageUrl: course.cover_image_url || '',
      videoUrl: course.video_url || '',
      status: course.status || 'published',
    } : EMPTY_COURSE);
    setError('');
  };

  const saveCourse = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(editingCourse ? `/api/courses/${editingCourse.id}` : '/api/courses', {
        method: editingCourse ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save this course.');
      if (onCourseSaved) onCourseSaved(data.course);
      setFormOpen(false);
      setEditingCourse(null);
      setForm(EMPTY_COURSE);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCourseStatus = async (course) => {
    const nextStatus = course.status === 'published' ? 'archived' : 'published';
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update course status.');
      if (onCourseSaved) onCourseSaved({ ...course, status: nextStatus });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!confirm(`Are you sure you want to delete "${course.name}"? This will unlink its lessons.`)) return;
    try {
      const res = await fetch(`/api/courses/${course.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete course.');
      if (onCourseDeleted) onCourseDeleted(course.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleRoster = async (courseId) => {
    if (openCourseId === courseId) {
      setOpenCourseId(null);
      return;
    }
    setOpenCourseId(courseId);
    if (rosters[courseId]) return;

    setLoadingRosterId(courseId);
    setRosterErrors((current) => ({ ...current, [courseId]: '' }));
    try {
      const response = await fetch(`/api/learning/lesson?categoryId=${courseId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load enrolled students.');
      setRosters((current) => ({ ...current, [courseId]: data.learners || [] }));
    } catch (requestError) {
      setRosterErrors((current) => ({ ...current, [courseId]: requestError.message }));
    } finally {
      setLoadingRosterId(null);
    }
  };

  return (
    <section className="course-manager">
      <header className="course-manager-intro card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <span className="badge badge-gold">Structured Curriculum</span>
          <h3 style={{ fontSize: '1.3rem', margin: '6px 0 4px 0' }}>Leadership Courses & Modular Units</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Build courses incrementally. Add lessons with text, images, videos, and reflection prompts. Students learn step-by-step and earn verifiable certificates.
          </p>
        </div>
        <button type="button" className="btn btn-emerald" onClick={() => openForm()}>
          <Plus size={17} /> Add New Course
        </button>
      </header>

      {courses.length === 0 ? (
        <div className="card course-manager-empty" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <BookOpen size={36} style={{ color: 'var(--color-emerald)', marginBottom: '12px' }} />
          <h3>Your Course Library Starts Here</h3>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', margin: '8px auto 20px auto' }}>
            Add a course title, description, cover image, and introductory video, then build it unit by unit.
          </p>
          <button type="button" className="btn btn-emerald" onClick={() => openForm()}>
            <Plus size={16} /> Create First Course
          </button>
        </div>
      ) : (
        <div className="course-manager-grid">
          {courses.map((course) => {
            const lessons = articles
              .filter((article) => Number(article.category_id) === Number(course.id))
              .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(a.id) - Number(b.id));
            const roster = rosters[course.id] || [];

            return (
              <article className="course-admin-card card" key={course.id} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {course.cover_image_url ? (
                  <img className="course-admin-cover" src={course.cover_image_url} alt="" style={{ height: '160px', width: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="course-admin-cover course-admin-cover-empty" style={{ height: '160px', width: '100%', backgroundColor: 'var(--color-bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={36} style={{ color: 'var(--color-emerald)', opacity: 0.5 }} />
                  </div>
                )}
                <div className="course-admin-card-body" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="course-admin-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <span className={`badge ${course.status === 'published' ? 'badge-emerald' : 'badge-gold'}`} style={{ marginBottom: '6px' }}>
                        {course.status}
                      </span>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest)' }}>{course.name}</h3>
                    </div>
                    <span className="course-admin-count badge badge-forest" style={{ fontSize: '0.78rem' }}>
                      {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                    </span>
                  </div>

                  <p className="course-admin-description" style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                    {course.description || 'Add a short description to help learners understand what this course covers.'}
                  </p>

                  {course.video_url && (
                    <a className="course-admin-video" href={course.video_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-emerald)', fontWeight: 600, marginBottom: '14px' }}>
                      <Video size={15} /> Watch Course Video
                    </a>
                  )}

                  {/* COURSE ACTION TOOLBAR */}
                  <div className="course-admin-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border-light)' }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => openForm(course)}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button type="button" className="btn btn-emerald btn-sm" onClick={() => onAddLesson(course)}>
                      <Plus size={14} /> Add Lesson
                    </button>
                    <Link href={`/courses/${course.id}`} className="btn btn-outline btn-sm">
                      <Eye size={14} /> Preview
                    </Link>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => toggleRoster(course.id)}>
                      <Users size={14} /> {openCourseId === course.id ? 'Hide Students' : `Students (${course.student_count || 0})`}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleToggleCourseStatus(course)}
                    >
                      {course.status === 'published' ? 'Suspend' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--color-danger)' }}
                      onClick={() => handleDeleteCourse(course)}
                      title="Delete course"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>

                  {/* LESSONS LIST */}
                  <div className="course-admin-lessons" style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '0.92rem', color: 'var(--color-forest)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                      Lessons in Order ({lessons.length})
                    </h4>
                    {lessons.length === 0 ? (
                      <p className="course-admin-empty-lessons" style={{ fontSize: '0.84rem', color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                        No lessons yet. Click &quot;Add Lesson&quot; above to create the first topic.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {lessons.map((lesson, index) => (
                          <div
                            className="course-admin-lesson"
                            key={lesson.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              padding: '10px 12px',
                              backgroundColor: '#F8FAF9',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border-light)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                              <span style={{ fontWeight: 800, color: 'var(--color-emerald)', fontSize: '0.85rem', width: '22px' }}>
                                #{index + 1}
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-forest)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {lesson.title}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', display: 'flex', gap: '6px' }}>
                                  <span className={`badge ${lesson.status === 'published' ? 'badge-emerald' : 'badge-gold'}`} style={{ padding: '1px 6px', fontSize: '0.68rem' }}>
                                    {lesson.status}
                                  </span>
                                  <span>{lesson.reading_time_minutes || 5} min read</span>
                                  {lesson.video_url && <span>· Video</span>}
                                  {lesson.cover_image_url && <span>· Image</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                onClick={() => onEditLesson(lesson)}
                              >
                                Edit
                              </button>
                              {onToggleLessonStatus && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                  onClick={() => onToggleLessonStatus(lesson)}
                                >
                                  {lesson.status === 'published' ? 'Suspend' : 'Publish'}
                                </button>
                              )}
                              {onDeleteLesson && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '3px 8px', fontSize: '0.72rem', color: 'var(--color-danger)' }}
                                  onClick={() => onDeleteLesson(lesson)}
                                  title="Delete lesson"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* STUDENT ROSTER / ENROLLMENT ACCORDION */}
                  {openCourseId === course.id && (
                    <div className="course-admin-roster" style={{ marginTop: '18px', padding: '14px', backgroundColor: '#F3F6F4', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ fontSize: '0.92rem', marginBottom: '8px', color: 'var(--color-forest)' }}>
                        Students Enrolled in this Course
                      </h4>
                      {loadingRosterId === course.id ? (
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>Loading enrolled students…</p>
                      ) : rosterErrors[course.id] ? (
                        <p className="alert alert-danger" role="alert" style={{ fontSize: '0.82rem' }}>{rosterErrors[course.id]}</p>
                      ) : roster.length === 0 ? (
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>No students have enrolled in this course yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {roster.map((learner) => (
                            <div
                              key={learner.user_id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 10px',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '4px',
                                fontSize: '0.82rem'
                              }}
                            >
                              <div>
                                <strong>{learner.full_name}</strong>
                                <span style={{ color: 'var(--color-text-subtle)', marginLeft: '6px' }}>
                                  ({learner.school_name || learner.email})
                                </span>
                              </div>
                              <span className="badge badge-emerald">
                                {learner.completed_lessons}/{learner.total_lessons} lessons completed
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT COURSE MODAL */}
      {formOpen && (
        <div
          className="course-admin-modal-backdrop"
          style={{
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
          }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}
        >
          <section
            className="course-admin-modal card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-admin-modal-title"
            style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 id="course-admin-modal-title" style={{ fontSize: '1.3rem' }}>
                {editingCourse ? 'Edit Course Details' : 'Create New Leadership Course'}
              </h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '18px' }}>
              Courses represent major curriculum tracks (e.g. Ethical Leadership, Communication &amp; Debate, Community Action).
            </p>
            <form onSubmit={saveCourse}>
              <div className="form-group">
                <label className="form-label">Course Name</label>
                <input
                  className="form-input"
                  required
                  minLength={2}
                  maxLength={150}
                  value={form.name}
                  placeholder="e.g. Self-Leadership & Character"
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: editingCourse ? current.slug : toSlug(event.target.value)
                  }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL Slug</label>
                <input
                  className="form-input"
                  required
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: toSlug(event.target.value) }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course Description</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={form.description}
                  placeholder="What will students learn in this course? What skills will they build?"
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cover Image URL or Public Path</label>
                <input
                  className="form-input"
                  value={form.coverImageUrl}
                  onChange={(event) => setForm((current) => ({ ...current, coverImageUrl: event.target.value }))}
                  placeholder="https://... or /images/course.jpg or data:image/..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course Introduction Video (Optional)</label>
                <input
                  className="form-input"
                  value={form.videoUrl}
                  onChange={(event) => setForm((current) => ({ ...current, videoUrl: event.target.value }))}
                  placeholder="YouTube URL, Vimeo URL, or local /video.mp4"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course Publication Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="published">Published — Active and open for student enrollment</option>
                  <option value="draft">Draft — Visible only to staff and mentors</option>
                  <option value="archived">Archived / Suspended — Hidden from new enrollments</option>
                </select>
              </div>

              {error && <p className="alert alert-danger" role="alert">{error}</p>}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-emerald" disabled={saving}>
                  {saving ? 'Saving…' : editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
