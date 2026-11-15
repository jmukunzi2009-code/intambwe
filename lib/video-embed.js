export function getVideoEmbedUrl(videoUrl) {
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
