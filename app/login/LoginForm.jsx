'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      const destination = redirectParam || data.redirectTo || '/dashboard/student';
      router.push(destination);
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
          Welcome Back to INTAMBWE
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          Sign in to access your leadership lessons, journal, and conference passes.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Email Address</label>
        <div style={{ position: 'relative' }}>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. name@student.rw or staff@intambwe.org"
          />
        </div>
      </div>

      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('Please contact contact@intambwe.org to reset staff/student credentials.'); }} style={{ fontSize: '0.78rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
            Forgot password?
          </a>
        </div>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          className="form-input"
          placeholder="Enter your account password"
        />
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }}>
        <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
        <ArrowRight size={18} />
      </button>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
        Don&apos;t have an account yet?{' '}
        <Link href="/register" style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>
          Join INTAMBWE Free
        </Link>
      </div>
    </form>
  );
}
