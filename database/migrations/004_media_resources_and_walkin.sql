-- ========================================================
-- INTAMBWE - Migration 004: Media, Resources & Walk-in System
-- Migration: 004_media_resources_and_walkin.sql
-- ========================================================

-- 1. Extend articles with video and audio URLs
ALTER TABLE articles ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- 2. Extend meetings with video highlights and gallery images
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb;

-- 3. Extend resources with status and updated_at
ALTER TABLE resources ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Update articles with educational videos and cover photography
UPDATE articles
SET 
  cover_image_url = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
  video_url = 'https://www.youtube.com/embed/fW8amMCVAJQ'
WHERE slug = 'architecture-of-self-leadership';

UPDATE articles
SET 
  cover_image_url = 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
  video_url = 'https://www.youtube.com/embed/dItUGF8GdTw'
WHERE slug = 'critical-thinking-dissecting-information';

UPDATE articles
SET 
  cover_image_url = 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
  video_url = 'https://www.youtube.com/embed/i0a61wFaQD8'
WHERE slug = 'power-of-spoken-conviction';

UPDATE articles
SET 
  cover_image_url = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'
WHERE cover_image_url IS NULL;

-- 5. Update meetings with video highlights and photo galleries
UPDATE meetings
SET 
  cover_image_url = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
  video_url = 'https://www.youtube.com/embed/7X8II6J-6mU',
  gallery_urls = '[
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
  ]'::jsonb
WHERE meeting_number = 'INT-CONF-2026-01';

UPDATE meetings
SET 
  cover_image_url = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
  video_url = 'https://www.youtube.com/embed/fW8amMCVAJQ',
  gallery_urls = '[
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80"
  ]'::jsonb
WHERE meeting_number = 'INT-CONF-2025-02';
