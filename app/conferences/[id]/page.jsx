import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ArrowLeft, 
  Printer, 
  CheckCircle2, 
  Award, 
  FileText,
  Sparkles,
  School,
  Video,
  Camera,
  Layers,
  HelpCircle
} from 'lucide-react';
import RegisterConferenceButton from './RegisterConferenceButton';
import PrintAgendaButton from './PrintAgendaButton';
import styles from '../conferences.module.css';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const res = await query('SELECT title, theme FROM meetings WHERE id = $1', [id]);
  if (res.rows.length === 0) return { title: 'Conference Not Found' };
  return {
    title: `${res.rows[0].title} | INTAMBWE Conferences`,
    description: res.rows[0].theme,
  };
}

export default async function ConferenceDetailPage({ params }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const meetingRes = await query(
    `SELECT m.*, 
            COUNT(DISTINCT er.user_id) as registration_count,
            COUNT(DISTINCT ar.user_id) as attendance_count
     FROM meetings m
     LEFT JOIN event_registrations er ON m.id = er.meeting_id
     LEFT JOIN attendance_records ar ON m.id = ar.meeting_id AND ar.status = 'present'
     WHERE m.id = $1
     GROUP BY m.id`,
    [id]
  );

  if (meetingRes.rows.length === 0) {
    notFound();
  }

  const meeting = meetingRes.rows[0];

  // Parse gallery URLs
  let gallery = [];
  if (meeting.gallery_urls) {
    try {
      gallery = typeof meeting.gallery_urls === 'string' 
        ? JSON.parse(meeting.gallery_urls) 
        : meeting.gallery_urls;
    } catch (e) {
      gallery = [];
    }
  }

  // Check if current user is registered
  let isAlreadyRegistered = false;
  if (currentUser) {
    const checkReg = await query(
      'SELECT id FROM event_registrations WHERE meeting_id = $1 AND user_id = $2',
      [id, currentUser.id]
    );
    isAlreadyRegistered = checkReg.rows.length > 0;
  }

  // Fetch agenda
  const agendaRes = await query(
    `SELECT * FROM agenda_items WHERE meeting_id = $1 ORDER BY sort_order ASC, start_time ASC`,
    [id]
  );

  // Fetch speakers
  const speakersRes = await query(
    `SELECT * FROM meeting_speakers WHERE meeting_id = $1 ORDER BY sort_order ASC`,
    [id]
  );

  // Fetch participating schools
  const schoolsRes = await query(
    `SELECT s.* FROM schools s
     JOIN meeting_schools ms ON s.id = ms.school_id
     WHERE ms.meeting_id = $1`,
    [id]
  );

  // Fetch registered delegates list with school & attendance status
  const delegatesRes = await query(
    `SELECT u.full_name, sp.school_name, sp.class_level,
            ar.status as attendance_status, er.registered_at
     FROM event_registrations er
     JOIN users u ON er.user_id = u.id
     LEFT JOIN student_profiles sp ON u.id = sp.user_id
     LEFT JOIN attendance_records ar ON er.meeting_id = ar.meeting_id AND er.user_id = ar.user_id
     WHERE er.meeting_id = $1
     ORDER BY (ar.status = 'present') DESC, u.full_name ASC`,
    [id]
  );

  // Fetch other upcoming / recent conferences
  const otherConferencesRes = await query(
    `SELECT id, meeting_number, title, theme, event_date, venue, status
     FROM meetings
     WHERE id != $1
     ORDER BY event_date DESC
     LIMIT 5`,
    [id]
  );



  return (
    <div className={styles.conferencePage}>
      <Navbar currentUser={currentUser} />

      <main style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-soft)', paddingBottom: '80px' }}>
        
        {/* HERO HEADER */}
        <section className={styles.detailHero} style={{ backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', position: 'relative' }}>
          <div className={`container ${styles.detailHeroContent}`} style={{ maxWidth: '1080px' }}>
            <Link 
              href="/conferences" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#b9c7bf', fontSize: '0.9rem', marginBottom: '20px' }}
            >
              <ArrowLeft size={16} />
              <span>Back to all summits & conferences</span>
            </Link>

            <div className={styles.heroMeta}>
              <span className="badge badge-gold">{meeting.status.replace('_', ' ')}</span>
              <span style={{ fontSize: '0.85rem', color: '#b9c7bf' }}>Summit #{meeting.meeting_number}</span>
            </div>

            <h1 className={styles.heroTitle} style={{ color: 'var(--color-white)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', lineHeight: 1.2, marginBottom: '16px' }}>
              {meeting.title}
            </h1>

            <div className={styles.heroTheme} style={{ fontSize: '1.25rem', color: 'var(--color-gold)', fontWeight: 600, marginBottom: '24px' }}>
              Theme: {meeting.theme}
            </div>

            <div className={styles.heroFacts}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: 'var(--color-gold)' }} />
                <span>{new Date(meeting.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              {meeting.start_time && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} style={{ color: 'var(--color-gold)' }} />
                  <span>{meeting.start_time.slice(0, 5)} - {meeting.end_time ? meeting.end_time.slice(0, 5) : 'Closing'}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} style={{ color: 'var(--color-gold)' }} />
                <span>{meeting.venue}</span>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN BODY CONTAINER */}
        <div className="container" style={{ maxWidth: '1080px', marginTop: '40px' }}>
          
          {/* COVER PHOTO BANNER (IF AVAILABLE) */}
          {meeting.cover_image_url && (
            <div style={{ marginBottom: '36px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', maxHeight: '420px', boxShadow: 'var(--shadow-md)' }}>
              <img src={meeting.cover_image_url} alt={meeting.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <div className={styles.detailLayout}>
            
            {/* LEFT / MAIN COLUMN */}
            <div className={styles.detailColumn}>
              
              {/* SUMMIT OVERVIEW & KEY THEMES */}
              <div className="card">
                <h3 style={{ fontSize: '1.3rem', marginBottom: '14px', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} style={{ color: 'var(--color-emerald)' }} />
                  <span>Summit Overview & Key Topics</span>
                </h3>
                <p style={{ color: 'var(--color-text-main)', lineHeight: 1.8, fontSize: '1rem', marginBottom: '18px' }}>
                  {meeting.description}
                </p>

                {/* TOPIC BULLETS */}
                <div style={{ backgroundColor: '#F8FAF9', padding: '16px 20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-emerald)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-forest)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Core Debate & Action Topics
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: 'var(--color-gold)', fontWeight: 800 }}>•</span>
                      <span><strong>Ethical Dilemmas in Secondary Education:</strong> Overcoming peer pressure and modeling honesty.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: 'var(--color-gold)', fontWeight: 800 }}>•</span>
                      <span><strong>Student Voice in School Councils:</strong> Structuring dialogues with school patrons and principals.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: 'var(--color-gold)', fontWeight: 800 }}>•</span>
                      <span><strong>Grassroots Action Pledges:</strong> Formulating youth-led community projects under Rwanda&apos;s Imihigo framework.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* VIDEO RECAP / HIGHLIGHTS (IF AVAILABLE) */}
              {meeting.video_url && (
                <div className="card" style={{ padding: '20px', backgroundColor: '#11231a', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-gold)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '14px' }}>
                    <Video size={20} />
                    <span>Conference Highlights & Keynote Video</span>
                  </div>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
                    <iframe
                      src={meeting.video_url}
                      title="Summit Highlights"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                </div>
              )}

              {/* OFFICIAL AGENDA IN ELEGANT DATA TABLE */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={20} style={{ color: 'var(--color-emerald)' }} />
                      <span>Official Conference Agenda</span>
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      Chronological timetable of keynote speeches, debates, and breakout workshops.
                    </p>
                  </div>
                  <PrintAgendaButton />
                </div>

                {agendaRes.rows.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>The schedule for this summit is currently being finalized.</p>
                ) : (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '120px' }}>Time</th>
                          <th>Session & Description</th>
                          <th>Keynote / Speaker</th>
                          <th>Facilitator</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agendaRes.rows.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 700, color: 'var(--color-forest)', whiteSpace: 'nowrap' }}>
                              {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--color-forest)', fontSize: '0.95rem' }}>
                                {item.session_title}
                              </div>
                              {item.description && (
                                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                  {item.description}
                                </div>
                              )}
                            </td>
                            <td>
                              {item.speaker_name ? (
                                <span style={{ fontWeight: 600, color: 'var(--color-emerald)', fontSize: '0.85rem' }}>
                                  {item.speaker_name}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--color-text-subtle)', fontSize: '0.82rem' }}>—</span>
                              )}
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                                {item.facilitator_name || 'Host Team'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* PHOTO GALLERY OF SUMMIT HIGHLIGHTS */}
              {gallery.length > 0 && (
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Camera size={20} style={{ color: 'var(--color-gold)' }} />
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest)' }}>
                      Summit Photo Gallery & Student Highlights
                    </h3>
                  </div>
                  <div className={styles.galleryGrid}>
                    {gallery.map((imgUrl, i) => (
                      <div key={i} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '170px', boxShadow: 'var(--shadow-sm)' }}>
                        <img 
                          src={imgUrl} 
                          alt={`Summit highlight ${i + 1}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REGISTERED & ATTENDED DELEGATES ROSTER */}
              <div className="card">
                <div className={styles.rosterHeading}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={20} style={{ color: 'var(--color-emerald)' }} />
                      <span>Delegate Participation Roster</span>
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      Registered student delegates, secondary schools represented, and attendance verification.
                    </p>
                  </div>
                  <span className="badge badge-emerald">
                    {meeting.attendance_count} Attended / {meeting.registration_count} Registered
                  </span>
                </div>

                {delegatesRes.rows.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>No student delegates registered yet.</p>
                ) : (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Delegate Name</th>
                          <th>School</th>
                          <th>Education Level</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {delegatesRes.rows.map((del, index) => (
                          <tr key={index}>
                            <td style={{ fontWeight: 600 }}>{del.full_name}</td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <School size={14} style={{ color: 'var(--color-emerald)' }} />
                                <span>{del.school_name || 'Partner School'}</span>
                              </span>
                            </td>
                            <td>{del.class_level || 'Delegate'}</td>
                            <td>
                              <span className={`badge ${del.attendance_status === 'present' ? 'badge-emerald' : 'badge-gold'}`}>
                                {del.attendance_status === 'present' ? 'ATTENDED ✓' : 'REGISTERED'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* DOCUMENTED OUTCOMES (IF COMPLETED) */}
              {(meeting.outcomes || meeting.recommendations || meeting.summary) && (
                <div className="card" style={{ borderLeft: '4px solid var(--color-gold)', backgroundColor: '#FFFFFF' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '14px', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={20} style={{ color: 'var(--color-gold)' }} />
                    <span>Documented Outcomes & Student Takeaways</span>
                  </h3>
                  {meeting.summary && (
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
                      {meeting.summary}
                    </p>
                  )}
                  {meeting.outcomes && (
                    <div style={{ marginBottom: '14px' }}>
                      <strong style={{ color: 'var(--color-emerald)', display: 'block', marginBottom: '4px' }}>Tangible Outcomes:</strong>
                      <p style={{ color: 'var(--color-text-main)', lineHeight: 1.6, fontSize: '0.95rem' }}>{meeting.outcomes}</p>
                    </div>
                  )}
                  {meeting.recommendations && (
                    <div>
                      <strong style={{ color: 'var(--color-forest)', display: 'block', marginBottom: '4px' }}>Action Recommendations for Student Councils:</strong>
                      <p style={{ color: 'var(--color-text-main)', lineHeight: 1.6, fontSize: '0.95rem' }}>{meeting.recommendations}</p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* RIGHT SIDEBAR: REGISTRATION & PARTNER SCHOOLS */}
            <div className={`${styles.detailColumn} ${styles.sidebarSticky}`} style={{ gap: '24px' }}>
              
              {/* REGISTRATION ACTION CARD */}
              <div className="card" style={{ borderTop: '4px solid var(--color-gold)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Conference Registration</h3>
                
                <div className={styles.registrationStats}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Confirmed Registrations:</span>
                  <strong>{meeting.registration_count} / {meeting.capacity} seats</strong>
                </div>

                <RegisterConferenceButton 
                  meetingId={meeting.id}
                  isAlreadyRegistered={isAlreadyRegistered}
                  isLoggedIn={!!currentUser}
                  status={meeting.status}
                />
              </div>

              {/* DISTINGUISHED SPEAKERS */}
              {speakersRes.rows.length > 0 && (
                <div className="card">
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '16px', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} style={{ color: 'var(--color-emerald)' }} />
                    <span>Keynote Speakers</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {speakersRes.rows.map((sp) => (
                      <div key={sp.id} style={{ paddingBottom: '12px', borderBottom: '1px solid var(--color-border-light)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-forest)' }}>{sp.speaker_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', fontWeight: 600 }}>{sp.role_title}</div>
                        {sp.topic && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '3px' }}>
                            &ldquo;{sp.topic}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PARTICIPATING SCHOOLS */}
              {schoolsRes.rows.length > 0 && (
                <div className="card">
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '12px', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <School size={18} style={{ color: 'var(--color-emerald)' }} />
                    <span>Participating Schools</span>
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                    {schoolsRes.rows.map((sc) => (
                      <li key={sc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--color-emerald)' }} />
                        <span>{sc.name} ({sc.district || 'Rwanda'})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

                            {/* OTHER CONFERENCES & SUMMITS QUICK SWITCHER */}
              {otherConferencesRes.rows.length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid var(--color-emerald)', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <Calendar size={18} style={{ color: 'var(--color-emerald)' }} />
                      <span>Other Summits</span>
                    </h4>
                    <Link href="/conferences" style={{ fontSize: '0.78rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                      All ({otherConferencesRes.rows.length + 1}) →
                    </Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {otherConferencesRes.rows.map((other) => (
                      <Link
                        key={other.id}
                        href={`/conferences/${other.id}`}
                        className="card card-interactive"
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#F8FAF9',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border-light)',
                          textDecoration: 'none',
                          display: 'block'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                            #{other.meeting_number}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>
                            {new Date(other.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-forest)', lineHeight: 1.3, marginBottom: '2px' }}>
                          {other.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                          📍 {other.venue}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* CERTIFICATE ACCREDITATION NOTICE */}
              <div className="card" style={{ backgroundColor: '#F8FAF9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Award size={20} style={{ color: 'var(--color-gold)' }} />
                  <h4 style={{ fontSize: '1rem', color: 'var(--color-forest)' }}>Certificate of Participation</h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  Enrolled students whose attendance is verified by event managers will receive an official, printable INTAMBWE Certificate in their Student Dashboard.
                </p>
              </div>

            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
