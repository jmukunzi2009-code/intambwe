'use client';

import React, { useState } from 'react';
import { 
  Camera, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  Quote as QuoteIcon 
} from 'lucide-react';
import { uploadMediaFile } from '@/lib/upload-client';

export default function AboutAdminClient({ 
  currentUser, 
  initialFounderImage = '/about/sarah-image.jpg',
  initialTeam = [],
  initialMoments = []
}) {
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin');

  // Founder Photo state
  const [founderImage, setFounderImage] = useState(initialFounderImage);
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [founderInput, setFounderInput] = useState(initialFounderImage);
  const [uploadingFounder, setUploadingFounder] = useState(false);

  // Team Member modal state
  const [team, setTeam] = useState(initialTeam);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', role: '', bio: '', imageUrl: '/about/profile.png', sortOrder: 0 });
  const [teamUploading, setTeamUploading] = useState(false);

  // Moment modal state
  const [moments, setMoments] = useState(initialMoments);
  const [showMomentModal, setShowMomentModal] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);
  const [momentForm, setMomentForm] = useState({
    title: '',
    description: '',
    imageUrl: '/about/group-photo.jpg',
    authorQuote: '',
    authorName: '',
    sortOrder: 0
  });
  const [momentUploading, setMomentUploading] = useState(false);

  if (!isAdmin) return null;

  // File upload helper
  const uploadFile = async (file) => {
    return uploadMediaFile(file, { purpose: 'admin' });
  };

  // --- FOUNDER PHOTO HANDLERS ---
  const handleSaveFounderPhoto = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'founder_image_url', value: founderInput, description: 'Founder Portrait Image' }),
      });
      if (!res.ok) throw new Error('Failed to update founder photo.');
      setFounderImage(founderInput);
      setShowFounderModal(false);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFounderFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFounder(true);
    try {
      const url = await uploadFile(file);
      setFounderInput(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingFounder(false);
    }
  };

  // --- TEAM MEMBER HANDLERS ---
  const handleOpenTeamModal = (member = null) => {
    setEditingTeamMember(member);
    setTeamForm(member ? {
      name: member.name || '',
      role: member.role || '',
      bio: member.bio || '',
      imageUrl: member.image_url || '/about/profile.png',
      sortOrder: member.sort_order || 0
    } : {
      name: '',
      role: '',
      bio: '',
      imageUrl: '/about/profile.png',
      sortOrder: team.length + 1
    });
    setShowTeamModal(true);
  };

  const handleSaveTeamMember = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(editingTeamMember ? `/api/team/${editingTeamMember.id}` : '/api/team', {
        method: editingTeamMember ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save team member.');
      setShowTeamModal(false);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTeamMember = async (member) => {
    if (!window.confirm(`Delete team member "${member.name}"?`)) return;
    try {
      const res = await fetch(`/api/team/${member.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete team member.');
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- COMMUNITY MOMENT HANDLERS ---
  const handleOpenMomentModal = (moment = null) => {
    setEditingMoment(moment);
    setMomentForm(moment ? {
      title: moment.title || '',
      description: moment.description || '',
      imageUrl: moment.image_url || '/about/group-photo.jpg',
      authorQuote: moment.author_quote || '',
      authorName: moment.author_name || '',
      sortOrder: moment.sort_order || 0
    } : {
      title: '',
      description: '',
      imageUrl: '/about/group-photo.jpg',
      authorQuote: '',
      authorName: '',
      sortOrder: moments.length + 1
    });
    setShowMomentModal(true);
  };

  const handleSaveMoment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(editingMoment ? `/api/moments/${editingMoment.id}` : '/api/moments', {
        method: editingMoment ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(momentForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save community moment.');
      setShowMomentModal(false);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMoment = async (moment) => {
    if (!window.confirm(`Delete community moment "${moment.title}"?`)) return;
    try {
      const res = await fetch(`/api/moments/${moment.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete community moment.');
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      {/* FLOATING ADMIN QUICK ACTION BAR */}
      <aside aria-label="Admin quick actions" style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#142438',
        color: 'white',
        padding: '12px 18px',
        borderRadius: '30px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 999,
        border: '1px solid rgba(201, 155, 67, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-gold)' }}>
          <Sparkles size={16} /> Admin Controls:
        </div>
        <button 
          onClick={() => setShowFounderModal(true)} 
          className="btn btn-outline btn-sm"
          style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', padding: '4px 10px', fontSize: '0.78rem' }}
        >
          <Camera size={13} /> Change Founder Photo
        </button>
        <button 
          onClick={() => handleOpenTeamModal()} 
          className="btn btn-emerald btn-sm"
          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
        >
          <Plus size={13} /> Add Team Member
        </button>
        <button 
          onClick={() => handleOpenMomentModal()} 
          className="btn btn-gold btn-sm"
          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
        >
          <Plus size={13} /> Add Moment
        </button>
      </aside>

      {/* CHANGE FOUNDER PHOTO MODAL */}
      {showFounderModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest)', margin: 0 }}>
                Update Founder Image on About Page
              </h3>
              <button onClick={() => setShowFounderModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveFounderPhoto}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Upload New Photo from Device</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFounderFileUpload}
                  disabled={uploadingFounder}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
                {uploadingFounder && <span style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', marginTop: '4px', display: 'block' }}>Uploading photo…</span>}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Or Image URL / Path</label>
                <input 
                  type="text" 
                  required
                  value={founderInput} 
                  onChange={(e) => setFounderInput(e.target.value)}
                  className="form-input"
                  placeholder="/about/sarah-image.jpg or https://..."
                />
              </div>

              {founderInput && (
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', display: 'block', marginBottom: '6px' }}>Preview:</span>
                  <img src={founderInput} alt="Founder Preview" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', border: '3px solid var(--color-gold)', margin: '0 auto' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowFounderModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald" disabled={uploadingFounder}>Save Image</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM MEMBER MODAL */}
      {showTeamModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest)', margin: 0 }}>
                {editingTeamMember ? 'Edit Team Leader Profile' : 'Add Team Leader Profile'}
              </h3>
              <button onClick={() => setShowTeamModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveTeamMember}>
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  value={teamForm.name} 
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} 
                  placeholder="e.g. Alliance Uwase"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Role / Job Title *</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  value={teamForm.role} 
                  onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })} 
                  placeholder="e.g. Director of Curriculum & Youth Education"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Biography / Background *</label>
                <textarea 
                  rows={3} 
                  required 
                  className="form-textarea" 
                  value={teamForm.bio} 
                  onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })} 
                  placeholder="Share their passion, leadership experience, and contribution to INTAMBWE..."
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Upload Profile Photo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setTeamUploading(true);
                    try {
                      const url = await uploadFile(file);
                      setTeamForm((prev) => ({ ...prev, imageUrl: url }));
                    } catch (err) {
                      alert(err.message);
                    } finally {
                      setTeamUploading(false);
                    }
                  }}
                  disabled={teamUploading}
                  className="form-input"
                  style={{ fontSize: '0.82rem' }}
                />
                {teamUploading && <span style={{ fontSize: '0.8rem', color: 'var(--color-emerald)' }}>Uploading…</span>}
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label className="form-label">Photo URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={teamForm.imageUrl} 
                  onChange={(e) => setTeamForm({ ...teamForm, imageUrl: e.target.value })} 
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowTeamModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald" disabled={teamUploading}>
                  {editingTeamMember ? 'Save Changes' : 'Add Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMMUNITY MOMENT MODAL */}
      {showMomentModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest)', margin: 0 }}>
                {editingMoment ? 'Edit Community Moment' : 'Add Community Moment & Story'}
              </h3>
              <button onClick={() => setShowMomentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveMoment}>
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Moment Title *</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  value={momentForm.title} 
                  onChange={(e) => setMomentForm({ ...momentForm, title: e.target.value })} 
                  placeholder="e.g. Good Company, Meaningful Learning & Joyful Growth"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Description / Story *</label>
                <textarea 
                  rows={3} 
                  required 
                  className="form-textarea" 
                  value={momentForm.description} 
                  onChange={(e) => setMomentForm({ ...momentForm, description: e.target.value })} 
                  placeholder="Describe this milestone, student memory, or shared breakthrough..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label">Community Quote (Optional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={momentForm.authorQuote} 
                    onChange={(e) => setMomentForm({ ...momentForm, authorQuote: e.target.value })} 
                    placeholder="e.g. Strong teams grow through honest conversations."
                  />
                </div>
                <div>
                  <label className="form-label">Quote Attribution</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={momentForm.authorName} 
                    onChange={(e) => setMomentForm({ ...momentForm, authorName: e.target.value })} 
                    placeholder="e.g. Student Council Delegate"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Upload Moment Photo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setMomentUploading(true);
                    try {
                      const url = await uploadFile(file);
                      setMomentForm((prev) => ({ ...prev, imageUrl: url }));
                    } catch (err) {
                      alert(err.message);
                    } finally {
                      setMomentUploading(false);
                    }
                  }}
                  disabled={momentUploading}
                  className="form-input"
                  style={{ fontSize: '0.82rem' }}
                />
                {momentUploading && <span style={{ fontSize: '0.8rem', color: 'var(--color-emerald)' }}>Uploading…</span>}
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label className="form-label">Photo URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={momentForm.imageUrl} 
                  onChange={(e) => setMomentForm({ ...momentForm, imageUrl: e.target.value })} 
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowMomentModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-emerald" disabled={momentUploading}>
                  {editingMoment ? 'Save Changes' : 'Add Moment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
