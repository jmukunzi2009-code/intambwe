'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Heart, Image as ImageIcon, MessageSquarePlus, Pencil, Quote, Trash2, Video, X } from 'lucide-react';

const TONES = ['tone-gold', 'tone-green', 'tone-ivory', 'tone-ink'];
const EMPTY_FORM = { title: '', body: '', noteKind: 'quote', mediaUrl: '', mediaType: 'none' };

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

  return (
    <article className={`stick-note ${TONES[index % TONES.length]}`} style={{ '--note-index': index }}>
      <div className="stick-note-topline">
        <span className="stick-kind">{note.note_kind}</span>
        {note.visibility && (
          <span className={`stick-status stick-status-${note.visibility}`}>
            {note.visibility === 'pending' ? 'Awaiting review' : note.visibility === 'published' ? 'On community wall' : 'Private'}
          </span>
        )}
      </div>
      <h3>{note.title}</h3>
      <p>{note.body}</p>
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
          <MediaIcon type={note.media_type} size={17} /> Open shared PDF <ExternalLink size={14} />
        </a>
      )}
      <footer>
        <strong>{note.full_name}</strong>
        <span>{note.school_name || 'INTAMBWE community'}</span>
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
      {actions && <div className="stick-note-actions">{actions}</div>}
    </article>
  );
}

export default function StickBoard({ initialNotes = [], canCompose = false, isLoggedIn = false }) {
  const [notes, setNotes] = useState(() => Array.isArray(initialNotes) ? initialNotes : []);
  const [myNotes, setMyNotes] = useState([]);
  const [activeView, setActiveView] = useState('community');
  const [showComposer, setShowComposer] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mineLoaded, setMineLoaded] = useState(true);
  const [mineRequestId, setMineRequestId] = useState(0);
  const [saving, setSaving] = useState(false);

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
      title: note.title,
      body: note.body,
      noteKind: note.note_kind,
      mediaUrl: note.media_url || '',
      mediaType: note.media_type || 'none',
    } : EMPTY_FORM);
    setMessage('');
    setError('');
    setShowComposer(true);
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
      setMyNotes((current) => editingNote
        ? current.map((note) => note.id === savedNote.id ? savedNote : note)
        : [savedNote, ...current]);

      if (savedNote.visibility === 'published') {
        setNotes((current) => editingNote
          ? current.map((note) => note.id === savedNote.id ? savedNote : note)
          : [savedNote, ...current]);
      } else {
        setNotes((current) => current.filter((note) => note.id !== savedNote.id));
      }

      setMessage(data.message || 'Contribution saved.');
      setShowComposer(false);
      setActiveView('mine');
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
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="stick-section">
      <div className="stick-section-head">
        <div>
          <span className="badge badge-gold">Peer learning wall</span>
          <h2>Ideas worth sharing</h2>
          <p>Share a quote, a short speech, a learning resource, or a video link. Contributions appear on the community wall after staff review.</p>
        </div>
        {canCompose && (
          <button type="button" className="btn btn-gold stick-compose-trigger" onClick={() => openComposer()}>
            <MessageSquarePlus size={17} /> Share an idea
          </button>
        )}
      </div>

      {isLoggedIn ? (
        <div className="stick-view-tabs" role="tablist" aria-label="Community contributions">
          <button type="button" role="tab" aria-selected={activeView === 'community'} className={activeView === 'community' ? 'active' : ''} onClick={() => setActiveView('community')}>
            Community wall <span>{notes.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={activeView === 'mine'} className={activeView === 'mine' ? 'active' : ''} onClick={() => { setError(''); setMineLoaded(false); setMineRequestId((current) => current + 1); setActiveView('mine'); }}>
            My contributions
          </button>
        </div>
      ) : (
        <p className="stick-signin">
          <Link href="/login?redirect=/community">Sign in</Link> to share a quote, speech, resource, or video link.
        </p>
      )}

      {error && !showComposer && <p role="alert" className="stick-error stick-board-error">{error}</p>}

      {activeView === 'community' ? (
        <div className="stick-wall">
          {notes.length === 0 ? (
            <article className="stick-note tone-ivory">
              <p>The wall is ready. The first approved quote or community message will appear here.</p>
            </article>
          ) : notes.map((note, index) => <NoteCard key={note.id} note={{ ...note, can_like: isLoggedIn }} index={index} />)}
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
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => openComposer(note)}><Pencil size={14} /> Edit</button>
                  <button type="button" className="btn btn-outline btn-sm stick-delete-button" onClick={() => deleteNote(note)}><Trash2 size={14} /> Delete</button>
                </>
              )}
            />
          ))}
        </div>
      )}

      {showComposer && (
        <div className="stick-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowComposer(false); }}>
          <section className="stick-modal" role="dialog" aria-modal="true" aria-labelledby="stick-modal-title">
            <header className="stick-modal-header">
              <div>
                <span className="badge badge-emerald">Community contribution</span>
                <h2 id="stick-modal-title">{editingNote ? 'Edit your contribution' : 'Share something meaningful'}</h2>
                <p>Staff review each contribution before it appears on the wall. You can edit or delete it later.</p>
              </div>
              <button type="button" className="stick-modal-close" aria-label="Close dialog" onClick={() => setShowComposer(false)}><X size={20} /></button>
            </header>

            <form className="stick-form" onSubmit={submit}>
              <div className="stick-form-grid">
                <label>
                  <span className="form-label">Title</span>
                  <input className="form-input" required minLength={3} maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="A thought that could help another learner" />
                </label>
                <label>
                  <span className="form-label">Contribution type</span>
                  <select className="form-select" value={form.noteKind} onChange={(event) => setForm({ ...form, noteKind: event.target.value })}>
                    <option value="quote">Quote</option>
                    <option value="speech">Short speech</option>
                    <option value="resource">Learning resource</option>
                  </select>
                </label>
              </div>
              <label>
                <span className="form-label">Your message</span>
                <textarea className="form-textarea" required minLength={12} maxLength={4000} rows={5} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Write a helpful quote, speech, or resource description for fellow learners." />
                <span className="stick-character-count">{form.body.length}/4000 characters</span>
              </label>

              <div className="stick-form-grid">
                <label>
                  <span className="form-label">Attach a link (optional)</span>
                  <input className="form-input" type="url" value={form.mediaUrl} onChange={(event) => setForm({ ...form, mediaUrl: event.target.value })} placeholder="https://…" />
                </label>
                <label>
                  <span className="form-label">Link type</span>
                  <select className="form-select" value={form.mediaType} onChange={(event) => setForm({ ...form, mediaType: event.target.value })}>
                    <option value="none">No attachment</option>
                    <option value="video">Video link (YouTube, Vimeo, MP4)</option>
                    <option value="image">Image link</option>
                    <option value="pdf">PDF link</option>
                  </select>
                </label>
              </div>
              <p className="stick-private-reminder">Video sharing accepts a public video URL. Uploading video files requires a configured media-storage service.</p>
              {error && <p role="alert" className="stick-error">{error}</p>}
              <div className="stick-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowComposer(false)}>Cancel</button>
                <button type="submit" className="btn btn-emerald" disabled={saving}>{saving ? 'Saving…' : editingNote ? 'Save changes' : 'Send for review'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {message && <p role="status" className="stick-message">{message}</p>}
    </section>
  );
}
