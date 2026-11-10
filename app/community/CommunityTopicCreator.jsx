'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Plus, Send, CheckCircle2 } from 'lucide-react';

export default function CommunityTopicCreator({ isLoggedIn }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isLoggedIn) {
    return (
      <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F8FAF9', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', marginBottom: '24px' }}>
        <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          Have a leadership question or school initiative to share?{' '}
        </span>
        <Link href="/login?redirect=/community" style={{ color: 'var(--color-emerald)', fontWeight: 600, fontSize: '0.88rem' }}>
          Sign in to start a student dialogue
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post dialogue topic');

      setSuccess(true);
      setTitle('');
      setContent('');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '28px' }}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="btn btn-emerald btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          <span>Start a Student Dialogue</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="card" style={{ backgroundColor: '#F9FCFA', border: '1.5px solid var(--color-emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--color-forest)' }}>
              Propose a Dialogue Topic
            </h4>
            <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
          </div>

          {error && <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>{error}</div>}
          {success && (
            <div className="alert alert-success" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>Topic posted successfully! Refreshing...</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Dialogue Question or Topic Title *</label>
            <input
              type="text"
              required
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How can student councils encourage girls to run for leadership roles?"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Context / Reflection Question *</label>
            <textarea
              rows={3}
              required
              className="form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide context or a specific challenge your school faced..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-emerald btn-sm">
              <Send size={15} />
              <span>{loading ? 'Posting...' : 'Post Dialogue'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
