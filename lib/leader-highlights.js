const MEDIA_TYPES = new Set(['message', 'image', 'video', 'audio']);
const DEFAULT_IMAGE = '/about/profile.png';

export function normalizeLeaderHighlight(body) {
  const name = String(body.name || '').trim();
  const title = String(body.title || '').trim();
  const quote = String(body.quote || '').trim();
  const highlight = String(body.highlight || '').trim();
  const imageUrl = String(body.imageUrl || '').trim() || DEFAULT_IMAGE;
  const videoUrl = String(body.videoUrl || '').trim();
  const requestedType = String(body.mediaType || body.media_type || '').trim();
  if (requestedType && !MEDIA_TYPES.has(requestedType)) {
    return { error: 'Highlight type must be message, image, video, or audio.' };
  }
  const mediaType = MEDIA_TYPES.has(requestedType)
    ? requestedType
    : videoUrl
      ? 'video'
      : imageUrl !== DEFAULT_IMAGE
        ? 'image'
        : 'message';
  const mediaUrl = String(body.mediaUrl || body.media_url || '').trim()
    || (mediaType === 'image' ? imageUrl : mediaType === 'video' || mediaType === 'audio' ? videoUrl : '');
  const category = String(body.category || 'Leadership Impact').trim();
  const badge = String(body.badge || 'Featured Leader').trim();
  const sortOrder = Number(body.sortOrder) || 0;

  if (!name || !title) {
    return { error: 'Name and title are required.' };
  }
  if (mediaType === 'message' && !quote) {
    return { error: 'A message is required for message highlights.' };
  }
  if (mediaType !== 'message' && !mediaUrl) {
    return { error: `A ${mediaType} URL or uploaded file is required.` };
  }

  return {
    value: {
      name,
      title,
      quote,
      highlight,
      mediaType,
      mediaUrl: mediaType === 'message' ? null : mediaUrl,
      imageUrl: mediaType === 'image' ? mediaUrl : DEFAULT_IMAGE,
      videoUrl: mediaType === 'video' ? mediaUrl : null,
      category,
      badge,
      sortOrder,
    },
  };
}
