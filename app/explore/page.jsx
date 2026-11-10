import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Search, 
  User, 
  ShieldCheck, 
  Brain, 
  Mic, 
  Users, 
  Lightbulb, 
  HeartHandshake, 
  Sparkles,
  Video
} from 'lucide-react';

export const metadata = {
  title: 'Explore Leadership | INTAMBWE Curriculum',
  description: 'Explore the 8 pillars of leadership education, comprehensive guides, practical exercises, and reflection activities.',
};

export const revalidate = 0;

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

export default async function ExplorePage({ searchParams }) {
  const resolvedParams = await searchParams;
  const selectedCategory = resolvedParams?.category || '';
  const searchQuery = resolvedParams?.q || '';

  const currentUser = await getCurrentUser();

  // Fetch all categories
  const categoriesRes = await query(
    `SELECT ac.*, COUNT(a.id) as article_count 
     FROM article_categories ac 
     LEFT JOIN articles a ON ac.id = a.category_id AND a.status = 'published'
     GROUP BY ac.id 
     ORDER BY ac.id ASC`
  );

  // Build query for articles
  const conditions = ["a.status = 'published'"];
  const params = [];

  if (selectedCategory) {
    params.push(selectedCategory);
    conditions.push(`ac.slug = $${params.length}`);
  }

  if (searchQuery) {
    params.push(`%${searchQuery}%`);
    conditions.push(`(a.title ILIKE $${params.length} OR a.introduction ILIKE $${params.length} OR a.content ILIKE $${params.length})`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const articlesRes = await query(
    `SELECT a.id, a.title, a.slug, a.introduction, a.learning_objectives, a.reading_time_minutes, a.published_at,
            a.cover_image_url, a.video_url,
            ac.name as category_name, ac.slug as category_slug,
            u.full_name as author_name
     FROM articles a
     JOIN article_categories ac ON a.category_id = ac.id
     LEFT JOIN users u ON a.author_id = u.id
     ${whereClause}
     ORDER BY a.published_at DESC`,
    params
  );

  return (
    <>
      <Navbar currentUser={currentUser} />

      <main>
        {/* HEADER */}
        <section style={{ backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', padding: '70px 0 50px 0' }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
            <span className="badge badge-gold" style={{ marginBottom: '14px' }}>Leadership Curriculum</span>
            <h1 style={{ color: 'var(--color-white)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', marginBottom: '16px' }}>
              Explore Leadership Lessons
            </h1>
            <p style={{ color: '#d1dbd5', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Deep, rigorous leadership lessons designed for Rwandan youth. Each article contains core frameworks, real-world case examples, critical thinking questions, and actionable reflection tasks.
            </p>
          </div>
        </section>

        {/* SEARCH & CATEGORY PILLS */}
        <section style={{ backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-border)', padding: '24px 0' }}>
          <div className="container">
            {/* Search Bar */}
            <form method="GET" action="/explore" style={{ maxWidth: '640px', margin: '0 auto 24px auto', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                name="q"
                defaultValue={searchQuery}
                placeholder="Search lessons, topics, or exercises..."
                className="form-input"
                style={{ flex: 1 }}
              />
              {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
              <button type="submit" className="btn btn-primary">
                <Search size={18} />
                <span>Search</span>
              </button>
            </form>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              <Link 
                href="/explore" 
                className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`}
              >
                All Categories
              </Link>
              {categoriesRes.rows.map((cat) => {
                const isActive = selectedCategory === cat.slug;
                return (
                  <Link
                    key={cat.id}
                    href={`/explore?category=${cat.slug}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
                    className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {cat.name} ({cat.article_count})
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ARTICLES GRID */}
        <section className="section-padding">
          <div className="container">
            {articlesRes.rows.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '0 auto' }}>
                <BookOpen size={48} style={{ color: 'var(--color-text-subtle)', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No lessons found</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                  No published leadership articles matched your search query or category filter.
                </p>
                <Link href="/explore" className="btn btn-emerald btn-sm">
                  Clear Filters
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
                {articlesRes.rows.map((art) => (
                  <article key={art.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column' }}>
                    {art.cover_image_url && (
                      <Link href={`/explore/${art.slug}`} style={{ display: 'block', margin: '-28px -28px 20px', overflow: 'hidden', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
                        <img src={art.cover_image_url} alt="" loading="lazy" style={{ display: 'block', width: '100%', height: '210px', objectFit: 'cover' }} />
                      </Link>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="badge badge-gold">{art.category_name}</span>
                        {art.video_url && <span className="badge badge-emerald"><Video size={13} /> Video</span>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                        <Clock size={14} />
                        <span>{art.reading_time_minutes} min</span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>
                      <Link href={`/explore/${art.slug}`} style={{ color: 'var(--color-forest)' }}>
                        {art.title}
                      </Link>
                    </h3>

                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
                      {art.introduction.slice(0, 160)}...
                    </p>

                    {art.learning_objectives && (
                      <div style={{ backgroundColor: '#F8FAF9', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', fontSize: '0.82rem', color: 'var(--color-charcoal)' }}>
                        <strong>Core Objective:</strong> {art.learning_objectives.split('\n')[0].replace(/^\d+\.\s*/, '')}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-light)', paddingTop: '14px', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--color-text-subtle)' }}>
                        By {art.author_name || 'INTAMBWE Faculty'}
                      </span>
                      <Link href={`/explore/${art.slug}`} className="btn btn-emerald btn-sm" style={{ padding: '6px 12px' }}>
                        <span>Study Lesson</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
