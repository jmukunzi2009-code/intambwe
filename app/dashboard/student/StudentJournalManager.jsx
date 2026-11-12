'use client';

import React, { useState } from 'react';
import { BookMarked, Plus, Send, CheckCircle2, Clock, LockKeyhole, Sparkles } from 'lucide-react';

const NOTE_SHAPES = ['journal-paper-square', 'journal-paper-fold', 'journal-paper-round', 'journal-paper-ticket'];

export default function StudentJournalManager({ initialJournals = [] }) {
  const [journals, setJournals] = useState(initialJournals);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    lessonReflected: '',
    reflectionContent: '',
    actionCommitment: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.reflectionContent.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save reflection');

      setJournals([data.journal, ...journals]);
      setFormData({ title: '', lessonReflected: '', reflectionContent: '', actionCommitment: '' });
      setIsAdding(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="journal-studio">
      <div className="journal-studio-head">
        <div>
          <span className="badge badge-gold journal-private-badge"><LockKeyhole size={13} /> Only you can see these</span>
          <h3>
            Your reflection notes
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            A quiet space to capture what you are learning. Your personal reflections are private and never appear on the public community wall.
          </p>
        </div>

        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="btn btn-emerald btn-sm journal-add-button"
        >
          {isAdding ? 'Cancel' : <><Plus size={16} /> Add a note</>}
        </button>
      </div>

      {/* NEW ENTRY FORM */}
      {isAdding && (
        <form onSubmit={handleCreate} className="card journal-compose">
          <div className="journal-compose-title">
            <span className="journal-compose-icon"><Sparkles size={18} /></span>
            <div>
              <h4>Pin down a thought</h4>
              <p>This note is saved to your private journal.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Entry Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Overcoming Fear of Public Speaking"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lesson or Event Reflected On</label>
              <input
                type="text"
                name="lessonReflected"
                value={formData.lessonReflected}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Self-Leadership Workshop or Class Debate"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reflection Content *</label>
            <textarea
              name="reflectionContent"
              rows={4}
              required
              value={formData.reflectionContent}
              onChange={handleChange}
              className="form-textarea"
              placeholder="What did you learn about your character, challenges, or ethical decisions?"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Action Commitment (What will you do differently?)</label>
            <input
              type="text"
              name="actionCommitment"
              value={formData.actionCommitment}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. I will actively listen to contrasting opinions before responding."
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            <Send size={16} />
            <span>{loading ? 'Saving...' : 'Save Entry to Journal'}</span>
          </button>
        </form>
      )}

      {/* ENTRIES LIST */}
      {journals.length === 0 ? (
        <div className="journal-empty">
          <BookMarked size={34} />
          <h4>Your journal is ready for its first note</h4>
          <p>Save a thought from a lesson, a moment you are proud of, or one small action you want to take.</p>
          <button onClick={() => setIsAdding(true)} className="btn btn-outline btn-sm">
            Write a private reflection
          </button>
        </div>
      ) : (
        <div className="journal-note-wall">
          {journals.map((j, index) => (
            <article
              key={j.id}
              className={`journal-note ${NOTE_SHAPES[index % NOTE_SHAPES.length]}`}
              style={{ '--note-delay': `${Math.min(index, 8) * 55}ms` }}
            >
              <div className="journal-note-topline">
                <span className="journal-note-label"><LockKeyhole size={12} /> Private note</span>
                <div className="journal-note-date">
                  <Clock size={13} />
                  <span>{new Date(j.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <h4>
                  {j.title}
              </h4>

              {j.lesson_reflected && (
                <div className="journal-note-lesson">
                  Lesson: {j.lesson_reflected}
                </div>
              )}

              <p className="journal-note-body">
                {j.reflection_content}
              </p>

              {j.action_commitment && (
                <div className="journal-note-commitment">
                  <CheckCircle2 size={16} />
                  <span><strong>Commitment:</strong> {j.action_commitment}</span>
                </div>
              )}
              <span className="journal-note-tape" aria-hidden="true" />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
