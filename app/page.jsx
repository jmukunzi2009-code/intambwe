import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { 
  ArrowRight, 
  Calendar, 
  MapPin, 
  BookOpen, 
  Award, 
  Users, 
  CheckCircle, 
  ShieldCheck, 
  Lightbulb, 
  Brain, 
  Mic, 
  HeartHandshake, 
  Sparkles,
  Quote,
  Video
} from 'lucide-react';

export const revalidate = 0; // always fetch fresh data from Neon

function getExcerpt(value, maxLength = 150) {
  const text = value?.trim().replace(/\s+/g, ' ');
  if (!text) return 'A practical lesson to help young people grow into thoughtful, confident leaders.';
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

const ARTICLE_IMAGE_FALLBACKS = [
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=960&q=85',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=960&q=85',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=960&q=85',
];

const CONFERENCE_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=85';

const ICON_MAP = {
  UserCheck: ShieldCheck,
  Brain: Brain,
  Mic: Mic,
  Users: Users,
  ShieldCheck: ShieldCheck,
  Lightbulb: Lightbulb,
  HeartHandshake: HeartHandshake,
  Sparkles: Sparkles,
};

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  // 1. Fetch live stats from Neon DB
  const [
    studentsCount,
    schoolsCount,
    meetingsCount,
    articlesCount
  ] = await Promise.all([
    query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
    query("SELECT COUNT(*) FROM schools"),
    query("SELECT COUNT(*) FROM meetings"),
    query("SELECT COUNT(*) FROM articles WHERE status = 'published'")
  ]);

  const stats = {
    students: parseInt(studentsCount.rows[0].count, 10),
    schools: parseInt(schoolsCount.rows[0].count, 10),
    meetings: parseInt(meetingsCount.rows[0].count, 10),
    articles: parseInt(articlesCount.rows[0].count, 10),
  };

  // 2. Fetch categories
  const categoriesRes = await query(
    `SELECT ac.*, COUNT(a.id) as article_count 
     FROM article_categories ac 
     LEFT JOIN articles a ON ac.id = a.category_id AND a.status = 'published'
     GROUP BY ac.id 
     ORDER BY ac.id ASC`
  );

  // 3. Fetch upcoming conferences
  const upcomingMeetingsRes = await query(
    `SELECT m.*, COUNT(er.user_id) as reg_count 
     FROM meetings m
     LEFT JOIN event_registrations er ON m.id = er.meeting_id
     WHERE m.event_date >= CURRENT_DATE 
     GROUP BY m.id
     ORDER BY m.event_date ASC 
     LIMIT 2`
  );

  // 4. Fetch past conferences
  const pastMeetingsRes = await query(
    `SELECT m.*, COUNT(ar.user_id) as attendee_count
     FROM meetings m
     LEFT JOIN attendance_records ar ON m.id = ar.meeting_id AND ar.status = 'present'
     WHERE m.event_date < CURRENT_DATE 
     GROUP BY m.id
     ORDER BY m.event_date DESC 
     LIMIT 2`
  );

  // 5. Fetch featured articles
  const articlesRes = await query(
    `SELECT a.id, a.title, a.slug, a.introduction, a.reading_time_minutes, a.published_at,
            a.cover_image_url, a.video_url,
            ac.name as category_name
     FROM articles a
     JOIN article_categories ac ON a.category_id = ac.id
     WHERE a.status = 'published'
     ORDER BY a.published_at DESC
     LIMIT 3`
  );

  // 6. Fetch featured quote
  const quoteRes = await query(
    `SELECT quote_text, author_name, role_or_context 
     FROM quotes 
     WHERE is_featured = true 
     ORDER BY id ASC 
     LIMIT 1`
  );
  const featuredQuote = quoteRes.rows[0] || {
    quote_text: "Leadership is not about a title or a podium; it begins in the quiet decisions of integrity you make when no one is watching.",
    author_name: "Irakoze Sarah Divine",
    role_or_context: "Founder, INTAMBWE"
  };

  return (
    <>
      <Navbar currentUser={currentUser} />

      <main>
        {/* HERO SECTION */}
        <section className="home-hero">
          <video className="home-hero-video" autoPlay muted loop playsInline aria-hidden="true" poster="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&q=75">
            <source src="/meeting.mp4" type="video/mp4" />
          </video>
          <div className="home-hero-overlay" />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(212, 167, 44, 0.12) 0%, transparent 40%)',
            pointerEvents: 'none'
          }} />

          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            {/* Learning philosophy pill */}
            <div className="philosophy-banner" style={{ marginBottom: '32px' }}>
              <span className="philosophy-step">LEARN</span>
              <span className="philosophy-arrow">→</span>
              <span className="philosophy-step">THINK</span>
              <span className="philosophy-arrow">→</span>
              <span className="philosophy-step">CONNECT</span>
              <span className="philosophy-arrow">→</span>
              <span className="philosophy-step">ACT</span>
              <span className="philosophy-arrow">→</span>
              <span style={{ color: 'var(--color-white)' }}>CREATE IMPACT</span>
            </div>

            <div style={{ maxWidth: '880px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                color: 'var(--color-gold)',
                fontWeight: 600,
                marginBottom: '20px'
              }}>
                <Sparkles size={16} />
                <span>Youth Leadership Development & Conference Platform</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2.4rem, 5vw, 4rem)',
                color: 'var(--color-white)',
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginBottom: '24px'
              }}>
                Every step.<br />A stronger leader.
              </h1>

              <p style={{
                fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
                lineHeight: 1.6,
                color: '#e2eae5',
                marginBottom: '36px',
                maxWidth: '740px',
                margin: '0 auto 36px auto'
              }}>
                INTAMBWE connects secondary school students, educators, and guest mentors across Rwanda. We equip the next generation with ethical grounding, critical thinking, public speaking, and community-driven action.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                <Link href="/explore" className="btn btn-gold btn-lg">
                  <span>Explore Leadership</span>
                  <ArrowRight size={18} />
                </Link>
                {currentUser ? (
                  <Link 
                    href={currentUser.role === 'student' ? '/dashboard/student' : '/dashboard/admin'} 
                    className="btn btn-outline-white btn-lg"
                  >
                    Open Your Dashboard
                  </Link>
                ) : (
                  <Link href="/register" className="btn btn-outline-white btn-lg">
                    Join INTAMBWE Today
                  </Link>
                )}
              </div>
            </div>

            {/* REAL DATABASE STATS CARDS */}
            <div className="home-hero-stats" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginTop: '70px',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              paddingTop: '40px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-gold)', fontFamily: 'var(--font-headings)' }}>
                  {stats.students.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#b9c7bf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Active Student Members
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-white)', fontFamily: 'var(--font-headings)' }}>
                  {stats.schools.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#b9c7bf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Partner Schools in Rwanda
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-gold)', fontFamily: 'var(--font-headings)' }}>
                  {stats.meetings.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#b9c7bf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Organized Summits & Forums
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-white)', fontFamily: 'var(--font-headings)' }}>
                  {stats.articles.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#b9c7bf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Curated Leadership Lessons
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INSPIRATIONAL QUOTE SECTION */}
        <section style={{ backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-border)', padding: '40px 0' }}>
          <div className="container">
            <div style={{
              maxWidth: '820px',
              margin: '0 auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px'
            }}>
              <Quote size={32} style={{ color: 'var(--color-gold)', opacity: 0.8 }} />
              <blockquote style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '1.25rem',
                fontStyle: 'italic',
                color: 'var(--color-forest)',
                lineHeight: 1.5
              }}>
                &ldquo;{featuredQuote.quote_text}&rdquo;
              </blockquote>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-emerald)' }}>
                {featuredQuote.author_name} — <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>{featuredQuote.role_or_context}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT & MISSION SECTION */}
        <section className="section-padding">
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '50px', alignItems: 'center' }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: '14px' }}>Our Mission & Story</span>
                <h2 style={{ fontSize: '2.2rem', marginBottom: '20px' }}>
                  Empowering Young Rwandan Minds to Shape Tomorrow
                </h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px', lineHeight: 1.7 }}>
                  Founded by Rwandan youth leader <strong>Irakoze Sarah Divine</strong>, INTAMBWE brings students together to learn, exchange ideas, and put responsible leadership into practice.
                </p>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '28px', lineHeight: 1.7 }}>
                  Leadership is learned through everyday choices. Students build confidence, think critically, communicate clearly, and find practical ways to serve their communities.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle size={20} style={{ color: 'var(--color-emerald)' }} />
                    <span style={{ fontWeight: 600 }}>Connecting students across schools in collaborative forums</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle size={20} style={{ color: 'var(--color-emerald)' }} />
                    <span style={{ fontWeight: 600 }}>Grounding young leaders in uncompromising integrity</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle size={20} style={{ color: 'var(--color-emerald)' }} />
                    <span style={{ fontWeight: 600 }}>Documenting real conference takeaways and action pledges</span>
                  </div>
                </div>

                <Link href="/about" className="btn btn-outline">
                  Read Full Story & Philosophy
                </Link>
              </div>

              {/* Vision / Values highlight card */}
              <div className="card" style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAF9 100%)',
                borderColor: 'var(--color-emerald)',
                borderWidth: '2px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                  <div className="nav-logo-mark" style={{ width: '40px', height: '40px' }}>V</div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem' }}>The INTAMBWE Vision</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', fontWeight: 600 }}>PURPOSE & CHARACTER</div>
                  </div>
                </div>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                  &ldquo;To empower a generation of confident, responsible, innovative and ethical young leaders capable of transforming their communities and contributing positively to society.&rdquo;
                </p>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-forest)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.04em' }}>
                    10 Non-Negotiable Core Values
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['Integrity', 'Accountability', 'Courage', 'Inclusiveness', 'Innovation', 'Collaboration', 'Empowerment', 'Service', 'Excellence', 'Impact'].map((val) => (
                      <span key={val} className="badge badge-forest" style={{ fontSize: '0.75rem' }}>
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8 LEADERSHIP PILLARS / EXPLORE CATEGORIES */}
        <section className="section-padding" style={{ backgroundColor: 'var(--color-white)', borderTop: '1px solid var(--color-border)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 50px auto' }}>
              <span className="badge badge-emerald" style={{ marginBottom: '12px' }}>Curriculum & Categories</span>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '16px' }}>Build leadership, one skill at a time</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Choose a topic, explore practical lessons, and put new ideas into action in your school and community.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '24px'
            }}>
              {categoriesRes.rows.length > 0 ? categoriesRes.rows.map((cat) => {
                const IconComponent = ICON_MAP[cat.icon_name] || BookOpen;
                return (
                  <Link 
                    key={cat.id} 
                    href={`/explore?category=${cat.slug}`}
                    className="card card-interactive"
                    style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-success-soft)',
                      color: 'var(--color-emerald)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '18px'
                    }}>
                      <IconComponent size={24} />
                    </div>

                    <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>
                      {cat.name}
                    </h3>

                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>
                      {cat.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px solid var(--color-border-light)', paddingTop: '12px' }}>
                      <span style={{ color: 'var(--color-text-subtle)' }}>{cat.article_count} lesson{cat.article_count !== '1' ? 's' : ''}</span>
                      <span style={{ color: 'var(--color-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Learn <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                );
              }) : (
                <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                  <BookOpen size={28} style={{ color: 'var(--color-emerald)', marginBottom: '10px' }} />
                  <h3>Leadership lessons are on the way</h3>
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '6px' }}>Visit the learning library to explore available resources.</p>
                  <Link href="/explore" className="btn btn-emerald btn-sm" style={{ marginTop: '16px' }}>Explore lessons</Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* LEADERSHIP MEDIA */}
        <section className="section-padding leadership-media">
          <div className="container">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', marginBottom: '32px' }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: '10px' }}>Learn by seeing leadership in action</span>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}>Stories, ideas & moments that move us forward</h2>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '10px', maxWidth: '680px' }}>
                  Explore the conversations, shared experiences, and practical lessons that help young people lead with purpose.
                </p>
              </div>
              <Link href="/explore" className="btn btn-outline btn-sm">
                Explore all lessons <ArrowRight size={16} />
              </Link>
            </div>

            <div className="leadership-media-grid">
              <article className="leadership-video-card">
                <video controls playsInline preload="metadata" poster="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=85">
                  <source src="/meeting.mp4" type="video/mp4" />
                  Your browser does not support video playback.
                </video>
                <div className="leadership-video-caption">
                  <span className="badge badge-gold"><Video size={14} /> Leadership in action</span>
                  <h3>Listen. Learn. Lead together.</h3>
                  <p style={{ color: '#c9d4ce', fontSize: '0.9rem' }}>
                    A look inside the conversations and shared purpose that bring the INTAMBWE community together.
                  </p>
                </div>
              </article>

              <div className="leadership-story-list">
                {articlesRes.rows.slice(0, 2).map((article, index) => (
                  <Link key={article.id} href={`/explore/${article.slug}`} className="leadership-story-card">
                    <img
                      src={article.cover_image_url || (index === 0
                        ? 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=480&q=80'
                        : 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=480&q=80')}
                      alt=""
                      loading="lazy"
                    />
                    <div>
                      <span className="badge badge-emerald">{article.category_name}</span>
                      <h3>{article.title}</h3>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-emerald)', fontSize: '0.85rem', fontWeight: 700 }}>
                        {article.video_url && <Video size={15} />}
                        {article.video_url ? 'Watch & explore' : 'Read the lesson'} <ArrowRight size={15} />
                      </span>
                    </div>
                  </Link>
                ))}
                {articlesRes.rows.length === 0 && (
                  <div className="card" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=480&q=80" alt="" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                    <div>
                      <span className="badge badge-emerald">Student leadership</span>
                      <h3 style={{ margin: '8px 0' }}>Find your voice. Make an impact.</h3>
                      <Link href="/explore" style={{ color: 'var(--color-emerald)', fontWeight: 700 }}>Explore the curriculum <ArrowRight size={15} /></Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CONFERENCES SECTION (UPCOMING & PAST) */}
        <section className="section-padding">
          <div className="container">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px', gap: '20px' }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: '10px' }}>Conferences & Summits</span>
                <h2 style={{ fontSize: '2.2rem' }}>Youth Leadership in Action</h2>
              </div>
              <Link href="/conferences" className="btn btn-outline btn-sm">
                <span>View All Conferences</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* UPCOMING CONFERENCES */}
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-emerald)' }}></span>
              Upcoming Conferences
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '48px' }}>
              {upcomingMeetingsRes.rows.length > 0 ? upcomingMeetingsRes.rows.map((meeting) => (
                <div key={meeting.id} className="card" style={{ borderLeft: '4px solid var(--color-emerald)' }}>
                <img
                  className="home-conference-image"
                  src={meeting.cover_image_url || CONFERENCE_IMAGE_FALLBACK}
                  alt=""
                  loading="lazy"
                />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className="badge badge-emerald">
                      {meeting.status.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                      #{meeting.meeting_number}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
                    {meeting.title}
                  </h4>

                  <div style={{ fontSize: '0.9rem', color: 'var(--color-emerald)', fontWeight: 600, marginBottom: '12px' }}>
                    Theme: {meeting.theme}
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '18px' }}>
                    {getExcerpt(meeting.description, 150)}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-main)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} style={{ color: 'var(--color-emerald)' }} />
                      <span>{new Date(meeting.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} style={{ color: 'var(--color-emerald)' }} />
                      <span>{meeting.venue}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-light)', paddingTop: '16px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>
                      <strong>{meeting.reg_count}</strong> registered
                    </span>
                    <Link href={`/conferences/${meeting.id}`} className="btn btn-emerald btn-sm">
                      View Agenda & Register
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="card home-empty-card">
                  <div className="home-empty-icon"><Calendar size={24} /></div>
                  <div>
                    <h4>No upcoming conferences just yet</h4>
                    <p>Check back soon for new opportunities to meet, share ideas, and learn together.</p>
                    <Link href="/conferences" className="home-text-link">Explore conference updates <ArrowRight size={15} /></Link>
                  </div>
                </div>
              )}
            </div>

            {/* PREVIOUS MEETINGS */}
            {pastMeetingsRes.rows.length > 0 && (
              <>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} style={{ color: 'var(--color-gold)' }} />
                  Completed Summits & Documented Outcomes
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                  {pastMeetingsRes.rows.map((meeting) => (
                    <div key={meeting.id} className="card home-past-conference">
                      <img
                        className="home-conference-image"
                        src={meeting.cover_image_url || CONFERENCE_IMAGE_FALLBACK}
                        alt=""
                        loading="lazy"
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <span className="badge badge-forest">Completed</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>#{meeting.meeting_number}</span>
                      </div>

                      <h4 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>{meeting.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                        {meeting.summary || getExcerpt(meeting.description, 130)}
                      </p>

                      {meeting.outcomes && (
                        <div style={{ backgroundColor: 'var(--color-success-soft)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--color-forest)', marginBottom: '16px' }}>
                          <strong>Outcomes:</strong> {meeting.outcomes}
                        </div>
                      )}

                      <Link href={`/conferences/${meeting.id}`} style={{ fontSize: '0.85rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                        Read full event report & lessons →
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* FEATURED ARTICLES SECTION */}
        <section className="section-padding" style={{ backgroundColor: 'var(--color-white)', borderTop: '1px solid var(--color-border)' }}>
          <div className="container">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px', gap: '20px' }}>
              <div>
                <span className="badge badge-emerald" style={{ marginBottom: '10px' }}>Knowledge Base</span>
                <h2 style={{ fontSize: '2.2rem' }}>Featured Leadership Articles</h2>
              </div>
              <Link href="/explore" className="btn btn-outline btn-sm">
                <span>Browse All Lessons</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
              {articlesRes.rows.length > 0 ? articlesRes.rows.map((art, index) => (
                <article key={art.id} className="card card-interactive home-article-card">
                  <Link href={`/explore/${art.slug}`} className="home-article-image-link" aria-label={`Read ${art.title}`}>
                    <img
                      className="home-article-image"
                      src={art.cover_image_url || ARTICLE_IMAGE_FALLBACKS[index % ARTICLE_IMAGE_FALLBACKS.length]}
                      alt=""
                      loading="lazy"
                    />
                    {art.video_url && <span className="home-media-badge"><Video size={14} /> Video lesson</span>}
                  </Link>
                  <div className="home-article-content">
                    <span className="badge badge-gold">{art.category_name}</span>
                    <h3>
                      <Link href={`/explore/${art.slug}`}>{art.title}</Link>
                    </h3>
                    <p>{getExcerpt(art.introduction, 150)}</p>
                    <div className="home-article-meta">
                      <span>{art.reading_time_minutes} min read</span>
                      <Link href={`/explore/${art.slug}`} className="home-text-link">
                        Read lesson <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </article>
              )) : (
                <div className="card home-empty-card">
                  <div className="home-empty-icon"><BookOpen size={24} /></div>
                  <div>
                    <h3>New leadership lessons are coming soon</h3>
                    <p>Explore the curriculum and return for new stories, activities, and videos.</p>
                    <Link href="/explore" className="home-text-link">Browse the learning library <ArrowRight size={15} /></Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* COMMUNITY CALL TO ACTION */}
        <section style={{
          backgroundColor: 'var(--color-forest)',
          color: 'var(--color-white)',
          padding: '80px 0',
          textAlign: 'center'
        }}>
          <div className="container" style={{ maxWidth: '780px' }}>
            <span className="badge badge-gold" style={{ marginBottom: '16px' }}>Take Your Next Step</span>
            <h2 style={{ color: 'var(--color-white)', fontSize: '2.4rem', marginBottom: '20px' }}>
              Join the INTAMBWE Youth Leadership Movement
            </h2>
            <p style={{ color: '#d1dbd5', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '32px' }}>
              Whether you are a secondary student seeking to build your voice, an educator starting a school leadership council, or a mentor passionate about youth development, INTAMBWE provides the community and platform for your journey.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
              <Link href="/register" className="btn btn-gold btn-lg">
                Create Free Student Account
              </Link>
              <Link href="/contact" className="btn btn-outline-white btn-lg">
                Partner with Your School
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
