'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

export default function RegisterConferenceButton({ meetingId, isAlreadyRegistered, isLoggedIn, status }) {
  const [registered, setRegistered] = useState(isAlreadyRegistered);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isLoggedIn) {
    return (
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#F3F6F4',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)'
      }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '8px' }}>
          Reserve Your Participant Seat
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
          Please sign in to register for this conference and receive your official attendee accreditation.
        </p>
        <Link href={`/login?redirect=/conferences/${meetingId}`} className="btn btn-emerald btn-sm" style={{ width: '100%' }}>
          Sign In to Register
        </Link>
      </div>
    );
  }

  if (registered) {
    return (
      <div style={{
        padding: '16px 20px',
        backgroundColor: 'var(--color-success-soft)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(22, 122, 80, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <CheckCircle2 size={24} style={{ color: 'var(--color-emerald)' }} />
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-emerald)', fontSize: '0.95rem' }}>
            You are Registered!
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-forest)' }}>
            Your delegate seat is confirmed. Your accreditation is linked to your student profile.
          </div>
        </div>
      </div>
    );
  }

  if (status === 'completed' || status === 'registration_closed' || status === 'cancelled') {
    return (
      <div className="alert alert-info">
        Registration is currently closed for this summit.
      </div>
    );
  }

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/meetings/${meetingId}/register`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete registration');
      }

      setRegistered(true);
      setSuccessMsg(data.message || 'Registration confirmed!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="alert alert-danger" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>{error}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>{successMsg}</div>}

      <button 
        onClick={handleRegister} 
        disabled={loading}
        className="btn btn-gold btn-lg"
        style={{ width: '100%' }}
      >
        <UserCheck size={18} />
        <span>{loading ? 'Confirming Seat...' : 'Register for this Conference'}</span>
      </button>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', textAlign: 'center', marginTop: '8px' }}>
        Free registration for enrolled Rwandan students
      </div>
    </div>
  );
}
