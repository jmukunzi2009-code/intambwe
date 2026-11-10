'use client';

import React, { useState } from 'react';
import { CheckCircle2, CheckCircle } from 'lucide-react';

export default function MarkCompletedButton({ articleId, initialCompleted = false, isLoggedIn = false }) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isLoggedIn) {
    return null;
  }

  const handleToggle = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update lesson progress.');
      setCompleted(data.isCompleted);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to update lesson progress.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`btn btn-sm ${completed ? 'btn-emerald' : 'btn-outline'}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <CheckCircle2 size={16} />
        <span>
          {loading ? 'Updating...' : completed ? 'Lesson Completed ✓' : 'Mark as Completed'}
        </span>
      </button>
      {error && <p role="alert" style={{ color: 'var(--color-danger)', fontSize: '0.78rem', marginTop: '5px' }}>{error}</p>}
    </div>
  );
}
