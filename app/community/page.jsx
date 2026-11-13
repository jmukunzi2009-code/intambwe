import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { isStaffRole } from '@/lib/permissions';
import { 
  Users, 
  Quote, 
  Award, 
  MessageSquare, 
  ShieldCheck, 
  Calendar, 
  ArrowRight,
  HeartHandshake,
  Sparkles,
  Video
} from 'lucide-react';
import CommunityTopicCreator from './CommunityTopicCreator';
import StickBoard from '@/components/StickBoard';

export const metadata = {
  title: 'Youth Leadership Community | INTAMBWE',
  description: 'Join moderated leadership dialogues, participate in real-world community action challenges, and collaborate with student peers across Rwanda.',
};

export const revalidate = 0;

export default async function CommunityPage() {
  const currentUser = await getCurrentUser();

  // Fetch active challenges
  const challengesRes = await query(
    `SELECT c.*, COUNT(cs.id) as submissions_count
     FROM challenges c
     LEFT JOIN challenge_submissions cs ON c.id = cs.challenge_id
     WHERE c.is_active = true
     GROUP BY c.id
     ORDER BY c.start_date DESC`
  );

  // Fetch moderated topics
  const topicsRes = await query(
    `SELECT dt.*, u.full_name as author_name, sp.school_name,
            COUNT(dr.id) as response_count
     FROM discussion_topics dt
     JOIN users u ON dt.user_id = u.id
     LEFT JOIN student_profiles sp ON u.id = sp.user_id
     LEFT JOIN discussion_responses dr ON dt.id = dr.topic_id AND dr.is_approved = true
     WHERE dt.is_approved = true
     GROUP BY dt.id, u.full_name, sp.school_name
     ORDER BY dt.is_pinned DESC, dt.created_at DESC
     LIMIT 5`
  );
  const leadersRes = await query(
    `SELECT * FROM leader_highlights WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC`
  );

  const notesRes = await query(
     `SELECT n.id, n.title, n.body, n.note_kind, n.tone, n.media_url, n.media_type, n.created_at, n.user_id,
             COALESCE(NULLIF(n.author_name, ''), u.full_name, 'Community Leader') AS full_name,
             COALESCE(NULLIF(n.school_name, ''), sp.school_name, 'INTAMBWE Community') AS school_name,
             COUNT(DISTINCT likes.user_id)::int AS like_count,
             COALESCE(BOOL_OR(my_like.user_id IS NOT NULL), false) AS liked_by_me
      FROM stick_notes n
      JOIN users u ON u.id = n.user_id
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN stick_note_likes likes ON likes.note_id = n.id
      LEFT JOIN stick_note_likes my_like ON my_like.note_id = n.id AND my_like.user_id = $1
      WHERE n.visibility = 'published' AND n.note_kind <> 'reflection'
      GROUP BY n.id, u.id, sp.school_name
      ORDER BY n.created_at DESC
      LIMIT 80`,
     [currentUser?.id || null]
  );

  return (
    <>
      <Navbar currentUser={currentUser} />

      <main style={{ minHeight: '100vh', paddingBottom: '80px' }}>
        {/* HEADER */}
        <section style={{ backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', padding: '70px 0 50px 0' }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: '820px' }}>
            <span className="badge badge-gold" style={{ marginBottom: '14px' }}>Peer Collaboration</span>
            <h1 style={{ color: 'var(--color-white)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', marginBottom: '16px' }}>
              INTAMBWE Youth Leadership Circle
            </h1>
            <p style={{ color: '#d1dbd5', fontSize: '1.1rem', lineHeight: 1.6 }}>
              A safe, moderated forum for secondary school delegates and student council representatives to share solutions, launch community action challenges, and learn collectively.
            </p>
          </div>
        </section>

        {/* STUDENT PRIVACY & SAFETY BANNER */}
        <div style={{ backgroundColor: '#F3F8F5', borderBottom: '1px solid var(--color-border)', padding: '14px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--color-forest)' }}>
            <ShieldCheck size={18} style={{ color: 'var(--color-emerald)' }} />
            <span>
              <strong>Student Privacy & Protection:</strong> All discussions and submissions are actively moderated by the INTAMBWE administrative team to safeguard young delegates.
            </span>
          </div>
        </div>

        <div className="container" style={{ marginTop: '40px' }}>
          {/* VOICES OF IMPACT: TRANSFORMATIONAL LEADERS & WISDOM HIGHLIGHTS */}
          <section style={{ marginBottom: '50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '26px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-gold">Leadership Wisdom</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Voices of Impact
                  </span>
                </div>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest)', margin: 0 }}>
                  Inspiring Leaders &amp; Transformational Highlights
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: '6px 0 0 0', maxWidth: '720px' }}>
                  Foundational wisdom, proven quotes, and leadership milestones from visionary figures guiding youth across Rwanda and the world.
                </p>
              </div>

              {currentUser && ['admin', 'super_admin', 'content_editor'].includes(currentUser.role) && (
                <Link href="/dashboard/admin" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: 'var(--color-gold)' }} />
                  <span>Manage Highlights (Admin)</span>
                </Link>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '26px' }}>
              {leadersRes.rows.map((leader) => (
                <article 
                  key={leader.id} 
                  className="card" 
                  style={{ 
                    borderRadius: '16px', 
                    border: '1px solid rgba(201, 155, 67, 0.35)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    padding: '28px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 4px 20px -2px rgba(20, 36, 56, 0.08), 0 0 0 1px rgba(201, 155, 67, 0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                    <span className="badge badge-gold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {leader.badge || 'Featured Leader'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2.5px solid var(--color-gold)', backgroundColor: '#0f1e2f', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                      <img 
                        src={leader.image_url || '/about/profile.png'} 
                        alt={leader.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <div style={{ minWidth: 0, paddingRight: '80px' }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {leader.name}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', fontWeight: 600, marginTop: '2px', lineHeight: 1.3 }}>
                        {leader.title}
                      </div>
                    </div>
                  </div>

                  {/* THE QUOTE */}
                  <div style={{ position: 'relative', paddingLeft: '16px', borderLeft: '3px solid var(--color-gold)', marginBottom: '18px', flex: 1 }}>
                    <Quote size={18} style={{ color: 'var(--color-gold)', opacity: 0.6, marginBottom: '4px' }} />
                    <p style={{ fontSize: '0.96rem', fontStyle: 'italic', color: 'var(--color-forest)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                      &ldquo;{leader.quote}&rdquo;
                    </p>
                  </div>

                  {/* OPTIONAL VIDEO SPEECH / KEYNOTE HIGHLIGHT */}
                  {leader.video_url && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--color-emerald)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        <Video size={13} />
                        <span>Speech &amp; Keynote Video</span>
                      </div>
                      <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(20, 36, 56, 0.12)', backgroundColor: '#000', position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                        <iframe
                          src={leader.video_url}
                          title={`Speech by ${leader.name}`}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  {/* KEY HIGHLIGHT / IMPACT SUMMARY */}
                  {leader.highlight && (
                    <div style={{ padding: '12px 14px', backgroundColor: '#F4F8F6', borderRadius: '10px', fontSize: '0.84rem', color: 'var(--color-text-main)', lineHeight: 1.5, marginTop: 'auto' }}>
                      <strong style={{ color: 'var(--color-forest)', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                        Key Leadership Impact:
                      </strong>
                      {leader.highlight}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <StickBoard
            initialNotes={notesRes.rows}
            canCompose={true}
            isLoggedIn={Boolean(currentUser)}
            currentUser={currentUser}
            isAdmin={Boolean(currentUser && isStaffRole(currentUser.role))}
          />

          {/* ACTIVE LEADERSHIP CHALLENGES */}
          <div style={{ marginBottom: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <Award size={24} style={{ color: 'var(--color-gold)' }} />
              <h2 style={{ fontSize: '1.6rem' }}>Active Community Leadership Challenges</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
              {challengesRes.rows.map((ch) => (
                <div key={ch.id} className="card" style={{ borderLeft: '4px solid var(--color-gold)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="badge badge-gold">Active Challenge</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                      Deadline: {new Date(ch.end_date).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: 'var(--color-forest)' }}>
                    {ch.title}
                  </h3>

                  <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
                    {ch.description}
                  </p>

                  <div style={{ backgroundColor: '#F9FCFA', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.85rem' }}>
                    <strong style={{ color: 'var(--color-forest)', display: 'block', marginBottom: '6px' }}>Challenge Instructions:</strong>
                    <div style={{ color: 'var(--color-charcoal)', whiteSpace: 'pre-line' }}>{ch.instructions}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-light)', paddingTop: '16px', marginTop: 'auto' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
                      <strong>{ch.submissions_count}</strong> student proposals submitted
                    </span>
                    {currentUser ? (
                      <Link href="/dashboard/student" className="btn btn-emerald btn-sm">
                        Submit Solution
                      </Link>
                    ) : (
                      <Link href="/login?redirect=/community" className="btn btn-outline btn-sm">
                        Sign In to Submit
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COMMUNITY DIALOGUES / DISCUSSIONS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={22} style={{ color: 'var(--color-emerald)' }} />
                <h2 style={{ fontSize: '1.6rem' }}>Moderated Student Council Dialogues</h2>
              </div>
            </div>

            <CommunityTopicCreator isLoggedIn={!!currentUser} />

            {topicsRes.rows.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Community discussion forums are currently being refreshed for the upcoming inter-school session.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {topicsRes.rows.map((top) => (
                  <div key={top.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--color-forest)' }}>
                        {top.title}
                      </h4>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        Initiated by <strong>{top.author_name}</strong> {top.school_name ? `(${top.school_name})` : ''} • {new Date(top.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                      <MessageSquare size={16} />
                      <span>{top.response_count} insights</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
