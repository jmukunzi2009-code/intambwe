import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  FileCheck, 
  BookOpen, 
  Layers,
  Sparkles
} from 'lucide-react';

export const metadata = {
  title: 'Learning Resources & Handbooks | INTAMBWE',
  description: 'Download student leadership handbooks, reflection journals, slide decks, and worksheets prepared by INTAMBWE.',
};

export const revalidate = 0;

export default async function ResourcesPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const selectedCategory = resolvedParams?.category || '';
  const selectedType = resolvedParams?.type || '';
  const searchQuery = resolvedParams?.q || '';

  const currentUser = await getCurrentUser();

  // Fetch categories
  const catRes = await query(
    `SELECT rc.*, COUNT(r.id) as resource_count
     FROM resource_categories rc
     LEFT JOIN resources r ON rc.id = r.category_id AND r.is_public = true
     GROUP BY rc.id
     ORDER BY rc.id ASC`
  );

  // Build filter query
  const conditions = ['r.is_public = true'];
  const params = [];

  if (selectedCategory) {
    params.push(selectedCategory);
    conditions.push(`rc.slug = $${params.length}`);
  }

  if (selectedType) {
    params.push(selectedType);
    conditions.push(`r.file_type = $${params.length}`);
  }

  if (searchQuery) {
    params.push(`%${searchQuery}%`);
    conditions.push(`(r.title ILIKE $${params.length} OR r.description ILIKE $${params.length})`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const resourcesRes = await query(
    `SELECT r.*, rc.name as category_name, rc.slug as category_slug
     FROM resources r
     LEFT JOIN resource_categories rc ON r.category_id = rc.id
     ${whereClause}
     ORDER BY r.created_at DESC`,
    params
  );

  return (
    <>
      <Navbar currentUser={currentUser} />

      <main style={{ minHeight: '100vh', paddingBottom: '80px' }}>
        {/* HEADER */}
        <section style={{ backgroundColor: 'var(--color-forest)', color: 'var(--color-white)', padding: '70px 0 50px 0' }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: '820px' }}>
            <span className="badge badge-gold" style={{ marginBottom: '14px' }}>Educational Library</span>
            <h1 style={{ color: 'var(--color-white)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', marginBottom: '16px' }}>
              Leadership Handbooks & Toolkits
            </h1>
            <p style={{ color: '#d1dbd5', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Curated guides, reflection journals, meeting facilitation sheets, and conference materials available for all secondary students and educators in Rwanda.
            </p>
          </div>
        </section>

        {/* SEARCH & FILTERS */}
        <section style={{ backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-border)', padding: '24px 0' }}>
          <div className="container">
            <form method="GET" action="/resources" style={{ maxWidth: '640px', margin: '0 auto 20px auto', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                name="q"
                defaultValue={searchQuery}
                placeholder="Search resources, guides, or worksheets..."
                className="form-input"
                style={{ flex: 1 }}
              />
              {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
              {selectedType && <input type="hidden" name="type" value={selectedType} />}
              <button type="submit" className="btn btn-primary">
                <Search size={18} />
                <span>Search</span>
              </button>
            </form>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              <Link 
                href="/resources" 
                className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`}
              >
                All Resources
              </Link>
              {catRes.rows.map((cat) => {
                const isActive = selectedCategory === cat.slug;
                return (
                  <Link
                    key={cat.id}
                    href={`/resources?category=${cat.slug}${selectedType ? `&type=${selectedType}` : ''}`}
                    className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {cat.name} ({cat.resource_count})
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* RESOURCES LIST */}
        <div className="container" style={{ marginTop: '40px' }}>
          {resourcesRes.rows.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '0 auto' }}>
              <FileText size={48} style={{ color: 'var(--color-text-subtle)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>No resources found</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                Try adjusting your search keywords or clearing the category filters.
              </p>
              <Link href="/resources" className="btn btn-emerald btn-sm">
                View All Resources
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
              {resourcesRes.rows.map((res) => (
                <div key={res.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span className="badge badge-emerald">{res.file_type.toUpperCase()}</span>
                    {res.file_size_mb && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                        {res.file_size_mb} MB
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--color-forest)' }}>
                    {res.title}
                  </h3>

                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>
                    {res.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-light)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>
                      {res.category_name || 'General Tool'}
                    </span>
                    <a 
                      href={res.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-gold btn-sm"
                      style={{ padding: '6px 14px' }}
                    >
                      <Download size={15} />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
