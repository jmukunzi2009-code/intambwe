import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { Calendar, MapPin, Users, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import styles from './conferences.module.css';

export const metadata = {
  title: 'Conferences & Summits | INTAMBWE',
  description: 'Upcoming and past youth leadership summits, forums, and inter-school conferences organized by INTAMBWE in Rwanda.',
};

export const revalidate = 0;

export default async function ConferencesPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const tab = resolvedParams?.tab || 'all'; // 'upcoming', 'past', 'all'
  const currentUser = await getCurrentUser();

  // Upcoming
  const upcomingRes = await query(
    `SELECT m.*, COUNT(DISTINCT er.user_id) as reg_count
     FROM meetings m
     LEFT JOIN event_registrations er ON m.id = er.meeting_id
     WHERE m.event_date >= CURRENT_DATE
     GROUP BY m.id
     ORDER BY m.event_date ASC`
  );

  // Past
  const pastRes = await query(
    `SELECT m.*, COUNT(DISTINCT ar.user_id) as attendance_count, COUNT(DISTINCT er.user_id) as reg_count
     FROM meetings m
     LEFT JOIN event_registrations er ON m.id = er.meeting_id
     LEFT JOIN attendance_records ar ON m.id = ar.meeting_id AND ar.status = 'present'
     WHERE m.event_date < CURRENT_DATE
     GROUP BY m.id
     ORDER BY m.event_date DESC`
  );

  const showUpcoming = tab === 'all' || tab === 'upcoming';
  const showPast = tab === 'all' || tab === 'past';

  return (
    <div className={styles.conferencePage}>
      <Navbar currentUser={currentUser} />

      <main style={{ minHeight: '100vh', paddingBottom: '80px' }}>
        {/* HEADER */}
        <section style={{ backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', padding: '70px 0 50px 0' }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: '820px' }}>
            <span className="badge badge-gold" style={{ marginBottom: '14px' }}>Leadership In Action</span>
            <h1 style={{ color: 'var(--color-white)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', marginBottom: '16px' }}>
              Inter-School Leadership Conferences
            </h1>
            <p style={{ color: '#d1dbd5', fontSize: '1.1rem', lineHeight: 1.6 }}>
              INTAMBWE convenes students, teacher mentors, and distinguished community speakers to debate critical challenges, develop ethical problem-solving skills, and establish student alliances.
            </p>
          </div>
        </section>

        {/* FILTER TABS */}
        <section style={{ backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-border)', padding: '16px 0' }}>
          <div className={`container ${styles.filterTabs}`}>
            <Link 
              href="/conferences" 
              className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-outline'}`}
            >
              All Conferences ({upcomingRes.rows.length + pastRes.rows.length})
            </Link>
            <Link 
              href="/conferences?tab=upcoming" 
              className={`btn btn-sm ${tab === 'upcoming' ? 'btn-primary' : 'btn-outline'}`}
            >
              Upcoming ({upcomingRes.rows.length})
            </Link>
            <Link 
              href="/conferences?tab=past" 
              className={`btn btn-sm ${tab === 'past' ? 'btn-primary' : 'btn-outline'}`}
            >
              Past Summits ({pastRes.rows.length})
            </Link>
          </div>
        </section>

        <div className="container" style={{ marginTop: '40px' }}>
          {/* UPCOMING CONFERENCES SECTION */}
          {showUpcoming && (
            <div style={{ marginBottom: '60px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-emerald)' }}></span>
                <h2 style={{ fontSize: '1.6rem' }}>Upcoming Leadership Conferences</h2>
              </div>

              {upcomingRes.rows.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: 'var(--color-text-muted)' }}>There are no upcoming conferences scheduled at this moment. Check back soon!</p>
                </div>
              ) : (
                <div className={styles.conferenceGrid}>
                  {upcomingRes.rows.map((conf) => (
                    <Link key={conf.id} href={`/conferences/${conf.id}`} className={`card ${styles.conferenceCard}`} style={{ borderLeft: '4px solid var(--color-emerald)', display: 'flex', flexDirection: 'column' }}>
                      <div className={styles.cardMeta} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <span className="badge badge-emerald">
                          {conf.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                          #{conf.meeting_number}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: 'var(--color-forest)' }}>
                        {conf.title}
                      </h3>

                      <div style={{ fontSize: '0.9rem', color: 'var(--color-emerald)', fontWeight: 600, marginBottom: '12px' }}>
                        Theme: {conf.theme}
                      </div>

                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
                        {conf.description}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', marginBottom: '20px', borderTop: '1px solid var(--color-border-light)', paddingTop: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={16} style={{ color: 'var(--color-emerald)' }} />
                          <span>{new Date(conf.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        {conf.start_time && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} style={{ color: 'var(--color-emerald)' }} />
                            <span>{conf.start_time.slice(0, 5)} - {conf.end_time ? conf.end_time.slice(0, 5) : 'Closing'}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} style={{ color: 'var(--color-emerald)' }} />
                          <span>{conf.venue}</span>
                        </div>
                      </div>

                      <div className={styles.cardFooter} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-light)', paddingTop: '14px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
                          <strong>{conf.reg_count}</strong> of {conf.capacity} seats registered
                        </span>
                        <span className="btn btn-emerald btn-sm">
                          <span>Details & Register</span>
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAST CONFERENCES SECTION */}
          {showPast && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--color-gold)' }} />
                <h2 style={{ fontSize: '1.6rem' }}>Completed Summits & Archive</h2>
              </div>

              <div className={styles.conferenceGrid}>
                {pastRes.rows.map((conf) => (
                  <Link key={conf.id} href={`/conferences/${conf.id}`} className={`card ${styles.conferenceCard}`} style={{ backgroundColor: '#FCFDFC', display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.cardMeta} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span className="badge badge-forest">Completed</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>#{conf.meeting_number}</span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--color-forest)' }}>{conf.title}</span>
                    </h3>

                    <div style={{ fontSize: '0.88rem', color: 'var(--color-emerald)', fontWeight: 600, marginBottom: '12px' }}>
                      Theme: {conf.theme}
                    </div>

                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>
                      {conf.summary || conf.description}
                    </p>

                    {conf.outcomes && (
                      <div style={{ backgroundColor: 'var(--color-success-soft)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--color-forest)', marginBottom: '16px' }}>
                        <strong>Documented Outcomes:</strong> {conf.outcomes}
                      </div>
                    )}

                    <div className={styles.cardFooter} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-light)', paddingTop: '14px', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--color-text-subtle)' }}>
                        Held on {new Date(conf.event_date).toLocaleDateString()}
                      </span>
                      <span className="btn btn-outline btn-sm">
                        View Summit Report
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
