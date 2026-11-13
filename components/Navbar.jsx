'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, User, ShieldCheck } from 'lucide-react';
import { ThemeModeButton } from './ThemeProvider';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/explore', label: 'Learn' },
  { href: '/conferences', label: 'Conferences' },
  { href: '/resources', label: 'Resources' },
  { href: '/community', label: 'Community' },
  { href: '/contact', label: 'Contact' },
];

function isActiveRoute(pathname, href) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar({ currentUser = null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

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

          <nav className="navbar-nav" aria-label="Main navigation">
            <ul className="nav-links">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="nav-link" aria-current={isActiveRoute(pathname, href) ? 'page' : undefined}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="nav-actions">
            <ThemeModeButton />
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

            <button 
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav id="mobile-navigation" className="navbar-mobile-menu" aria-label="Mobile navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className="nav-link"
              aria-current={isActiveRoute(pathname, href) ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
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
          <ThemeModeButton className="mobile-theme-toggle" />
        </nav>
      )}
    </header>
  );
}
