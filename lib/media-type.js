const MEDIA_TYPES = new Set(['image', 'video', 'pdf']);

export function inferMediaType(url = '') {
  const path = String(url).split(/[?#]/, 1)[0].toLowerCase();
  if (/\.pdf$/.test(path)) return 'pdf';
  if (/\.(mp4|webm|mov|m4v)$/.test(path)) return 'video';
  return 'image';
}

export function normalizeMediaType(mediaType, url = '') {
  return MEDIA_TYPES.has(mediaType) ? mediaType : inferMediaType(url);
}

export function mediaTypeFromFile(file) {
  if (file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name || '')) return 'pdf';
  if (file?.type?.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file?.name || '')) return 'video';
  return 'image';
}
