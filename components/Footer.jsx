import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import NewsletterForm from './NewsletterForm';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
          marginBottom: '50px'
        }}>
          {/* Brand & Philosophy */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Image src="/intambwe-emblem.png" alt="INTAMBWE" width={44} height={48} className="brand-emblem footer-emblem" />
              <div>
                <div style={{ fontFamily: 'var(--font-headings)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-white)' }}>INTAMBWE</div>
                <div style={{ color: 'var(--color-gold)', fontSize: '0.72rem', fontWeight: 600 }}>Leadership begins with a step forward</div>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#b9c7bf', marginBottom: '20px' }}>
              A Rwandan youth initiative founded by Irakoze Sarah Divine, preparing ethical and innovative leaders for community impact.
            </p>
            <div style={{
              display: 'inline-block',
              padding: '6px 12px',
              backgroundColor: 'rgba(212, 167, 44, 0.15)',
              border: '1px solid rgba(212, 167, 44, 0.3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: 'var(--color-gold)',
              fontWeight: 600
            }}>
              LEARN • THINK • CONNECT • ACT • IMPACT
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'var(--color-white)', fontSize: '1.05rem', marginBottom: '18px', fontWeight: 600 }}>
              Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About INTAMBWE & Founder</Link></li>
              <li><Link href="/explore">Explore Leadership Lessons</Link></li>
              <li><Link href="/conferences">Inter-School Conferences</Link></li>
              <li><Link href="/resources">Handbooks & Learning Toolkits</Link></li>
              <li><Link href="/community">Youth Leadership Community</Link></li>
              <li><Link href="/contact">Contact & Partnerships</Link></li>
            </ul>
          </div>

          {/* Leadership Domains */}
          <div>
            <h4 style={{ color: 'var(--color-white)', fontSize: '1.05rem', marginBottom: '18px', fontWeight: 600 }}>
              Core Domains
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li><Link href="/explore">Self-Leadership & Character</Link></li>
              <li><Link href="/explore">Critical Thinking & Analysis</Link></li>
              <li><Link href="/explore">Public Speaking & Communication</Link></li>
              <li><Link href="/explore">Ethical Decision Making</Link></li>
              <li><Link href="/explore">Community Problem Solving</Link></li>
              <li><Link href="/explore">Inter-School Collaboration</Link></li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div>
            <h4 style={{ color: 'var(--color-white)', fontSize: '1.05rem', marginBottom: '18px', fontWeight: 600 }}>
              Headquarters
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: '#b9c7bf' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={18} style={{ color: 'var(--color-gold)' }} />
                <span>Kigali, Rwanda</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={18} style={{ color: 'var(--color-gold)' }} />
                <span>contact@intambwe.org</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={18} style={{ color: 'var(--color-gold)' }} />
                <span>+250 788 000 000</span>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-white)', marginBottom: '8px' }}>
                Stay Informed
              </div>
              <NewsletterForm />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          color: '#8e9e95',
          gap: '12px'
        }}>
          <div>
            &copy; {new Date().getFullYear()} INTAMBWE. All Rights Reserved. Founded by Irakoze Sarah Divine.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/about" style={{ color: '#8e9e95' }}>About Organization</Link>
            <Link href="/contact" style={{ color: '#8e9e95' }}>Privacy & Child Safety</Link>
            <Link href="/login" style={{ color: 'var(--color-gold)' }}>Staff Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
