'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { StickTonePicker, TONE_OPTIONS } from './StickTonePicker';
import { 
  ExternalLink, 
  FileText, 
  Heart, 
  Image as ImageIcon, 
  MessageSquarePlus, 
  Pencil, 
  Quote, 
  Trash2, 
  Video, 
  X,
  Upload,
  Sparkles,
  Filter
} from 'lucide-react';
import { uploadMediaFile } from '@/lib/upload-client';

const EMPTY_FORM = { 
  title: '', 
  body: '', 
  noteKind: 'quote', 
  tone: 'tone-gold',
  mediaUrl: '', 
  mediaType: 'none',
  authorName: '',
  schoolName: ''
};

function MediaIcon({ type, size }) {
  if (type === 'image') return <ImageIcon size={size} />;
  if (type === 'video') return <Video size={size} />;
  if (type === 'pdf') return <FileText size={size} />;
  return <Quote size={size} />;
}

function NoteCard({ note, index, actions }) {
  const [likeCount, setLikeCount] = useState(Number(note.like_count) || 0);
  const [liked, setLiked] = useState(Boolean(note.liked_by_me));
  const [liking, setLiking] = useState(false);
  const [likeError, setLikeError] = useState('');

  const toggleLike = async () => {
    setLiking(true);
    setLikeError('');
    try {
      const response = await fetch(`/api/notes/${note.id}/like`, { method: liked ? 'DELETE' : 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update your like.');
      setLiked(Boolean(data.liked_by_me));
      setLikeCount(Number(data.like_count) || 0);
    } catch (error) {
      setLikeError(error.message);
    } finally {
      setLiking(false);
    }
  };

  const noteTone = note.tone || TONE_OPTIONS[index % TONE_OPTIONS.length].id;

  return (
    <article className={`stick-note ${noteTone}`} style={{ '--note-index': index }}>
      <div className="stick-note-art" aria-hidden="true" />
      <div className="stick-note-topline">
        <span className="stick-kind">{note.note_kind || 'quote'}</span>
        {note.visibility && (
          <span className={`stick-status stick-status-${note.visibility}`}>
            {note.visibility === 'pending' ? 'Awaiting review' : note.visibility === 'published' ? 'On community wall' : 'Private'}
          </span>
        )}
      </div>
      <h3>{note.title}</h3>
      <p style={{ whiteSpace: 'pre-line' }}>{note.body}</p>
      {note.media_type === 'image' && note.media_url && (
        <a href={note.media_url} target="_blank" rel="noreferrer" className="stick-media-link">
          <img src={note.media_url} alt={`Image attached to ${note.title}`} className="stick-media" />
        </a>
      )}
      {note.media_type === 'video' && note.media_url && (
        <a className="stick-attachment-link" href={note.media_url} target="_blank" rel="noreferrer">
          <Video size={17} /> Watch shared video <ExternalLink size={14} />
        </a>
      )}
      {note.media_type === 'pdf' && note.media_url && (
        <a className="stick-attachment-link" href={note.media_url} target="_blank" rel="noreferrer">
          <MediaIcon type={note.media_type} size={17} /> Open shared PDF document <ExternalLink size={14} />
        </a>
      )}
      <footer>
        <strong>{note.full_name || 'Anonymous Leader'}</strong>
        <span>{note.school_name || 'INTAMBWE Community'}</span>
      </footer>
      <div className="stick-note-reactions">
        {note.can_like === false ? (
          <Link className="stick-like-button" href="/login?redirect=/community">
            <Heart size={16} /> Like this note
          </Link>
        ) : (
          <button type="button" className={`stick-like-button ${liked ? 'is-liked' : ''}`} onClick={toggleLike} disabled={liking} aria-pressed={liked}>
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            <span>{liking ? 'Saving…' : liked ? 'Liked' : 'Like'}</span>
            <span className="stick-like-count">{likeCount}</span>
          </button>
        )}
        {likeError && <span className="stick-like-error" role="alert">{likeError}</span>}
      </div>
      {actions && <div className="stick-note-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>{actions}</div>}
    </article>
  );
}

export default function StickBoard({ initialNotes = [], canCompose = false, isLoggedIn = false, currentUser = null, isAdmin = false }) {
  const [notes, setNotes] = useState(() => Array.isArray(initialNotes) ? initialNotes : []);
  const [myNotes, setMyNotes] = useState([]);
  const [activeView, setActiveView] = useState('community');
  const [selectedKindFilter, setSelectedKindFilter] = useState('all');
  const [showComposer, setShowComposer] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mineLoaded, setMineLoaded] = useState(true);
  const [mineRequestId, setMineRequestId] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || activeView !== 'mine') return;
    let active = true;
    fetch('/api/notes?mine=1')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load your contributions.');
        return data.notes;
      })
      .then((contributions) => {
        if (active) setMyNotes(Array.isArray(contributions) ? contributions : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setMineLoaded(true);
      });

    return () => { active = false; };
  }, [activeView, isLoggedIn, mineRequestId]);

  const openComposer = (note = null) => {
    setEditingNote(note);
    setForm(note ? {
      title: note.title || '',
      body: note.body || '',
      noteKind: note.note_kind || 'quote',
      tone: note.tone || 'tone-gold',
      mediaUrl: note.media_url || '',
      mediaType: note.media_type || 'none',
      authorName: note.full_name || '',
      schoolName: note.school_name || '',
    } : {
      ...EMPTY_FORM,
      authorName: currentUser?.full_name || '',
      schoolName: currentUser?.school_name || '',
    });
    setMessage('');
    setError('');
    setShowComposer(true);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadMediaFile(file, { purpose: 'community' });

      const name = file.name.toLowerCase();
      let detectedType = 'image';
      if (name.endsWith('.pdf')) detectedType = 'pdf';
      else if (name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.webm')) detectedType = 'video';

      setForm((prev) => ({
        ...prev,
        mediaUrl: url,
        mediaType: detectedType,
      }));
    } catch (err) {
      setError(err.message || 'Could not upload file');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/notes', {
        method: editingNote ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingNote ? { ...form, noteId: editingNote.id } : form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save your contribution.');

      const savedNote = data.note;
      setNotes((current) => editingNote
        ? current.map((n) => n.id === savedNote.id ? savedNote : n)
        : [savedNote, ...current]);
      setMyNotes((current) => editingNote
        ? current.map((n) => n.id === savedNote.id ? savedNote : n)
        : [savedNote, ...current]);

      setMessage(data.message || 'Your idea is now live on the public community wall!');
      setShowComposer(false);
      setActiveView('community');
      setEditingNote(null);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (note) => {
    if (!window.confirm(`Delete “${note.title}”? This cannot be undone.`)) return;
    setError('');
    try {
      const res = await fetch(`/api/notes?id=${note.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete the contribution.');
      setMyNotes((current) => current.filter((item) => item.id !== note.id));
      setNotes((current) => current.filter((item) => item.id !== note.id));
      setMessage('Note deleted successfully.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (selectedKindFilter === 'all') return true;
    return n.note_kind === selectedKindFilter;
  });

  return (
    <section className="stick-section">
      <div className="stick-section-head">
        <div>
          <span className="badge badge-gold">Peer Learning Wall</span>
          <h2>Ideas Worth Sharing</h2>
          <p>Inspiring quotes, speeches, leadership reflections, and multimedia shared by youth delegates and mentors. Post your sticky note to the public wall.</p>
        </div>
        {canCompose && (
          <button type="button" className="btn btn-gold stick-compose-trigger" onClick={() => openComposer()}>
            <MessageSquarePlus size={18} />
            <span>Post a Sticky Note</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
        {isLoggedIn ? (
          <div className="stick-view-tabs" role="tablist" aria-label="Community contributions" style={{ margin: 0 }}>
            <button type="button" role="tab" aria-selected={activeView === 'community'} className={activeView === 'community' ? 'active' : ''} onClick={() => setActiveView('community')}>
              Community wall <span>{notes.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={activeView === 'mine'} className={activeView === 'mine' ? 'active' : ''} onClick={() => { setError(''); setMineLoaded(false); setMineRequestId((current) => current + 1); setActiveView('mine'); }}>
              My contributions
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--color-forest)' }}>
            <Sparkles size={16} style={{ color: 'var(--color-gold)' }} />
            <span><strong>Open Wall:</strong> Anyone can post a note, quote, or resource to inspire Rwanda&apos;s youth leaders!</span>
          </div>
        )}

        {/* KIND FILTER PILLS */}
        {activeView === 'community' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={13} /> Filter:
            </span>
            {['all', 'quote', 'speech', 'resource'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedKindFilter(k)}
                className={`btn btn-sm ${selectedKindFilter === k ? 'btn-emerald' : 'btn-outline'}`}
                style={{ fontSize: '0.76rem', padding: '4px 10px', textTransform: 'capitalize' }}
              >
                {k === 'all' ? 'All Types' : k}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && !showComposer && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fde8e8', color: '#9b1c1c', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>Dismiss</button>
        </div>
      )}

      {message && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-success-soft)', color: 'var(--color-forest)', borderRadius: '8px', marginBottom: '16px' }}>
          {message}
        </div>
      )}

      {activeView === 'community' ? (
        <div className="stick-wall">
          {filteredNotes.length === 0 ? (
            <article className="stick-note tone-ivory">
              <p>No contributions found in this filter. Be the first to share a leadership insight!</p>
            </article>
          ) : filteredNotes.map((note, index) => {
            const canModify = isAdmin || (currentUser && Number(note.user_id) === Number(currentUser.id));
            return (
              <NoteCard 
                key={note.id} 
                note={{ ...note, can_like: isLoggedIn }} 
                index={index}
                actions={canModify ? (
                  <>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => openComposer(note)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                      <Pencil size={12} /> Edit
                    </button>
                    <button type="button" className="btn btn-outline btn-sm stick-delete-button" onClick={() => deleteNote(note)} style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-danger)' }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </>
                ) : null}
              />
            );
          })}
        </div>
      ) : !mineLoaded ? (
        <div className="stick-empty-state">Loading your contributions…</div>
      ) : myNotes.length === 0 ? (
        <div className="stick-empty-state">
          <Quote size={26} />
          <h3>Your community contributions will appear here</h3>
          <p>Share an idea with other learners. You can edit or remove your contribution at any time.</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => openComposer()}>Share your first idea</button>
        </div>
      ) : (
        <div className="stick-wall">
          {myNotes.map((note, index) => (
            <NoteCard
              key={note.id}
              note={{ ...note, can_like: isLoggedIn }}
              index={index}
              actions={(
                <>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => openComposer(note)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                    <Pencil size={12} /> Edit
                  </button>
                  <button type="button" className="btn btn-outline btn-sm stick-delete-button" onClick={() => deleteNote(note)} style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-danger)' }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </>
              )}
            />
          ))}
        </div>
      )}

      {/* COMPOSER MODAL */}
      {showComposer && (
        <div className="stick-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowComposer(false); }}>
          <section className="stick-modal" role="dialog" aria-modal="true" aria-labelledby="stick-modal-title" style={{ maxWidth: '640px' }}>
            <header className="stick-modal-header">
              <div>
                <span className="badge badge-emerald">Community contribution</span>
                <h2 id="stick-modal-title">{editingNote ? 'Edit your contribution' : 'Share something meaningful'}</h2>
                <p>Share an uplifting quote, a speech excerpt, a useful learning resource, or an image with the INTAMBWE network.</p>
              </div>
              <button type="button" className="stick-modal-close" aria-label="Close dialog" onClick={() => setShowComposer(false)}><X size={20} /></button>
            </header>

            <form className="stick-form" onSubmit={submit}>
              <div className="stick-form-grid" style={{ marginBottom: '14px' }}>
                <label>
                  <span className="form-label">Your Name / Contributor *</span>
                  <input 
                    className="form-input" 
                    required 
                    minLength={2} 
                    maxLength={120} 
                    value={form.authorName} 
                    onChange={(event) => setForm({ ...form, authorName: event.target.value })} 
                    placeholder={currentUser?.full_name || 'e.g. Divine Keza, or Youth Mentor'} 
                  />
                </label>
                <label>
                  <span className="form-label">School / District / Organization</span>
                  <input 
                    className="form-input" 
                    maxLength={120} 
                    value={form.schoolName} 
                    onChange={(event) => setForm({ ...form, schoolName: event.target.value })} 
                    placeholder="e.g. FAWE Girls' School, Kigali" 
                  />
                </label>
              </div>

              <div className="stick-form-grid">
                <label>
                  <span className="form-label">Note Title / Quote Context *</span>
                  <input className="form-input" required minLength={2} maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Leadership in Action, or Advice to Student Delegates" />
                </label>
                <label>
                  <span className="form-label">Contribution format</span>
                  <select className="form-select" value={form.noteKind} onChange={(event) => setForm({ ...form, noteKind: event.target.value })}>
                    <option value="quote">Quote / Inspiring Words</option>
                    <option value="speech">Short speech / Keynote</option>
                    <option value="resource">Learning resource</option>
                  </select>
                </label>
              </div>

              <StickTonePicker value={form.tone} onChange={(tone) => setForm({ ...form, tone })} />
              <label>
                <span className="form-label">Your message / Quote writing</span>
                <textarea className="form-textarea" required minLength={3} maxLength={4000} rows={5} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Write a meaningful leadership quote, memorable words, or insightful reflection for fellow youth leaders..." />
                <span className="stick-character-count">{form.body.length}/4000 characters</span>
              </label>

              {/* MEDIA ATTACHMENT / FILE UPLOAD */}
              <div className="stick-media-field" style={{ backgroundColor: '#F8FAF9', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)', marginBottom: '16px' }}>
                <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <ImageIcon size={16} style={{ color: 'var(--color-emerald)' }} />
                  <span>Attach Media (Image, PDF, Video)</span>
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', display: 'block', marginBottom: '4px' }}>Upload File (Image / PDF)</span>
                    <input 
                      type="file" 
                      accept="image/*,.pdf,video/mp4" 
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="form-input"
                      style={{ fontSize: '0.82rem', padding: '6px' }}
                    />
                  </label>
                  <label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', display: 'block', marginBottom: '4px' }}>Or Paste Media URL</span>
                    <input 
                      className="form-input" 
                      type="url" 
                      value={form.mediaUrl} 
                      onChange={(event) => setForm({ ...form, mediaUrl: event.target.value })} 
                      placeholder="https://..." 
                      style={{ fontSize: '0.85rem' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>Media format:</span>
                    <select 
                      className="form-select" 
                      value={form.mediaType} 
                      onChange={(event) => setForm({ ...form, mediaType: event.target.value })}
                      style={{ fontSize: '0.8rem', padding: '4px 8px', width: 'auto' }}
                    >
                      <option value="none">None</option>
                      <option value="image">Image</option>
                      <option value="pdf">PDF Document</option>
                      <option value="video">Video</option>
                    </select>
                  </label>
                  {uploading && <span style={{ fontSize: '0.8rem', color: 'var(--color-emerald)' }}>Uploading file…</span>}
                  {form.mediaUrl && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-emerald)' }}>✓ File attached: {form.mediaUrl.slice(0, 32)}…</span>
                  )}
                </div>
              </div>

              {error && <p role="alert" className="stick-error">{error}</p>}
              <div className="stick-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowComposer(false)}>Cancel</button>
                <button type="submit" className="btn btn-emerald" disabled={saving || uploading}>
                  {saving ? 'Sharing…' : editingNote ? 'Save changes' : 'Share on Community Wall'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
