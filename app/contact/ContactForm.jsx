'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit contact message');
      }

      setStatus({
        type: 'success',
        message: 'Your inquiry has been received. Our leadership coordination team in Rwamagana will reply shortly.',
      });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '36px' }}>
      <h3 style={{ fontSize: '1.35rem', marginBottom: '8px', color: 'var(--color-forest)' }}>
        Send Us a Message
      </h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
        Inquire about inter-school conference invitations, student council mentorship, or partnership opportunities.
      </p>

      {status.message && (
        <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{status.message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Your Full Name *</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. Jean Mugisha"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. j.mugisha@school.rw"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Phone Number (Optional)</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="form-input"
            placeholder="+250 788 000 000"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Subject / Topic *</label>
          <input
            type="text"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. School Partnership Inquiry"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Message *</label>
        <textarea
          name="message"
          rows={5}
          required
          value={formData.message}
          onChange={handleChange}
          className="form-textarea"
          placeholder="Please describe your school, student council, or inquiry in detail..."
        />
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
        <Send size={18} />
        <span>{loading ? 'Sending Message...' : 'Send Message to INTAMBWE'}</span>
      </button>
    </form>
  );
}
