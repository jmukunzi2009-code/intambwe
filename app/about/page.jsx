import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { 
  ShieldCheck, 
  Target, 
  Compass, 
  Award, 
  Users, 
  Lightbulb, 
  HeartHandshake, 
  Sparkles, 
  ArrowRight,
  BookOpen
} from 'lucide-react';

export const metadata = {
  title: 'About INTAMBWE | Youth Leadership in Rwanda',
  description: 'Learn about the story, founder Irakoze Sarah Divine, vision, mission, and values of the INTAMBWE Youth Leadership platform.',
};

export default async function AboutPage() {
  const currentUser = await getCurrentUser();

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

  return (
    <>
      <Navbar currentUser={currentUser} />

      <main>
        {/* HERO */}
        <section style={{
          backgroundColor: 'var(--color-forest)',
          color: 'var(--color-white)',
          padding: '80px 0 60px 0',
          position: 'relative'
        }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: '840px' }}>
            <span className="badge badge-gold" style={{ marginBottom: '16px' }}>Who We Are</span>
            <h1 style={{ color: 'var(--color-white)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', marginBottom: '20px' }}>
              Every Step Creates a Leader
            </h1>
            <p style={{ fontSize: '1.15rem', color: '#d1dbd5', lineHeight: 1.6 }}>
              INTAMBWE is a Rwandan youth leadership initiative founded by Irakoze Sarah Divine to inspire, educate, and empower young minds to lead with integrity, critical reasoning, and community purpose.
            </p>
          </div>
        </section>

        {/* FOUNDER & STORY */}
        <section className="section-padding">
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '50px', alignItems: 'center' }}>
              <div className="card" style={{
                backgroundColor: 'var(--color-white)',
                borderColor: 'var(--color-gold)',
                borderWidth: '2px',
                padding: '36px'
              }}>
                <span className="badge badge-gold" style={{ marginBottom: '14px' }}>Founder&apos;s Journey</span>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '12px', color: 'var(--color-forest)' }}>
                  Irakoze Sarah Divine
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-emerald)', fontWeight: 600, marginBottom: '18px' }}>
                  Founder & Executive Director, INTAMBWE
                </div>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
                  During her international exposure and experiences exploring youth leadership models in the United States, Rwandan young woman <strong>Irakoze Sarah Divine</strong> witnessed firsthand the power of structured leadership forums, student debate, and community engagement.
                </p>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '20px' }}>
                  Returning with an unyielding conviction that Rwandan youth possess unmatched resilience and ingenuity, she founded INTAMBWE to ensure every student—regardless of background or school—has access to leadership training, ethical mentorship, and collaborative inter-school platforms.
                </p>
                <div style={{
                  padding: '14px 18px',
                  backgroundColor: 'var(--color-gold-soft)',
                  borderLeft: '4px solid var(--color-gold)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                  fontStyle: 'italic',
                  color: 'var(--color-forest-dark)'
                }}>
                  &ldquo;We do not need to wait until adulthood to contribute. When young people are taught to think deeply, listen generously, and act with integrity, their communities transform.&rdquo;
                </div>
              </div>

              <div>
                <span className="badge badge-emerald" style={{ marginBottom: '12px' }}>The Philosophy</span>
                <h2 style={{ fontSize: '2.2rem', marginBottom: '20px' }}>
                  A Five-Stage Leadership Journey
                </h2>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
                  At INTAMBWE, we do not believe leadership can be memorized from a textbook. Real leadership develops through a continuous, deliberate cycle:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>1</div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>LEARN</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Acquire timeless principles of self-discipline, ethics, communication, and emotional intelligence.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>2</div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>THINK</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Cultivate rigorous critical reasoning, examine assumptions, and analyze community problems deeply.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>3</div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>CONNECT</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Bridge across secondary schools, establish peer coalitions, and learn from experienced mentors.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>4</div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>ACT</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Step up in school councils, launch youth-led community projects, and model integrity.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-gold)', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>5</div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', marginBottom: '4px', color: 'var(--color-forest)' }}>CREATE IMPACT</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Leave an enduring legacy through sustainable community solutions and inspired peers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VISION & MISSION DUAL CARDS */}
        <section className="section-padding" style={{ backgroundColor: 'var(--color-white)', borderTop: '1px solid var(--color-border)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              <div className="card" style={{ borderLeft: '4px solid var(--color-gold)', padding: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Target size={28} style={{ color: 'var(--color-gold)' }} />
                  <h3 style={{ fontSize: '1.4rem' }}>Our Vision</h3>
                </div>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: '1.05rem' }}>
                  To empower a generation of confident, responsible, innovative and ethical young leaders capable of transforming their communities and contributing positively to society.
                </p>
              </div>

              <div className="card" style={{ borderLeft: '4px solid var(--color-emerald)', padding: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Compass size={28} style={{ color: 'var(--color-emerald)' }} />
                  <h3 style={{ fontSize: '1.4rem' }}>Our Mission</h3>
                </div>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: '1.05rem' }}>
                  To connect, educate and empower young people through leadership education, conferences, mentorship, collaboration, critical thinking and practical community engagement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 10 CORE VALUES GRID */}
        <section className="section-padding">
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 48px auto' }}>
              <span className="badge badge-emerald" style={{ marginBottom: '12px' }}>Guiding Compass</span>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '14px' }}>Our 10 Core Values</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>
                These values define who we are, how we treat one another, and the standards we hold for every student leader.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {values.map((v, i) => (
                <div key={v.name} className="card" style={{ padding: '24px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-gold)', marginBottom: '8px' }}>
                    0{i + 1}
                  </div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{v.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SCHOOL PARTNERSHIP CTA */}
        <section style={{ backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', padding: '70px 0', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: '720px' }}>
            <h2 style={{ color: 'var(--color-white)', fontSize: '2rem', marginBottom: '16px' }}>
              Bring INTAMBWE to Your School
            </h2>
            <p style={{ color: '#d1dbd5', lineHeight: 1.6, marginBottom: '28px' }}>
              Are you a principal, dean, teacher, or student council representative? Join our expanding network of partner secondary schools across Kigali and Rwanda.
            </p>
            <Link href="/contact" className="btn btn-gold btn-lg">
              Initiate a School Partnership
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
