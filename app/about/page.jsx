import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { 
  Target, 
  Compass, 
  ShieldCheck,
  Users,
  BookOpen,
  GraduationCap,
  CalendarDays,
  HeartHandshake,
  Quote,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export const metadata = {
  title: 'About INTAMBWE | Youth Leadership in Rwanda',
  description: 'Learn about the story, founder Irakoze Sarah Divine, vision, mission, and values of the INTAMBWE Youth Leadership platform.',
};

export default async function AboutPage() {
  const currentUser = await getCurrentUser();

  const [teamRes, momentsRes] = await Promise.all([
    query('SELECT * FROM team_members WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC'),
    query('SELECT * FROM community_moments WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC')
  ]);
  const teamMembers = teamRes.rows;
  const communityMoments = momentsRes.rows;

  const values = [
    { name: 'Integrity', desc: 'Doing the right thing consistently, especially when unseen.' },
    { name: 'Accountability', desc: 'Taking full ownership of promises, actions, and mistakes.' },
    { name: 'Courage', desc: 'Speaking truth with conviction and stepping into unfamiliar challenges.' },
    { name: 'Inclusiveness', desc: 'Welcoming diverse voices, schools, and student perspectives.' },
    { name: 'Innovation', desc: 'Applying creative problem-solving to real community needs.' },
    { name: 'Collaboration', desc: 'Believing that collective wisdom surpasses individual ambition.' },
    { name: 'Empowerment', desc: 'Equipping peers with tools and confidence to lead from where they stand.' },
    { name: 'Service', desc: 'Measuring leadership not by prestige, but by lives uplifted.' },
    { name: 'Excellence', desc: 'Striving for highest quality in preparation, thought, and execution.' },
    { name: 'Impact', desc: 'Focusing on tangible, measurable improvements in our communities.' },
  ];

  const teamAreas = [
    { icon: BookOpen, name: 'Learning & curriculum', desc: 'Thoughtful leadership lessons, practical exercises, and resources that help students put ideas into practice.', color: 'green' },
    { icon: CalendarDays, name: 'Conferences & events', desc: 'Welcoming spaces where young people can meet, share perspectives, and learn together.', color: 'gold' },
    { icon: GraduationCap, name: 'Mentors & educators', desc: 'Supportive guidance that connects leadership learning with the experience of schools and communities.', color: 'blue' },
    { icon: HeartHandshake, name: 'Student community', desc: 'A growing circle of learners who encourage one another and turn shared learning into service.', color: 'rose' },
  ];

  return (
    <>
      <Navbar currentUser={currentUser} />

      <main>
        {/* HERO */}
        <section className="about-hero">
          <div className="container about-hero-inner">
            <span className="badge badge-gold">Our story · Rwanda</span>
            <p className="about-eyebrow">LEARN · THINK · CONNECT · ACT</p>
            <h1>Every step creates a leader.</h1>
            <p className="about-hero-copy">
              Intambwe means a step forward. We help young people in Rwanda grow as leaders through practical lessons, conferences, mentorship, and community action—one meaningful step at a time.
            </p>
            <div className="about-hero-actions">
              <Link href="#our-team" className="btn btn-gold">
                Meet the people behind the work <ArrowUpRight size={17} />
              </Link>
              <Link href="/explore" className="about-hero-link">Explore the learning journey</Link>
            </div>
          </div>
          <div className="about-hero-orb about-hero-orb-one" aria-hidden="true" />
          <div className="about-hero-orb about-hero-orb-two" aria-hidden="true" />
        </section>

        {/* FOUNDER & STORY */}
        <section className="section-padding about-story-section">
          <div className="container">
            <div className="about-story-grid">
              <article className="about-founder-card">
                <div className="about-founder-cover">
                  <span className="about-founder-orbit" aria-hidden="true" />
                  <Image
                    src="/about/sarah-image.jpg"
                    alt="Irakoze Sarah Divine with fellow young leaders"
                    fill
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 980px) 35vw, 40vw"
                    className="about-founder-photo"
                  />
                  <span className="about-founder-photo-shade" aria-hidden="true" />
                  <Image src="/intambwe-emblem.png" alt="INTAMBWE emblem" width={76} height={76} className="about-founder-emblem" />
                  <span className="about-founder-caption">Founder · Irakoze Sarah Divine</span>
                </div>
                <div className="about-founder-body">
                  <span className="about-section-kicker">The founder</span>
                  <h2>Irakoze Sarah Divine</h2>
                  <p className="about-founder-role">Founder &amp; Executive Director</p>
                  <p>
                    Inspired by youth leadership forums, student debate, and community engagement, Sarah founded INTAMBWE to make meaningful leadership learning more accessible to young people in Rwanda.
                  </p>
                  <p>
                    Her vision is a platform where students can build confidence, learn from one another, and practice leadership through service, collaboration, and thoughtful action.
                  </p>
                  <div className="about-founder-quote">
                    <Quote size={20} aria-hidden="true" />
                    <p>&ldquo;We do not need to wait until adulthood to contribute. When young people are taught to think deeply, listen generously, and act with integrity, their communities transform.&rdquo;</p>
                  </div>
                </div>
              </article>

              <div className="about-journey">
                <span className="badge badge-emerald">The INTAMBWE philosophy</span>
                <h2>A five-stage leadership journey</h2>
                <p className="about-journey-intro">
                  Leadership grows through practice. Each step builds on the one before it, turning ideas into positive action.
                </p>

                <div className="about-journey-list">
                  <div className="about-journey-step">
                    <div className="about-step-number">01</div>
                    <div><h3>Learn</h3><p>Build foundations in self-discipline, ethics, communication, and emotional intelligence.</p></div>
                  </div>

                  <div className="about-journey-step">
                    <div className="about-step-number">02</div>
                    <div><h3>Think</h3><p>Ask thoughtful questions, test assumptions, and understand challenges deeply.</p></div>
                  </div>

                  <div className="about-journey-step">
                    <div className="about-step-number">03</div>
                    <div><h3>Connect</h3><p>Learn with peers across schools and grow through mentorship and shared perspectives.</p></div>
                  </div>

                  <div className="about-journey-step">
                    <div className="about-step-number">04</div>
                    <div><h3>Act</h3><p>Put learning into practice through school leadership, service, and community projects.</p></div>
                  </div>

                  <div className="about-journey-step about-journey-step-final">
                    <div className="about-step-number">05</div>
                    <div><h3>Create impact</h3><p>Build lasting change through sustainable solutions and empowered peers.</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VISION & MISSION DUAL CARDS */}
        <section className="section-padding about-purpose-section">
          <div className="container">
            <div className="about-purpose-grid">
              <article className="about-purpose-card about-purpose-vision">
                <div className="about-purpose-icon"><Target size={25} /></div>
                <div>
                  <span className="about-section-kicker">Where we are going</span>
                  <h2>Our vision</h2>
                  <p>
                    To empower a generation of confident, responsible, innovative and ethical young leaders capable of transforming their communities and contributing positively to society.
                  </p>
                </div>
              </article>
              <article className="about-purpose-card about-purpose-mission">
                <div className="about-purpose-icon"><Compass size={25} /></div>
                <div>
                  <span className="about-section-kicker">What guides our work</span>
                  <h2>Our mission</h2>
                  <p>
                    To connect, educate and empower young people through leadership education, conferences, mentorship, collaboration, critical thinking and practical community engagement.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="our-team" className="section-padding about-team-section">
          <div className="container">
            <div className="about-team-heading" style={{ position: 'relative' }}>
              <span className="badge badge-gold about-team-badge">
                <Image src="/about/profile.png" alt="" width={18} height={18} />
                One community, many strengths
              </span>
              <h2>The people behind each step</h2>
              <p>
                INTAMBWE is built through collaboration. These are the leaders, mentors, and educators who bring the leadership learning journey to life across Rwanda.
              </p>
              {currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                <div style={{ marginTop: '12px' }}>
                  <Link href="/dashboard/admin" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: 'var(--color-gold)' }} />
                    <span>Manage Team Profiles in Admin Console</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="about-team-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
              {teamMembers.length > 0 ? teamMembers.map((member) => (
                <article 
                  className="card" 
                  key={member.id} 
                  style={{ 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    transition: 'transform 240ms ease, box-shadow 240ms ease',
                    border: '1px solid rgba(20, 36, 56, 0.09)'
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '260px', backgroundColor: '#0f1e2f', overflow: 'hidden' }}>
                    <img
                      src={member.image_url || '/about/profile.png'}
                      alt={member.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px' }}>
                      <span className="badge badge-gold" style={{ fontSize: '0.74rem', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest)', marginBottom: '8px' }}>
                      {member.name}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6, flex: 1 }}>
                      {member.bio}
                    </p>
                  </div>
                </article>
              )) : teamAreas.map(({ icon: Icon, name, desc, color }, index) => (
                <article className={`about-team-card about-team-${color}`} key={name}>
                  <div className="about-team-card-top">
                    <span className="about-team-icon"><Icon size={23} /></span>
                    <span className="about-team-index">0{index + 1}</span>
                  </div>
                  <h3>{name}</h3>
                  <p>{desc}</p>
                  <span className="about-team-accent" aria-hidden="true" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding about-community-section">
          <div className="container">
            <div className="about-community-header" style={{ position: 'relative' }}>
              <span className="badge badge-gold">Community moments</span>
              <h2>Good company, meaningful learning, and joyful growth</h2>
              <p style={{ color: 'var(--color-text-muted)', maxWidth: '640px', margin: '8px auto 0 auto' }}>
                Stories, shared lessons, and vibrant memories from leadership summits and student assemblies.
              </p>
              {currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                <div style={{ marginTop: '12px' }}>
                  <Link href="/dashboard/admin" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: 'var(--color-gold)' }} />
                    <span>Manage Moments in Admin Console</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="about-community-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', marginTop: '36px' }}>
              {communityMoments.map((moment) => (
                <article 
                  className="card" 
                  key={moment.id} 
                  style={{ 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid rgba(20, 36, 56, 0.08)'
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '240px', overflow: 'hidden' }}>
                    <img
                      src={moment.image_url || '/about/group-photo.jpg'}
                      alt={moment.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span className="about-section-kicker" style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Moments that matter
                    </span>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest)', marginBottom: '10px' }}>
                      {moment.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '16px', flex: 1 }}>
                      {moment.description}
                    </p>
                    {moment.author_quote && (
                      <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-success-soft)', borderRadius: '8px', borderLeft: '3px solid var(--color-emerald)', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-forest)' }}>
                        &ldquo;{moment.author_quote}&rdquo;
                        {moment.author_name && <div style={{ fontStyle: 'normal', fontWeight: 700, marginTop: '4px', fontSize: '0.78rem' }}>— {moment.author_name}</div>}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 10 CORE VALUES GRID */}
        <section className="section-padding about-values-section">
          <div className="container">
            <div className="about-values-heading">
              <span className="badge badge-emerald">Guiding compass</span>
              <h2>Our 10 core values</h2>
              <p>
                These values define who we are, how we treat one another, and the standards we hold for every student leader.
              </p>
            </div>

            <div className="about-values-grid">
              {values.map((v, i) => (
                <article key={v.name} className="about-value-card">
                  <div className="about-value-number">
                    0{i + 1}
                  </div>
                  <h3>{v.name}</h3>
                  <p>
                    {v.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SCHOOL PARTNERSHIP CTA */}
        <section className="about-partnership">
          <div className="container about-partnership-inner">
            <span className="badge badge-gold">Take the next step</span>
            <h2>
              Bring INTAMBWE to Your School
            </h2>
            <p>
              Are you a principal, dean, teacher, or student council representative? Join our expanding network of partner secondary schools across Kigali and Rwanda.
            </p>
            <Link href="/contact" className="btn btn-gold btn-lg">
              Start a conversation <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
