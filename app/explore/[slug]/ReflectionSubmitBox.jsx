'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, Lock } from 'lucide-react';

export default function ReflectionSubmitBox({ articleTitle, isLoggedIn }) {
  const [reflection, setReflection] = useState('');
  const [actionCommitment, setActionCommitment] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (!isLoggedIn) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#F3F6F4',
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
        border: '1px dashed var(--color-border)'
      }}>
        <Lock size={24} style={{ color: 'var(--color-emerald)', marginBottom: '8px' }} />
        <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Want to save this reflection to your Leadership Journal?</h4>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          Sign in or create a student account to maintain your private leadership journal and track your growth over time.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <Link href="/login" className="btn btn-outline btn-sm">Sign In</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Create Account</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reflection.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Reflection on: ${articleTitle}`,
          lessonReflected: articleTitle,
          reflectionContent: reflection,
          actionCommitment: actionCommitment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save reflection');
      }

      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CheckCircle2 size={22} />
        <div>
          <strong>Reflection Saved!</strong> Your response has been securely saved into your Leadership Journal. You can review it anytime in your Student Dashboard.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        <label className="form-label">Your Personal Reflection:</label>
        <textarea
          rows={4}
          className="form-textarea"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="How does this lesson challenge or guide your current actions at school or in your community?"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">One Action Commitment (Optional):</label>
        <input
          type="text"
          className="form-input"
          value={actionCommitment}
          onChange={(e) => setActionCommitment(e.target.value)}
          placeholder="e.g. I will hold an open dialogue session with my class council this Friday."
        />
      </div>

      <button type="submit" disabled={loading} className="btn btn-emerald">
        <Send size={16} />
        <span>{loading ? 'Saving to Journal...' : 'Save to Private Journal'}</span>
      </button>
    </form>
  );
}
