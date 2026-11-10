'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, Award, Plus } from 'lucide-react';

export default function StudentChallengeSubmit({ activeChallenges = [] }) {
  const [selectedChallenge, setSelectedChallenge] = useState(activeChallenges[0]?.id || '');
  const [submissionText, setSubmissionText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (activeChallenges.length === 0) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionText.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: selectedChallenge,
          submissionText: submissionText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit solution');

      setSuccess(true);
      setSubmissionText('');
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '16px' }}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="btn btn-emerald btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          <span>Submit Proposal for Active Challenge</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ padding: '20px', backgroundColor: '#F9FCFA', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={18} style={{ color: 'var(--color-gold)' }} />
              <span>Submit Community Action Proposal</span>
            </h4>
            <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
          </div>

          {error && <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>{error}</div>}
          {success && (
            <div className="alert alert-success" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>Your proposal has been submitted to INTAMBWE mentors for review!</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Select Challenge *</label>
            <select 
              className="form-select"
              value={selectedChallenge}
              onChange={(e) => setSelectedChallenge(Number(e.target.value))}
            >
              {activeChallenges.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Your Solution Proposal (minimum 300 words recommended) *</label>
            <textarea
              rows={4}
              required
              className="form-textarea"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Outline: 1. Specific Problem, 2. Your 3-step action plan, 3. Expected impact on peers/community..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-gold btn-sm">
              <Send size={15} />
              <span>{loading ? 'Submitting...' : 'Send Proposal to Mentors'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
