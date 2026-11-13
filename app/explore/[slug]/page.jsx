import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { 
  Clock, 
  User, 
  Calendar, 
  ArrowLeft, 
  Target, 
  Brain, 
  CheckCircle2, 
  HelpCircle, 
  BookMarked,
  Sparkles,
  Share2,
  Video
} from 'lucide-react';
import ReflectionSubmitBox from './ReflectionSubmitBox';
import MarkCompletedButton from './MarkCompletedButton';
import LessonProgressBox from '@/components/LessonProgressBox';

export const revalidate = 0;

function getEmbedUrl(videoUrl) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    }

    if (host === 'youtube.com') {
      const videoId = url.searchParams.get('v');
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }

    if (host === 'vimeo.com' && /^\d+$/.test(url.pathname.slice(1))) {
      return `https://player.vimeo.com/video/${url.pathname.slice(1)}`;
    }
  } catch {
    return videoUrl;
  }

  return videoUrl;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const res = await query('SELECT title, introduction FROM articles WHERE slug = $1', [slug]);
  if (res.rows.length === 0) return { title: 'Lesson Not Found' };
  return {
    title: `${res.rows[0].title} | INTAMBWE Leadership`,
    description: res.rows[0].introduction.slice(0, 160),
  };
}

export default async function ArticleDetailPage({ params }) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();

  const res = await query(
    `SELECT a.*,
            ac.name as category_name, ac.slug as category_slug,
            u.full_name as author_name
     FROM articles a
     JOIN article_categories ac ON a.category_id = ac.id
     LEFT JOIN users u ON a.author_id = u.id
     WHERE a.slug = $1 AND a.status = 'published'`,
    [slug]
  );

  if (res.rows.length === 0) {
    notFound();
  }

  const article = res.rows[0];

  if (currentUser?.role === 'student') {
    await query(
      `INSERT INTO student_article_views (user_id, article_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, article_id)
       DO UPDATE SET view_count = student_article_views.view_count + 1,
                     last_viewed_at = NOW()`,
      [currentUser.id, article.id]
    );
  }

  // Check if current user has marked as completed
  let isCompleted = false;
  if (currentUser) {
    const compRes = await query(
      'SELECT id FROM student_learning_progress WHERE user_id = $1 AND article_id = $2',
      [currentUser.id, article.id]
    );
    isCompleted = compRes.rows.length > 0;
  }

  // Course progression and next lesson stats
  let courseStats = null;
  let nextLesson = null;
  let cert = null;
  if (currentUser && article.category_id) {
    const statsRes = await query(
      `SELECT COUNT(a.id)::int AS total,
              COUNT(p.id)::int AS completed
       FROM articles a
       LEFT JOIN student_learning_progress p ON p.article_id = a.id AND p.user_id = $1
       WHERE a.category_id = $2 AND a.status = 'published'`,
      [currentUser.id, article.category_id]
    );
    const total = statsRes.rows[0]?.total || 0;
    const completed = statsRes.rows[0]?.completed || 0;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    courseStats = { total, completed, percent, allCompleted: total > 0 && completed >= total };

    const nextRes = await query(
      `SELECT a.id, a.title, a.slug
       FROM articles a
       LEFT JOIN student_learning_progress p ON p.article_id = a.id AND p.user_id = $1
       WHERE a.category_id = $2 AND a.status = 'published' AND a.id != $3 AND p.id IS NULL
       ORDER BY a.sort_order ASC, a.id ASC
       LIMIT 1`,
      [currentUser.id, article.category_id, article.id]
    );
    if (nextRes.rows.length > 0) nextLesson = nextRes.rows[0];

    const certRes = await query(
      `SELECT * FROM certificates WHERE user_id = $1 AND category_id = $2`,
      [currentUser.id, article.category_id]
    );
    if (certRes.rows.length > 0) cert = certRes.rows[0];
  }

  // All lessons in this course track for sidebar navigation
  const courseLessonsRes = await query(
    `SELECT a.id, a.title, a.slug, a.reading_time_minutes, a.sort_order,
            BOOL_OR(p.id IS NOT NULL) AS is_completed
     FROM articles a
     LEFT JOIN student_learning_progress p ON p.article_id = a.id AND p.user_id = $1
     WHERE a.category_id = $2 AND a.status = 'published'
     GROUP BY a.id, a.title, a.slug, a.reading_time_minutes, a.sort_order
     ORDER BY a.sort_order ASC, a.id ASC`,
    [currentUser?.id || null, article.category_id]
  );
  const courseLessons = courseLessonsRes.rows;
  const currentLessonIndex = courseLessons.findIndex((l) => Number(l.id) === Number(article.id));
  const prevLesson = currentLessonIndex > 0 ? courseLessons[currentLessonIndex - 1] : null;
  const nextLessonInCourse = currentLessonIndex !== -1 && currentLessonIndex < courseLessons.length - 1 
    ? courseLessons[currentLessonIndex + 1] 
    : null;


  // Related articles
  const relatedRes = await query(
    `SELECT a.id, a.title, a.slug, a.reading_time_minutes, ac.name as category_name
     FROM articles a
     JOIN article_categories ac ON a.category_id = ac.id
     WHERE a.category_id = $1 AND a.id != $2 AND a.status = 'published'
     LIMIT 3`,
    [article.category_id, article.id]
  );

  return (
    <>
      <Navbar currentUser={currentUser} />

      <main style={{ backgroundColor: 'var(--color-bg-soft)', minHeight: '100vh', paddingBottom: '80px' }}>
        {/* BREADCRUMB / HERO */}
        <section style={{ backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', padding: '50px 0 40px 0' }}>
          <div className="container" style={{ maxWidth: '1200px' }}>
            <Link 
              href="/explore" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#b9c7bf', fontSize: '0.9rem', marginBottom: '20px' }}
            >
              <ArrowLeft size={16} />
              <span>Back to all leadership lessons</span>
            </Link>

            <div style={{ marginBottom: '14px' }}>
              <span className="badge badge-gold">{article.category_name}</span>
            </div>

            <h1 style={{ color: 'var(--color-white)', fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.25, marginBottom: '20px' }}>
              {article.title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.88rem', color: '#b9c7bf' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} style={{ color: 'var(--color-gold)' }} />
                  <span>{article.author_name || 'INTAMBWE Faculty'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} style={{ color: 'var(--color-gold)' }} />
                  <span>{article.reading_time_minutes} min read</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} style={{ color: 'var(--color-gold)' }} />
                  <span>{new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {currentUser && (
                <MarkCompletedButton 
                  articleId={article.id} 
                  initialCompleted={isCompleted} 
                  isLoggedIn={true} 
                />
              )}
            </div>
          </div>
        </section>

        {/* QUICK LESSON NAVIGATION BAR */}
        {courseLessons.length > 1 && (
          <div style={{ backgroundColor: '#F3F8F5', borderBottom: '1px solid var(--color-border)', padding: '12px 0' }}>
            <div className="container" style={{ maxWidth: '1200px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <span className="badge badge-emerald" style={{ fontSize: '0.74rem' }}>{article.category_name}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  Lesson {currentLessonIndex !== -1 ? currentLessonIndex + 1 : 1} of {courseLessons.length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {prevLesson ? (
                  <Link href={`/explore/${prevLesson.slug}`} className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                    ← Prev: {prevLesson.title.slice(0, 24)}…
                  </Link>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', padding: '4px 8px' }}>First Lesson</span>
                )}
                {nextLessonInCourse ? (
                  <Link href={`/explore/${nextLessonInCourse.slug}`} className="btn btn-emerald btn-sm" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                    Next: {nextLessonInCourse.title.slice(0, 24)}… →
                  </Link>
                ) : (
                  <span className="badge badge-gold" style={{ fontSize: '0.74rem' }}>Final Step 🏆</span>
                )}
              </div>
            </div>
          </div>
        )}


        {/* MAIN LESSON 2-COLUMN LAYOUT */}
        <div className="container" style={{ maxWidth: '1200px', marginTop: '36px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '32px', alignItems: 'flex-start' }} className="lesson-grid-responsive">
            
            {/* LEFT MAIN CONTENT */}
            <div style={{ minWidth: 0 }}>
          
          {/* COVER IMAGE */}
          {article.cover_image_url && (
            <div style={{ marginBottom: '32px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', maxHeight: '420px', boxShadow: 'var(--shadow-md)' }}>
              <img 
                src={article.cover_image_url} 
                alt={article.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
              />
            </div>
          )}

          {/* VIDEO EMBED */}
          {article.video_url && (
            <div className="card" style={{ marginBottom: '32px', padding: '16px', backgroundColor: '#12261c', borderRadius: 'var(--radius-lg)' }}>
              {/\.(mp4|webm|ogg)(\?.*)?$/i.test(article.video_url) || article.video_url.startsWith('/') ? (
                <video controls playsInline preload="metadata" poster={article.cover_image_url || undefined} style={{ display: 'block', width: '100%', maxHeight: '560px', background: '#07121d', borderRadius: 'var(--radius-md)' }}>
                  <source src={article.video_url} />
                  Your browser does not support video playback.
                </video>
              ) : (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
                  <iframe
                    src={getEmbedUrl(article.video_url)}
                    title={article.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              )}
              <div style={{ padding: '10px 8px 4px 8px', color: '#b9c7bf', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={16} style={{ color: 'var(--color-gold)' }} />
                <span>Featured Video Masterclass & Keynote Insights</span>
              </div>
            </div>
          )}

          {/* INTRODUCTION BOX */}
          <div className="card" style={{ marginBottom: '32px', backgroundColor: '#FFFFFF', borderLeft: '4px solid var(--color-emerald)' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-emerald)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} />
              <span>Lesson Introduction</span>
            </h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--color-text-main)', lineHeight: 1.7, fontStyle: 'italic' }}>
              {article.introduction}
            </p>
          </div>

          {/* LEARNING OBJECTIVES */}
          {article.learning_objectives && (
            <div className="card" style={{ marginBottom: '32px', backgroundColor: '#F9FCFA' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} style={{ color: 'var(--color-emerald)' }} />
                <span>Learning Objectives</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {article.learning_objectives.split('\n').filter(Boolean).map((obj, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.95rem', color: 'var(--color-charcoal)' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--color-emerald)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{obj.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DETAILED CONTENT */}
          <div className="card" style={{ marginBottom: '32px', padding: '36px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '20px', color: 'var(--color-forest)' }}>
              Core Leadership Framework & Analysis
            </h3>
            <div style={{
              fontSize: '1.05rem',
              lineHeight: 1.8,
              color: '#26332C',
              whiteSpace: 'pre-line'
            }}>
              {article.content}
            </div>
          </div>

          {/* PRACTICAL EXERCISES */}
          {article.practical_exercises && (
            <div className="card" style={{ marginBottom: '32px', borderLeft: '4px solid var(--color-gold)', backgroundColor: '#FFFFFF' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '14px', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookMarked size={22} style={{ color: 'var(--color-gold)' }} />
                <span>Practical Exercise for Student Leaders</span>
              </h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-text-main)' }}>
                {article.practical_exercises}
              </p>
            </div>
          )}

          {/* CRITICAL THINKING QUESTIONS */}
          {article.critical_thinking_questions && (
            <div className="card" style={{ marginBottom: '32px', backgroundColor: '#F8FAF9' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={22} style={{ color: 'var(--color-emerald)' }} />
                <span>Critical Thinking & Ethical Reflection Questions</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {article.critical_thinking_questions.split('\n').filter(Boolean).map((q, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                    <HelpCircle size={18} style={{ color: 'var(--color-emerald)', flexShrink: 0, marginTop: '3px' }} />
                    <span style={{ fontWeight: 500 }}>{q.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REFLECTION ACTIVITY & JOURNAL SUBMISSION */}
          <div className="card" style={{ marginBottom: '40px', backgroundColor: '#FFFFFF', border: '2px solid var(--color-forest)' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '12px', color: 'var(--color-forest)' }}>
              Personal Reflection Activity
            </h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              {article.reflection_activity || 'Reflect on how this leadership principle applies to your daily life and school council duties. Write your reflection below to preserve it in your private leadership journal.'}
            </p>

            <ReflectionSubmitBox 
              articleTitle={article.title} 
              isLoggedIn={!!currentUser} 
            />
          </div>

          {/* STEP KNOWLEDGE CHECK & PROGRESS TRACKER */}
          <LessonProgressBox 
            articleId={article.id}
            articleTitle={article.title}
            categoryName={article.category_name}
            categoryId={article.category_id}
            initialCompleted={isCompleted}
            initialCourseStats={courseStats}
            isLoggedIn={!!currentUser}
            initialCertificate={cert}
            nextLesson={nextLesson}
            quizQuestion={article.quiz_question}
            quizOptions={article.quiz_options}
            quizCorrectIndex={article.quiz_correct_index}
            quizExplanation={article.quiz_explanation}
          />

          {/* RELATED ARTICLES */}
          {relatedRes.rows.length > 0 && (
            <div style={{ marginTop: '50px' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>
                Related Leadership Lessons in {article.category_name}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {relatedRes.rows.map((rel) => (
                  <Link key={rel.id} href={`/explore/${rel.slug}`} className="card card-interactive">
                    <span className="badge badge-gold" style={{ marginBottom: '8px', fontSize: '0.75rem' }}>{rel.category_name}</span>
                    <h4 style={{ fontSize: '1.05rem', marginBottom: '8px', color: 'var(--color-forest)' }}>{rel.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>{rel.reading_time_minutes} min read</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
                    </div>
            {/* END LEFT MAIN CONTENT */}

            {/* RIGHT SIDEBAR: COURSE INDEX & PROGRESS (STICKY & REACHES BOTTOM) */}
            <aside style={{
              position: 'sticky',
              top: '85px',
              maxHeight: 'calc(100vh - 105px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              paddingRight: '4px'
            }} className="lesson-right-sidebar">

              {/* COURSE PROGRESS CARD */}
              <div className="card" style={{ borderTop: '4px solid var(--color-gold)', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge badge-emerald" style={{ fontSize: '0.74rem' }}>{article.category_name}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                    {courseLessons.length} {courseLessons.length === 1 ? 'Lesson' : 'Lessons'}
                  </span>
                </div>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--color-forest)', marginBottom: '10px' }}>
                  Course Track Progress
                </h4>

                {courseStats ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Completion</span>
                      <strong style={{ color: courseStats.allCompleted ? 'var(--color-gold)' : 'var(--color-forest)' }}>
                        {courseStats.completed} of {courseStats.total} ({courseStats.percent}%)
                      </strong>
                    </div>
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(20, 36, 56, 0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, courseStats.percent)}%`,
                        background: 'linear-gradient(90deg, #176B52 0%, #C99B43 100%)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                    {courseStats.allCompleted && (
                      <div style={{ padding: '8px 10px', backgroundColor: 'var(--color-success-soft)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--color-forest)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🏆</span> Course Completed!
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    Sign in to track completed lessons and claim your course certificate.
                  </p>
                )}
              </div>

              {/* LESSON INDEX: CLICK AND GO TO LOOK IN ANOTHER (NOT BELOW) */}
              <div className="card" style={{ borderLeft: '4px solid var(--color-emerald)', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--color-forest)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookMarked size={17} style={{ color: 'var(--color-emerald)' }} />
                    <span>In This Course</span>
                  </h4>
                  <Link href={`/courses/${article.category_id}`} style={{ fontSize: '0.76rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                    Overview →
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {courseLessons.map((l, idx) => {
                    const isCurrent = Number(l.id) === Number(article.id);
                    return (
                      <Link
                        key={l.id}
                        href={`/explore/${l.slug}`}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: isCurrent ? 'rgba(201, 155, 67, 0.12)' : '#F9FCFA',
                          border: isCurrent ? '1px solid var(--color-gold)' : '1px solid var(--color-border-light)',
                          textDecoration: 'none',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: isCurrent ? 'var(--color-forest)' : 'var(--color-text-subtle)',
                          width: '18px',
                          flexShrink: 0,
                          paddingTop: '2px'
                        }}>
                          0{idx + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.85rem',
                            fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent ? 'var(--color-forest)' : 'var(--color-text-main)',
                            lineHeight: 1.3,
                            marginBottom: '3px'
                          }}>
                            {l.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>
                            <span>{l.reading_time_minutes}m read</span>
                            {isCurrent && (
                              <span style={{ color: 'var(--color-gold-hover)', fontWeight: 700 }}>· Active</span>
                            )}
                          </div>
                        </div>
                        {l.is_completed && (
                          <CheckCircle2 size={15} style={{ color: 'var(--color-emerald)', flexShrink: 0, marginTop: '2px' }} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* QUICK SHORTCUTS & RESOURCES */}
              <div className="card" style={{ backgroundColor: '#F8FAF9' }}>
                <h5 style={{ fontSize: '0.88rem', color: 'var(--color-forest)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Leader Toolkit
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                  <Link href="/community" style={{ color: 'var(--color-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} /> Share an idea on Community Wall
                  </Link>
                  <Link href="/conferences" style={{ color: 'var(--color-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Upcoming Leadership Summits
                  </Link>
                  {currentUser && (
                    <Link href="/dashboard/student" style={{ color: 'var(--color-forest)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Brain size={14} /> My Private Leadership Journal
                    </Link>
                  )}
                </div>
              </div>

            </aside>
            {/* END RIGHT SIDEBAR */}

          </div>
        </div>
        {/* END MAIN LESSON 2-COLUMN LAYOUT */}

      </main>

      <Footer />
    </>
  );
}
