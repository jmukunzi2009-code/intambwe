-- Migration 015: Add tone/color to stick_notes for vibrant sticky palette
ALTER TABLE stick_notes
  ADD COLUMN IF NOT EXISTS tone VARCHAR(30) DEFAULT 'tone-gold';
