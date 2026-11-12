import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Lock, Play, Sparkles } from 'lucide-react';
import StartCourseButton from './StartCourseButton';
import styles from './course.module.css';

export const revalidate = 0;

function getEmbedUrl(videoUrl) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
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
  const { id } = await params;
  const result = await query('SELECT name, description FROM article_categories WHERE id = $1', [id]);
  if (result.rows.length === 0) return { title: 'Course Not Found' };
  return {
    title: `${result.rows[0].name} | INTAMBWE Courses`,
    description: result.rows[0].description || `Study ${result.rows[0].name} with INTAMBWE.`,
  };
}

export default async function CourseDetailPage({ params }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const courseResult = await query(
    `SELECT ac.*,
            COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'published')::int AS lesson_count
     FROM article_categories ac
     LEFT JOIN articles a ON a.category_id = ac.id
     WHERE ac.id = $1
     GROUP BY ac.id`,
    [id]
  );
  const course = courseResult.rows[0];
  if (!course || (course.status !== 'published' && !['admin', 'super_admin', 'content_editor'].includes(currentUser?.role))) {
    notFound();
  }

  const lessonsResult = await query(
    `SELECT a.id, a.title, a.slug, a.introduction, a.reading_time_minutes,
            a.cover_image_url, a.video_url, a.status, a.sort_order
     FROM articles a
     WHERE a.category_id = $1 AND a.status = 'published'
     ORDER BY a.sort_order ASC, a.created_at ASC, a.id ASC`,
    [id]
  );

  let enrolled = false;
  let completedIds = new Set();
  if (currentUser?.role === 'student') {
    const [enrollmentResult, completedResult] = await Promise.all([
      query('SELECT id FROM course_enrollments WHERE user_id = $1 AND category_id = $2', [currentUser.id, id]),
      query(
        `SELECT p.article_id
         FROM student_learning_progress p
         JOIN articles a ON a.id = p.article_id AND a.category_id = $2 AND a.status = 'published'
         WHERE p.user_id = $1`,
        [currentUser.id, id]
      ),
    ]);
    enrolled = enrollmentResult.rows.length > 0;
    completedIds = new Set(completedResult.rows.map((row) => Number(row.article_id)));
  }

  const lessonCount = lessonsResult.rows.length;
  const completedCount = completedIds.size;
  const progress = lessonCount ? Math.round((completedCount / lessonCount) * 100) : 0;
  const canStudy = enrolled || ['admin', 'super_admin', 'content_editor'].includes(currentUser?.role);
  const isVideoFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(course.video_url || '') || (course.video_url || '').startsWith('/');

  return (
    <>
      <Navbar currentUser={currentUser} />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <Link href="/explore" className={styles.backLink}><ArrowLeft size={16} /> All leadership courses</Link>
            <span className="badge badge-gold">{lessonCount} guided {lessonCount === 1 ? 'lesson' : 'lessons'}</span>
            <h1>{course.name}</h1>
            <p>{course.description || 'A step-by-step leadership course. Explore the lessons and build practical skills at your own pace.'}</p>
            <div className={styles.heroActions}>
              {currentUser?.role === 'student' && enrolled ? (
                <span className="badge badge-emerald"><CheckCircle2 size={15} /> Course started · {completedCount}/{lessonCount} lessons complete</span>
              ) : currentUser?.role === 'student' ? (
                <StartCourseButton courseId={course.id} />
              ) : !currentUser ? (
                <div className={styles.authActions}>
                  <Link className="btn btn-gold btn-lg" href={`/login?redirect=/courses/${course.id}`}>Sign in to start</Link>
                  <Link className="btn btn-outline-white" href={`/register?redirect=/courses/${course.id}`}>Create student account</Link>
                </div>
              ) : (
                <span className="badge badge-emerald"><BookOpen size={15} /> Staff course preview</span>
              )}
            </div>
          </div>
        </section>

        <div className={`container ${styles.content}`}>
          <div className={styles.courseLayout}>
            <section className={styles.lessonSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <span className="badge badge-emerald">Learn step by step</span>
                  <h2>Your course lessons</h2>
                  <p>Lessons are arranged in order. Complete each one to update your course progress.</p>
                </div>
                {canStudy && lessonCount > 0 && (
                  <div className={styles.progressSummary}>
                    <strong>{progress}%</strong>
                    <span>{completedCount} of {lessonCount} complete</span>
                  </div>
                )}
              </div>

              {lessonCount === 0 ? (
                <div className={styles.emptyLessons}>
                  <BookOpen size={30} />
                  <h3>Lessons are being prepared</h3>
                  <p>This course will appear here as soon as the first lesson is published.</p>
                </div>
              ) : (
                <ol className={styles.lessonList}>
                  {lessonsResult.rows.map((lesson, index) => {
                    const complete = completedIds.has(Number(lesson.id));
                    const lessonContent = (
                      <>
                        <span className={styles.lessonNumber}>{complete ? <CheckCircle2 size={19} /> : String(index + 1).padStart(2, '0')}</span>
                        {lesson.cover_image_url && <img className={styles.lessonImage} src={lesson.cover_image_url} alt="" />}
                        <span className={styles.lessonCopy}>
                          <strong>{lesson.title}</strong>
                          <span>{lesson.introduction}</span>
                          <small><Clock size={13} /> {lesson.reading_time_minutes || 5} min {lesson.video_url && <><span>·</span><Play size={13} /> Video</>}</small>
                        </span>
                        {!canStudy && <Lock size={17} className={styles.lessonLock} aria-label="Start the course to study this lesson" />}
                        {canStudy && <ArrowRight size={17} className={styles.lessonArrow} />}
                      </>
                    );

                    return (
                      <li key={lesson.id} className={`${styles.lessonItem} ${complete ? styles.lessonComplete : ''}`}>
                        {canStudy ? (
                          <Link href={`/explore/${lesson.slug}`} className={styles.lessonLink}>{lessonContent}</Link>
                        ) : (
                          <div className={styles.lessonLocked}>{lessonContent}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <aside className={styles.courseAside}>
              {course.cover_image_url && <img className={styles.courseCover} src={course.cover_image_url} alt={`${course.name} course cover`} />}
              <div className="card">
                <span className="badge badge-gold"><Sparkles size={14} /> Your learning path</span>
                <h3>Learn. Practice. Reflect.</h3>
                <p>Each lesson includes clear ideas, practical activities, and a private reflection space. Your completion progress is saved to your student dashboard.</p>
                <ul>
                  <li><CheckCircle2 size={16} /> Study lessons in order</li>
                  <li><CheckCircle2 size={16} /> Save progress as you learn</li>
                  <li><CheckCircle2 size={16} /> Reflect privately in your journal</li>
                </ul>
                {enrolled && <Link href="/dashboard/student" className="btn btn-outline btn-sm">Go to my dashboard <ArrowRight size={14} /></Link>}
              </div>
              {course.video_url && (
                <div className={styles.videoCard}>
                  <h3><Play size={16} /> Course introduction</h3>
                  {isVideoFile ? (
                    <video controls playsInline preload="metadata" poster={course.cover_image_url || undefined}>
                      <source src={course.video_url} />
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div className={styles.videoFrame}>
                      <iframe src={getEmbedUrl(course.video_url)} title={`${course.name} introduction`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
