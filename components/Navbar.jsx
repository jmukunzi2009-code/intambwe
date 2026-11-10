'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowRight, User, ShieldCheck } from 'lucide-react';

export default function Navbar({ currentUser = null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            <Image src="/intambwe-emblem.png" alt="INTAMBWE" width={46} height={50} className="brand-emblem nav-brand-emblem" priority />
            <div>
              <div className="nav-logo-text">INTAMBWE</div>
              <div className="nav-tagline" title="Leadership begins with a step forward">
                Leadership begins with a step forward
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="navbar-nav" aria-label="Main navigation">
            <ul className="nav-links">
              <li><Link href="/" className="nav-link">Home</Link></li>
              <li><Link href="/about" className="nav-link">About</Link></li>
              <li><Link href="/explore" className="nav-link">Learn</Link></li>
              <li><Link href="/conferences" className="nav-link">Conferences</Link></li>
              <li><Link href="/resources" className="nav-link">Resources</Link></li>
              <li><Link href="/community" className="nav-link">Community</Link></li>
              <li><Link href="/contact" className="nav-link">Contact</Link></li>
            </ul>
          </nav>

          {/* Desktop Actions */}
          <div className="nav-actions">
            {currentUser ? (
              <div className="nav-auth-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link 
                  href={currentUser.role === 'student' ? '/dashboard/student' : '/dashboard/admin'} 
                  className="btn btn-emerald btn-sm"
                >
                  {currentUser.role === 'student' ? <User size={16} /> : <ShieldCheck size={16} />}
                  <span>Dashboard ({currentUser.full_name?.split(' ')[0]})</span>
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="btn btn-outline btn-sm" style={{ padding: '7px 12px' }}>
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <div className="nav-auth-actions">
                <Link href="/login" className="btn btn-outline btn-sm">
                  Sign In
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  <span>Join INTAMBWE</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button 
              type="button"
              className="btn btn-outline btn-sm mobile-menu-toggle"
              style={{ padding: '8px' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav id="mobile-navigation" className="navbar-mobile-menu" aria-label="Mobile navigation">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="nav-link">Home</Link>
          <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="nav-link">About</Link>
          <Link href="/explore" onClick={() => setMobileMenuOpen(false)} className="nav-link">Learn</Link>
          <Link href="/conferences" onClick={() => setMobileMenuOpen(false)} className="nav-link">Conferences</Link>
          <Link href="/resources" onClick={() => setMobileMenuOpen(false)} className="nav-link">Resources</Link>
          <Link href="/community" onClick={() => setMobileMenuOpen(false)} className="nav-link">Community</Link>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="nav-link">Contact</Link>
          
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', gap: '10px' }}>
            {currentUser ? (
              <Link 
                href={currentUser.role === 'student' ? '/dashboard/student' : '/dashboard/admin'} 
                className="btn btn-emerald btn-sm"
                style={{ width: '100%' }}
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-outline btn-sm" style={{ flex: 1 }}>Sign In</Link>
                <Link href="/register" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Register</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
