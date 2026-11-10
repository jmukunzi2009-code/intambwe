import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { 
  User, 
  Calendar, 
  BookOpen, 
  Award, 
  BookMarked, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  School,
  ExternalLink,
  Download
} from 'lucide-react';
import StudentJournalManager from './StudentJournalManager';
import StudentChallengeSubmit from './StudentChallengeSubmit';
import CourseCertificateButton from './CourseCertificateButton';

export const metadata = {
  title: 'Student Leadership Portal | INTAMBWE',
  description: 'Manage your conference registrations, personal leadership journal, challenge solutions, and verified certificates.',
};

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Fetch student registrations
  const regRes = await query(
    `SELECT er.id as reg_id, er.registered_at,
            m.id as meeting_id, m.meeting_number, m.title, m.theme, m.event_date,
            m.start_time, m.venue, m.status,
            ar.status as attendance_status
     FROM event_registrations er
     JOIN meetings m ON er.meeting_id = m.id
     LEFT JOIN attendance_records ar ON m.id = ar.meeting_id AND ar.user_id = $1
     WHERE er.user_id = $1
     ORDER BY m.event_date DESC`,
    [user.id]
  );

  // 2. Fetch student journals
  const journalRes = await query(
    `SELECT * FROM student_journals WHERE user_id = $1 ORDER BY created_at DESC`,
    [user.id]
  );

  // 3. Fetch challenge submissions & active challenges
  const [submissionsRes, activeChallengesRes] = await Promise.all([
    query(
      `SELECT cs.*, c.title as challenge_title, c.end_date
       FROM challenge_submissions cs
       JOIN challenges c ON cs.challenge_id = c.id
       WHERE cs.user_id = $1
       ORDER BY cs.submitted_at DESC`,
      [user.id]
    ),
    query(`SELECT * FROM challenges WHERE is_active = true ORDER BY end_date ASC`)
  ]);

  // 4. Fetch certificates
  const certRes = await query(
    `SELECT c.*, m.title as meeting_title, a.title as article_title
     FROM certificates c
     LEFT JOIN meetings m ON c.meeting_id = m.id
     LEFT JOIN articles a ON c.article_id = a.id
     WHERE c.user_id = $1
     ORDER BY c.issue_date DESC`,
    [user.id]
  );

  // 5. Fetch learning progress
  const [completedLessonsRes, totalLessonsRes] = await Promise.all([
    query(
      `SELECT p.article_id, p.completed_at, a.title, a.slug, c.certificate_code
       FROM student_learning_progress p
       JOIN articles a ON a.id = p.article_id AND a.status = 'published'
       LEFT JOIN certificates c ON c.user_id = p.user_id AND c.article_id = p.article_id
       WHERE p.user_id = $1
       ORDER BY p.completed_at DESC`,
      [user.id]
    ),
    query("SELECT COUNT(*) FROM articles WHERE status = 'published'")
  ]);

  const totalLessons = parseInt(totalLessonsRes.rows[0].count, 10) || 8;
  const completedLessons = completedLessonsRes.rows.length;
  const progressPercent = Math.min(100, Math.round((completedLessons / totalLessons) * 100));

  // 6. Recommended lessons
  const articlesRes = await query(
    `SELECT a.id, a.title, a.slug, a.reading_time_minutes, ac.name as category_name
     FROM articles a
     JOIN article_categories ac ON a.category_id = ac.id
     WHERE a.status = 'published'
     LIMIT 4`
  );

  return (
    <>
      <Navbar currentUser={user} />

      <main style={{ minHeight: '100vh', backgroundColor: '#F7FAF8', paddingBottom: '80px' }}>
        {/* STUDENT WELCOME BANNER */}
        <section style={{ backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', padding: '50px 0 40px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: '10px' }}>Student Delegate Portal</span>
                <h1 style={{ color: 'var(--color-white)', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: '8px' }}>
                  Muraho, {user.full_name}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.88rem', color: '#b9c7bf' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <School size={16} style={{ color: 'var(--color-gold)' }} />
                    <span>{user.school_name || 'Partner Secondary School'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={16} style={{ color: 'var(--color-gold)' }} />
                    <span>{user.class_level || 'Delegate'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} style={{ color: 'var(--color-gold)' }} />
                    <span>{user.country || 'Rwanda'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Link href="/explore" className="btn btn-gold btn-sm">
                  <BookOpen size={16} />
                  <span>Explore Lessons</span>
                </Link>
                <Link href="/conferences" className="btn btn-outline-white btn-sm">
                  <Calendar size={16} />
                  <span>Upcoming Summits</span>
                </Link>
              </div>
            </div>

            {/* STATS STRIP */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginTop: '36px',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              paddingTop: '24px'
            }}>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                  {regRes.rows.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#b9c7bf', textTransform: 'uppercase' }}>
                  Conferences Registered
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-white)' }}>
                  {journalRes.rows.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#b9c7bf', textTransform: 'uppercase' }}>
                  Journal Reflections
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                  {completedLessons} / {totalLessons}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#b9c7bf', textTransform: 'uppercase' }}>
                  Lessons Completed ({progressPercent}%)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-white)' }}>
                  {certRes.rows.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#b9c7bf', textTransform: 'uppercase' }}>
                  Verified Certificates
                </div>
              </div>
            </div>

            {/* CURRICULUM PROGRESS BAR */}
            <div style={{ marginTop: '20px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
              <div 
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: 'var(--color-gold)',
                  height: '100%',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        </section>

        {/* DASHBOARD CONTENT BODY */}
        <div className="container" style={{ marginTop: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
            
            {/* LEFT / MAIN COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
              
              {/* MY REGISTERED CONFERENCES */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} style={{ color: 'var(--color-emerald)' }} />
                    <span>My Registered Conferences & Accreditation</span>
                  </h3>
                  <Link href="/conferences" className="btn btn-outline btn-sm">
                    Browse Summits
                  </Link>
                </div>

                {regRes.rows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', backgroundColor: '#F8FAF9', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '14px' }}>
                      You haven&apos;t registered for any leadership summits yet.
                    </p>
                    <Link href="/conferences" className="btn btn-emerald btn-sm">
                      Register for Next Summit
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {regRes.rows.map((reg) => (
                      <div key={reg.reg_id} style={{
                        padding: '18px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="badge badge-emerald">Accredited Delegate</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>#{reg.meeting_number}</span>
                        </div>

                        <h4 style={{ fontSize: '1.1rem', color: 'var(--color-forest)' }}>
                          <Link href={`/conferences/${reg.meeting_id}`}>
                            {reg.title}
                          </Link>
                        </h4>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} />
                            <span>{new Date(reg.event_date).toLocaleDateString()}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} />
                            <span>{reg.venue}</span>
                          </div>
                          {reg.attendance_status && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-emerald)', fontWeight: 600 }}>
                              <CheckCircle2 size={14} />
                              <span>Attendance: {reg.attendance_status.toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LEADERSHIP JOURNAL MANAGER */}
              <div className="card">
                <StudentJournalManager initialJournals={journalRes.rows} />
              </div>

              {/* CHALLENGE SUBMISSIONS */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={20} style={{ color: 'var(--color-gold)' }} />
                    <span>My Challenge Proposals</span>
                  </h3>
                </div>

                <StudentChallengeSubmit activeChallenges={activeChallengesRes.rows} />

                {submissionsRes.rows.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: '16px' }}>
                    You have not submitted a community action proposal yet. Choose an active challenge above to submit your initiative!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    {submissionsRes.rows.map((ch) => (
                      <div key={ch.id} style={{ padding: '14px', backgroundColor: '#F8FAF9', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-gold)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{ch.challenge_title}</strong>
                          <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>{ch.status}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                          {ch.submission_text.slice(0, 180)}...
                        </p>
                        {ch.feedback && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-forest)', backgroundColor: 'var(--color-success-soft)', padding: '6px 10px', borderRadius: '4px' }}>
                            Mentor Feedback: {ch.feedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT SIDEBAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* LEARNING PHILOSOPHY CARD */}
              <div className="card" style={{ backgroundColor: 'var(--color-forest)', color: 'white' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '8px' }}>
                  YOUR LEADERSHIP COMPASS
                </div>
                <h4 style={{ color: 'white', fontSize: '1.15rem', marginBottom: '12px' }}>
                  Learn. Think. Connect. Act. Create Impact.
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#b9c7bf', lineHeight: 1.5 }}>
                  Remember that leadership starts in self-discipline. Strive to apply one lesson into action every week.
                </p>
              </div>

              {/* RECOMMENDED LESSONS */}
              <div className="card">
                <h4 style={{ fontSize: '1.05rem', marginBottom: '14px', color: 'var(--color-forest)' }}>
                  Recommended Leadership Lessons
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {articlesRes.rows.map((art) => (
                    <Link key={art.id} href={`/explore/${art.slug}`} style={{ paddingBottom: '10px', borderBottom: '1px solid var(--color-border-light)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-emerald)', fontWeight: 600 }}>{art.category_name}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-forest)' }}>{art.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>{art.reading_time_minutes} min read</div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px' }}>
                  <Award size={20} style={{ color: 'var(--color-gold)' }} /> Certificates for online lessons
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
                  Complete a leadership lesson to unlock its verifiable course certificate.
                </p>
                {completedLessonsRes.rows.length === 0 ? (
                  <Link href="/explore" className="btn btn-outline btn-sm">Explore lessons</Link>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {completedLessonsRes.rows.map((lesson) => (
                      <div key={lesson.article_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <Link href={`/explore/${lesson.slug}`} style={{ fontWeight: 700, color: 'var(--color-forest)' }}>{lesson.title}</Link>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-emerald)' }}>Lesson completed</div>
                        </div>
                        <CourseCertificateButton articleId={lesson.article_id} certificateCode={lesson.certificate_code} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* VERIFIED CERTIFICATES */}
              <div className="card">
                <h4 style={{ fontSize: '1.05rem', marginBottom: '12px', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} style={{ color: 'var(--color-gold)' }} />
                  <span>My Verified Certificates</span>
                </h4>
                {certRes.rows.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    Your verified conference and completed-course certificates will appear here.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {certRes.rows.map((c) => (
                      <div key={c.id} style={{ padding: '12px', backgroundColor: '#F9FCFA', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-forest)' }}>{c.meeting_title || c.article_title || c.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', margin: '4px 0 8px 0' }}>Code: {c.certificate_code}</div>
                        <Link 
                          href={`/certificates/${c.certificate_code}`}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>View Official Certificate</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
