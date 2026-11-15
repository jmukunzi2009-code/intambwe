import { FileText, Video } from 'lucide-react';

export default function MediaAsset({ url, mediaType = 'image', title = 'Media', objectPosition = 'center' }) {
  if (!url) return null;

  if (mediaType === 'video') {
    const videoPath = String(url).split(/[?#]/, 1)[0].toLowerCase();
    if (!/\.(mp4|webm|mov|m4v|ogg|ogv)$/.test(videoPath)) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${title} video link`}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', height: '100%', color: 'var(--color-forest)', textDecoration: 'none', background: 'linear-gradient(145deg, #f8faf9, #eaf3ed)' }}
        >
          <Video size={30} aria-hidden="true" />
          <span style={{ fontWeight: 700 }}>Open video link</span>
        </a>
      );
    }

    return (
      <video
        src={url}
        controls
        preload="metadata"
        aria-label={title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition, display: 'block' }}
      />
    );
  }

  if (mediaType === 'pdf') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${title} PDF`}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '140px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '20px',
          color: 'var(--color-forest)',
          background: 'linear-gradient(145deg, #f8faf9, #eaf3ed)',
          textDecoration: 'none',
          textAlign: 'center',
        }}
      >
        <FileText size={34} aria-hidden="true" />
        <span style={{ fontWeight: 700 }}>View PDF</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{title}</span>
      </a>
    );
  }

  return (
    <img
      src={url}
      alt={title}
      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition, display: 'block' }}
    />
  );
}
