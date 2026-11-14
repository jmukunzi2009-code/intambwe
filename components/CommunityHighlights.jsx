'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  MessageSquareQuote,
  Play,
  Quote,
  Sparkles,
  Video,
  Volume2,
} from 'lucide-react';

const FILTERS = [
  { id: 'all', label: 'All highlights', icon: Sparkles },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'image', label: 'Images', icon: ImageIcon },
  { id: 'message', label: 'Messages', icon: MessageSquareQuote },
];

function getHighlightType(leader) {
  if (['message', 'image', 'video', 'audio'].includes(leader.media_type)) return leader.media_type;
  if (leader.video_url) return 'video';
  if (leader.image_url && leader.image_url !== '/about/profile.png') return 'image';
  return 'message';
}

function getEmbedVideoUrl(value) {
  if (!value) return '';

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    let videoId = '';

    if (host === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] || '';
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') videoId = url.searchParams.get('v') || '';
      else if (/^\/(embed|shorts)\/[^/]+/.test(url.pathname)) {
        videoId = url.pathname.split('/')[2] || '';
      }
    }

    return videoId && /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : value;
  } catch {
    return value;
  }
}

function HighlightCard({ leader }) {
  const type = getHighlightType(leader);
  const mediaUrl = leader.media_url || (type === 'video' || type === 'audio' ? leader.video_url : leader.image_url);
  const isVideoFile = /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(mediaUrl || '');

  return (
    <article className={`community-highlight-card community-highlight-card-${type}`}>
      {type === 'video' && (
        <div className="community-highlight-media community-highlight-video">
          {isVideoFile ? (
            <video src={mediaUrl} controls preload="metadata" playsInline aria-label={`${leader.name} leadership highlight video`} />
          ) : (
            <iframe
              src={getEmbedVideoUrl(mediaUrl)}
              title={`${leader.name} leadership highlight video`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          <span className="community-highlight-media-label"><Play size={13} fill="currentColor" /> Video highlight</span>
        </div>
      )}

      {type === 'audio' && (
        <div className="community-highlight-audio">
          <div className="community-highlight-audio-art" aria-hidden="true"><Volume2 size={26} /></div>
          <div className="community-highlight-audio-player">
            <span>Audio highlight</span>
            <audio src={mediaUrl} controls preload="none">{'Your browser does not support audio playback.'}</audio>
          </div>
        </div>
      )}

      {type === 'image' && (
        <figure className="community-highlight-media community-highlight-image">
          <img src={mediaUrl} alt={`${leader.name} leadership highlight`} loading="lazy" />
          <figcaption>{leader.category || 'Leadership highlight'}</figcaption>
        </figure>
      )}

      <div className="community-highlight-card-content">
        <div className="community-highlight-meta">
          <span className={`community-highlight-type community-highlight-type-${type}`}>
            {type === 'video' && <Video size={13} />}
            {type === 'audio' && <Volume2 size={13} />}
            {type === 'image' && <ImageIcon size={13} />}
            {type === 'message' && <MessageSquareQuote size={13} />}
            {type === 'video' ? 'Video' : type === 'audio' ? 'Audio' : type === 'image' ? 'Image' : 'Message'}
          </span>
          <span className="badge badge-gold community-highlight-badge">
            {leader.badge || 'Featured Leader'}
          </span>
        </div>

        <div className="community-highlight-person">
          {type === 'message' && (
            <span className="community-highlight-quote-icon" aria-hidden="true"><Quote size={22} /></span>
          )}
          <div className="community-highlight-person-copy">
            <h3 className="community-highlight-name">{leader.name}</h3>
            <p className="community-highlight-role">{leader.title}</p>
          </div>
        </div>

        {type === 'message' && (
          <blockquote className="community-highlight-message">
            <Quote size={24} aria-hidden="true" />
            <p>{leader.quote}</p>
            {leader.highlight && <footer>{leader.highlight}</footer>}
          </blockquote>
        )}
      </div>
    </article>
  );
}

export default function CommunityHighlights({ leaders, canManage }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleLeaders, setVisibleLeaders] = useState(leaders);
  const [refreshError, setRefreshError] = useState('');

  const refreshHighlights = useCallback(async () => {
    try {
      const response = await fetch('/api/leaders', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to refresh community highlights.');
      if (Array.isArray(data.leaders)) {
        setVisibleLeaders(data.leaders);
        setRefreshError('');
      }
    } catch (error) {
      console.error('Refresh community highlights error:', error);
      setRefreshError('Could not refresh highlights. Please reload the page to try again.');
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void refreshHighlights(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshHighlights]);

  useEffect(() => {
    const handleFocus = () => { void refreshHighlights(); };
    const intervalId = window.setInterval(refreshHighlights, 30000);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshHighlights]);

  const counts = useMemo(() => visibleLeaders.reduce((result, leader) => {
    result[getHighlightType(leader)] += 1;
    return result;
  }, { video: 0, audio: 0, image: 0, message: 0 }), [visibleLeaders]);
  const filteredLeaders = activeFilter === 'all'
    ? visibleLeaders
    : visibleLeaders.filter((leader) => getHighlightType(leader) === activeFilter);

  return (
    <section className="community-highlights">
      <header className="community-highlights-header">
        <div className="community-highlights-intro">
          <span className="badge badge-gold">Voices of Impact</span>
          <h2>Inspiring Leaders &amp; Transformational Highlights</h2>
          <p>Explore the stories, images, and words shared by INTAMBWE administrators.</p>
        </div>
        {canManage && (
          <Link href="/dashboard/admin" className="btn btn-outline btn-sm community-highlights-manage">
            <Sparkles size={15} />
            <span>Manage Highlights</span>
          </Link>
        )}
      </header>

      <div className="community-highlight-filters" role="group" aria-label="Filter leadership highlights">
        {FILTERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`community-highlight-filter${activeFilter === id ? ' is-active' : ''}`}
            onClick={() => setActiveFilter(id)}
            aria-pressed={activeFilter === id}
          >
            <Icon size={16} />
            <span>{label}</span>
            <span className="community-highlight-filter-count">
              {id === 'all' ? visibleLeaders.length : counts[id]}
            </span>
          </button>
        ))}
      </div>

      <p className="community-highlight-filter-help">
        Looking for a specific post? Select <strong>Images</strong> for photos or <strong>Messages</strong> for written highlights.
        New posts appear in the filter matching their type.
      </p>

      {refreshError && (
        <p className="community-highlight-refresh-error" role="status">{refreshError}</p>
      )}

      {filteredLeaders.length ? (
        <div className="community-highlight-grid" key={activeFilter}>
          {filteredLeaders.map((leader) => <HighlightCard key={leader.id} leader={leader} />)}
        </div>
      ) : (
        <div className="community-highlight-empty">
          <Sparkles size={24} />
          <h3>No {activeFilter} highlights yet</h3>
          <p>New highlights shared by the INTAMBWE team will appear here.</p>
        </div>
      )}
    </section>
  );
}
