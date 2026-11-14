-- Migration 017: Separate leader highlights into message, image, video, and audio types
ALTER TABLE leader_highlights
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS media_url TEXT;

UPDATE leader_highlights
SET media_type = CASE
      WHEN NULLIF(video_url, '') IS NOT NULL THEN 'video'
      WHEN NULLIF(NULLIF(image_url, ''), '/about/profile.png') IS NOT NULL THEN 'image'
      ELSE 'message'
    END,
    media_url = CASE
      WHEN NULLIF(video_url, '') IS NOT NULL THEN video_url
      WHEN NULLIF(NULLIF(image_url, ''), '/about/profile.png') IS NOT NULL THEN image_url
      ELSE NULL
    END
WHERE media_type IS NULL;

ALTER TABLE leader_highlights
  ALTER COLUMN media_type SET DEFAULT 'message',
  ALTER COLUMN media_type SET NOT NULL;
