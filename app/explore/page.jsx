import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { ArrowRight, BookOpen, Clock, Search, Video } from 'lucide-react';

export const metadata = {
  title: 'Leadership Courses | INTAMBWE Curriculum',
  description: 'Explore leadership courses, study lessons step by step, practice new skills, and reflect on your growth.',
};

export const revalidate = 0;

export default async function ExplorePage({ searchParams }) {
  const resolvedParams = await searchParams;
  const selectedCategory = resolvedParams?.category || '';
  const searchQuery = String(resolvedParams?.q || '').trim();
  const currentUser = await getCurrentUser();

  const coursesRes = await query(
    `SELECT ac.id, ac.name, ac.slug, ac.description, ac.icon_name, ac.cover_image_url, ac.video_url,
            ac.status, COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'published')::int AS lesson_count,
            COUNT(DISTINCT p.article_id)::int AS completed_lessons
     FROM article_categories ac
     LEFT JOIN articles a ON a.category_id = ac.id
     LEFT JOIN student_learning_progress p
       ON p.article_id = a.id AND p.user_id = $1 AND a.status = 'published'
     WHERE ac.status = 'published'
     GROUP BY ac.id
     ORDER BY ac.id ASC`,
    [currentUser?.role === 'student' ? currentUser.id : null]
  );
  const allCourses = coursesRes.rows;
  const categories = allCourses;
  const courses = allCourses.filter((course) => {
    const matchesCategory = !selectedCategory || course.slug === selectedCategory;
    const searchable = `${course.name} ${course.description || ''}`.toLowerCase();
    return matchesCategory && (!searchQuery || searchable.includes(searchQuery.toLowerCase()));
  });

  return (
    <>
      <Navbar currentUser={currentUser} />
      <main>
        <section style={{ backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', padding: '70px 0 50px' }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: '850px' }}>
            <span className="badge badge-gold" style={{ marginBottom: '14px' }}>Leadership learning paths</span>
            <h1 style={{ color: 'var(--color-white)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', marginBottom: '16px' }}>
              Choose a course. Grow one lesson at a time.
            </h1>
            <p style={{ color: '#d1dbd5', fontSize: '1.1rem', lineHeight: 1.7 }}>
              Explore courses designed for student leaders. Preview the course, sign in to start learning, then work through its lessons and track your progress from your dashboard.
            </p>
          </div>
        </section>

        <section className="course-catalog-tools">
          <div className="container">
            <form method="GET" action="/explore" className="course-search">
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search courses and leadership topics"
                className="form-input"
              />
              {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
              <button type="submit" className="btn btn-primary"><Search size={17} /> Search</button>
            </form>

            <div className="course-category-filters" aria-label="Filter courses by category">
              <Link href="/explore" className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`}>All courses</Link>
              {categories.map((course) => (
                <Link
                  key={course.id}
                  href={`/explore?category=${encodeURIComponent(course.slug)}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
                  className={`btn btn-sm ${selectedCategory === course.slug ? 'btn-primary' : 'btn-outline'}`}
                >
                  {course.name} <span>({course.lesson_count})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding">
          <div className="container">
            {courses.length === 0 ? (
              <div className="card course-catalog-empty">
                <BookOpen size={42} />
                <h2>No courses found</h2>
                <p>Try another search or choose a different course category.</p>
                <Link href="/explore" className="btn btn-emerald btn-sm">Show all courses</Link>
              </div>
            ) : (
              <div className="course-catalog-grid">
                {courses.map((course) => {
                  const progress = course.lesson_count
                    ? Math.round((Number(course.completed_lessons) / Number(course.lesson_count)) * 100)
                    : 0;
                  return (
                    <article key={course.id} className="course-catalog-card">
                      <Link href={`/courses/${course.id}`} className="course-catalog-cover-link" aria-label={`Explore ${course.name}`}>
                        {course.cover_image_url ? (
                          <img src={course.cover_image_url} alt="" className="course-catalog-cover" />
                        ) : (
                          <div className="course-catalog-cover course-catalog-cover-empty"><BookOpen size={36} /></div>
                        )}
                        {course.video_url && <span className="course-catalog-video"><Video size={14} /> Video course</span>}
                      </Link>
                      <div className="course-catalog-body">
                        <div className="course-catalog-meta">
                          <span className="badge badge-gold">Leadership course</span>
                          <span className="course-lesson-count"><BookOpen size={14} /> {course.lesson_count} lessons</span>
                        </div>
                        <h2><Link href={`/courses/${course.id}`}>{course.name}</Link></h2>
                        <p>{course.description || 'A step-by-step leadership course with practical lessons for student leaders.'}</p>
                        {currentUser?.role === 'student' && Number(course.completed_lessons) > 0 && (
                          <div className="course-progress">
                            <div><span>Your progress</span><strong>{progress}%</strong></div>
                            <div className="course-progress-track"><span style={{ width: `${progress}%` }} /></div>
                          </div>
                        )}
                        <div className="course-catalog-footer">
                          <span><Clock size={14} /> Study at your own pace</span>
                          <Link href={`/courses/${course.id}`} className="btn btn-emerald btn-sm">Explore course <ArrowRight size={14} /></Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
