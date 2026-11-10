'use client';

import React, { useState } from 'react';
import { BookMarked, Plus, Trash2, Send, CheckCircle2, Clock } from 'lucide-react';

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest)', marginBottom: '4px' }}>
            Private Leadership Journal
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Document your inner growth, reflections on integrity, and weekly action commitments.
          </p>
        </div>

        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="btn btn-emerald btn-sm"
        >
          {isAdding ? 'Cancel' : <><Plus size={16} /> New Entry</>}
        </button>
      </div>

      {/* NEW ENTRY FORM */}
      {isAdding && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '24px', backgroundColor: '#F9FCFA', border: '1.5px solid var(--color-emerald)' }}>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '14px', color: 'var(--color-forest)' }}>
            Record a Personal Reflection
          </h4>

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
        <div className="card" style={{ textAlign: 'center', padding: '36px', backgroundColor: '#FAFBFA' }}>
          <BookMarked size={36} style={{ color: 'var(--color-text-subtle)', marginBottom: '12px' }} />
          <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Your journal is currently empty</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Reflections written after studying leadership lessons or attending summits will appear here.
          </p>
          <button onClick={() => setIsAdding(true)} className="btn btn-outline btn-sm">
            Write First Reflection
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {journals.map((j) => (
            <div key={j.id} className="card" style={{ borderLeft: '3px solid var(--color-emerald)', padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--color-forest)' }}>
                  {j.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
                  <Clock size={13} />
                  <span>{new Date(j.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {j.lesson_reflected && (
                <div style={{ fontSize: '0.82rem', color: 'var(--color-emerald)', fontWeight: 600, marginBottom: '10px' }}>
                  Lesson: {j.lesson_reflected}
                </div>
              )}

              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-main)', lineHeight: 1.6, marginBottom: '14px', whiteSpace: 'pre-line' }}>
                {j.reflection_content}
              </p>

              {j.action_commitment && (
                <div style={{ backgroundColor: 'var(--color-gold-soft)', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--color-gold-hover)' }} />
                  <span><strong>Commitment:</strong> {j.action_commitment}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
