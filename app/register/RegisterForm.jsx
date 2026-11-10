'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    school: '',
    classLevel: '',
    country: 'Rwanda',
    preferredLanguage: 'English',
    phone: '',
    agreeTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!formData.agreeTerms) {
      setError('You must agree to the INTAMBWE code of conduct & privacy agreement.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete registration');
      }

      router.push('/dashboard/student');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '36px' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <Image src="/intambwe-emblem.png" alt="INTAMBWE" width={58} height={62} className="brand-emblem auth-emblem" />
        <h2 style={{ fontSize: '1.6rem', color: 'var(--color-forest)', marginBottom: '6px' }}>
          Join INTAMBWE
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          Create your free student account to participate in conferences, access leadership resources, and track your growth.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Full Name & Email */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. Divine Keza"
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
            placeholder="e.g. divine@gmail.com"
          />
        </div>
      </div>

      {/* School & Class Level */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">School / Secondary Institution *</label>
          <input
            type="text"
            name="school"
            required
            value={formData.school}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. Lycée de Kigali or FAWE Girls School"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Class / Education Level *</label>
          <input
            type="text"
            name="classLevel"
            required
            value={formData.classLevel}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. Senior 4, Senior 5, Senior 6"
          />
        </div>
      </div>

      {/* Country, Language & Phone */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Country</label>
          <select name="country" value={formData.country} onChange={handleChange} className="form-select">
            <option value="Rwanda">Rwanda</option>
            <option value="Uganda">Uganda</option>
            <option value="Kenya">Kenya</option>
            <option value="Tanzania">Tanzania</option>
            <option value="Burundi">Burundi</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Preferred Language</label>
          <select name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange} className="form-select">
            <option value="English">English</option>
            <option value="Kinyarwanda">Kinyarwanda</option>
            <option value="French">French</option>
          </select>
        </div>

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
      </div>

      {/* Passwords */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Password (min 8 chars) *</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            placeholder="Create a strong password"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Password *</label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={8}
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-input"
            placeholder="Confirm password"
          />
        </div>
      </div>

      {/* Terms & Privacy */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: 'var(--color-charcoal)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleChange}
            style={{ marginTop: '3px' }}
            required
          />
          <span>
            I agree to the INTAMBWE Code of Conduct, Student Protection Guidelines, and Privacy Terms.
          </span>
        </label>
      </div>

      <button type="submit" disabled={loading} className="btn btn-gold btn-lg" style={{ width: '100%' }}>
        <span>{loading ? 'Creating Account...' : 'Complete Student Registration'}</span>
        <ArrowRight size={18} />
      </button>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>
          Sign In Here
        </Link>
      </div>
    </form>
  );
}
