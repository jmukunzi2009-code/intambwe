import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { 
  Users, 
  Award, 
  MessageSquare, 
  ShieldCheck, 
  Calendar, 
  ArrowRight,
  HeartHandshake,
  Sparkles
} from 'lucide-react';
import CommunityTopicCreator from './CommunityTopicCreator';

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
