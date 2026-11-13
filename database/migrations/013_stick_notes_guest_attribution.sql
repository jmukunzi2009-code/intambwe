-- Add author_name and school_name columns to stick_notes table
-- Allows guest contributors and custom attributions to appear accurately.

ALTER TABLE stick_notes
  ADD COLUMN IF NOT EXISTS author_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS school_name VARCHAR(150);

-- Update existing stick_notes to have author_name populated from user
UPDATE stick_notes n
SET author_name = u.full_name,
    school_name = COALESCE(sp.school_name, 'INTAMBWE Community')
FROM users u
LEFT JOIN student_profiles sp ON sp.user_id = u.id
WHERE n.user_id = u.id AND n.author_name IS NULL;
