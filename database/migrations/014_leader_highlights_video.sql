-- Migration 014: Add video_url to leader_highlights
ALTER TABLE leader_highlights
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Seed inspiring video highlights
UPDATE leader_highlights
SET video_url = 'https://www.youtube.com/embed/qp0HIF3SfI4'
WHERE id IN (1, 2) AND (video_url IS NULL OR video_url = '');
