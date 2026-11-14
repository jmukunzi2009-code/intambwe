import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { MapPin, Mail, Phone, Clock, ShieldCheck } from 'lucide-react';
import ContactForm from './ContactForm';

export const metadata = {
  title: 'Contact INTAMBWE | Headquarters & Partnerships',
  description: 'Get in touch with the INTAMBWE youth leadership team in Rwamagana, Eastern Province, Rwanda. Inquire about school partnerships and conference registration.',
};

export default async function ContactPage() {
  const currentUser = await getCurrentUser();

  return (
    <>
      <Navbar currentUser={currentUser} />

      <main style={{ minHeight: '100vh', paddingBottom: '80px' }}>
        {/* HEADER */}
        <section style={{ backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', padding: '70px 0 50px 0' }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
            <span className="badge badge-gold" style={{ marginBottom: '14px' }}>Connect With Us</span>
            <h1 style={{ color: 'var(--color-white)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', marginBottom: '16px' }}>
              We Welcome Your Voice
            </h1>
            <p style={{ color: '#d1dbd5', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Whether you are a student, educator, school leader, or community mentor, reach out to explore how INTAMBWE can support your youth leadership goals.
            </p>
          </div>
        </section>

        <div className="container" style={{ marginTop: '50px' }}>
          <div className="contact-page-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '40px', alignItems: 'flex-start' }}>
            
            {/* CONTACT DETAILS & INFO */}
            <div>
              <div style={{ marginBottom: '32px' }}>
                <span className="badge badge-emerald" style={{ marginBottom: '12px' }}>Headquarters</span>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '14px' }}>
                  INTAMBWE Youth Initiative
                </h2>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                  Founded by Irakoze Sarah Divine, INTAMBWE is based in Rwamagana, Eastern Province, and works with secondary schools and educational communities in Kigali and across Rwanda.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-soft)', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '2px' }}>Location</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Rwamagana, Eastern Province, Rwanda</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-gold-soft)', color: 'var(--color-gold-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '2px' }}>Email Inquiries</h4>
                    <a className="contact-email-link contact-page-email" href="mailto:intambwe@gmail.com">intambwe@gmail.com</a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(18, 59, 42, 0.1)', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '2px' }}>Telephone</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>+250 788 000 000</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: '#EEF2F6', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '2px' }}>Hours of Operation</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Monday – Friday: 08:30 – 17:30 CAT</p>
                  </div>
                </div>
              </div>

              {/* PRIVACY PROMISE */}
              <div className="card" style={{ backgroundColor: '#F9FCFA', borderLeft: '4px solid var(--color-emerald)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--color-emerald)' }} />
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--color-forest)' }}>Privacy & Communications Guarantee</h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  INTAMBWE respects your confidentiality. Messages are securely stored and handled only by verified organizational leadership.
                </p>
              </div>
            </div>

            {/* INTERACTIVE FORM */}
            <div>
              <ContactForm />
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
