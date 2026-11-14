import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { Award, CheckCircle2, ArrowLeft, Printer, ShieldCheck } from 'lucide-react';
import PrintCertificateButton from './PrintCertificateButton';

export async function generateMetadata({ params }) {
  const { code } = await params;
  return {
    title: `Certificate Verification: ${code} | INTAMBWE`,
    description: `Official INTAMBWE Certificate of Leadership Accreditation.`,
  };
}

export default async function CertificateVerificationPage({ params }) {
  const { code } = await params;

  const res = await query(
    `SELECT c.*, u.full_name as recipient_name, sp.school_name,
            m.title as meeting_title, m.meeting_number, m.event_date,
            a.title as article_title, ac.name as course_name
     FROM certificates c
     JOIN users u ON c.user_id = u.id
     LEFT JOIN student_profiles sp ON u.id = sp.user_id
     LEFT JOIN meetings m ON c.meeting_id = m.id
     LEFT JOIN articles a ON c.article_id = a.id
     LEFT JOIN article_categories ac ON c.category_id = ac.id
     WHERE c.certificate_code = $1`,
    [code]
  );

  if (res.rows.length === 0) {
    notFound();
  }

  const cert = res.rows[0];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F6F4', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* VERIFICATION STATUS BAR */}
      <div style={{ width: '100%', maxWidth: '850px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="no-print">
        <Link href="/" className="btn btn-outline btn-sm">
          <ArrowLeft size={16} />
          <span>INTAMBWE Home</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-emerald)', fontWeight: 600, fontSize: '0.9rem' }}>
          <CheckCircle2 size={18} />
          <span>Officially Verified INTAMBWE Accreditation</span>
        </div>

        <PrintCertificateButton />
      </div>

      {/* OFFICIAL CERTIFICATE SHEET */}
      <div 
        id="printable-certificate"
        style={{
          width: '100%',
          maxWidth: '850px',
          backgroundColor: '#FFFFFF',
          border: '12px solid var(--color-forest)',
          borderRadius: 'var(--radius-lg)',
          padding: '60px 50px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center'
        }}
      >
        {/* Decorative Inner Gold Border */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          bottom: '12px',
          border: '2px solid var(--color-gold)',
          pointerEvents: 'none'
        }} />

        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          <Image src="/intambwe-logo.png" alt="INTAMBWE — Leadership begins with a step forward" width={170} height={167} className="certificate-brand-logo" />
          <div style={{ fontFamily: 'var(--font-headings)', fontSize: '2rem', fontWeight: 800, color: 'var(--color-forest)', letterSpacing: '0.04em' }}>
            INTAMBWE
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-emerald)', fontWeight: 700, letterSpacing: '0.12em' }}>
            LEADERSHIP BEGINS WITH A STEP FORWARD
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', marginTop: '4px' }}>
            LEARN • THINK • CONNECT • ACT • CREATE IMPACT
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '28px', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--color-gold-hover)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Certificate of Leadership Participation
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            This is officially awarded to
          </p>
        </div>

        {/* Recipient Name */}
        <div style={{ marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-headings)',
            fontSize: '2.4rem',
            fontWeight: 800,
            color: 'var(--color-forest)',
            borderBottom: '2px solid var(--color-gold)',
            display: 'inline-block',
            padding: '0 30px 6px 30px'
          }}>
            {cert.recipient_name}
          </div>
          {cert.school_name && (
            <div style={{ fontSize: '1rem', color: 'var(--color-emerald)', fontWeight: 600, marginTop: '8px' }}>
              {cert.school_name}
            </div>
          )}
        </div>

        {/* Body Statement */}
        <p style={{
          fontSize: '1.05rem',
          lineHeight: 1.7,
          color: 'var(--color-text-main)',
          maxWidth: '680px',
          margin: '0 auto 36px auto',
          position: 'relative',
          zIndex: 1
        }}>
          {cert.meeting_id
            ? <>In recognition of the student&apos;s verified attendance and contribution at <strong>&quot;{cert.meeting_title || cert.title}&quot;</strong>.</>
            : cert.certificate_kind === 'course'
              ? <>In recognition of successfully completing the <strong>&quot;{cert.course_name || cert.title}&quot;</strong>.</>
            : <>In recognition of successfully completing the online leadership lesson <strong>&quot;{cert.article_title || cert.title}&quot;</strong>.</>}
        </p>

        {/* Footer Signatures and Verification */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '30px',
          marginTop: '20px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-headings)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest)', fontStyle: 'italic', marginBottom: '4px' }}>
              Irakoze Sarah Divine
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
              Founder & Executive Director, INTAMBWE
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-forest)', marginBottom: '4px' }}>
              Issue Date: {new Date(cert.issue_date).toLocaleDateString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
              Accreditation ID: <strong>{cert.certificate_code}</strong>
            </div>
          </div>
        </div>

        {/* Security Stamp */}
        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--color-emerald)' }} />
          <span>Officially verified by INTAMBWE Registry • Rwamagana, Eastern Province, Rwanda</span>
        </div>
      </div>
    </div>
  );
}
