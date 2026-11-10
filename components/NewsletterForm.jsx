'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus({ type: 'success', message: 'Subscribed successfully!' });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input 
          type="email" 
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter school or student email" 
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: 'white',
            fontSize: '0.85rem',
            flex: 1
          }}
        />
        <button type="submit" disabled={loading} className="btn btn-gold btn-sm" style={{ padding: '8px 14px' }}>
          {loading ? '...' : <ArrowRight size={15} />}
        </button>
      </div>
      {status.message && (
        <div style={{
          marginTop: '6px',
          fontSize: '0.75rem',
          color: status.type === 'success' ? 'var(--color-gold)' : '#ff8b8b'
        }}>
          {status.message}
        </div>
      )}
    </form>
  );
}
