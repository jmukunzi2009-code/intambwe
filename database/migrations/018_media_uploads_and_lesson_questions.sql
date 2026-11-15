ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image';

ALTER TABLE community_moments
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image';

UPDATE team_members
SET media_type = CASE
  WHEN lower(split_part(split_part(image_url, '?', 1), '#', 1)) ~ '\.(mp4|webm|mov|m4v)$' THEN 'video'
  WHEN lower(split_part(split_part(image_url, '?', 1), '#', 1)) ~ '\.pdf$' THEN 'pdf'
  ELSE 'image'
END;

UPDATE community_moments
SET media_type = CASE
  WHEN lower(split_part(split_part(image_url, '?', 1), '#', 1)) ~ '\.(mp4|webm|mov|m4v)$' THEN 'video'
  WHEN lower(split_part(split_part(image_url, '?', 1), '#', 1)) ~ '\.pdf$' THEN 'pdf'
  ELSE 'image'
END;

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS quiz_questions JSONB;

UPDATE articles
SET quiz_questions = jsonb_build_array(jsonb_build_object(
  'question', quiz_question,
  'options', CASE
    WHEN jsonb_typeof(quiz_options) = 'array' THEN quiz_options
    ELSE '[]'::jsonb
  END,
  'correctIndex', COALESCE(quiz_correct_index, 0),
  'explanation', COALESCE(quiz_explanation, '')
))
WHERE NULLIF(trim(quiz_question), '') IS NOT NULL
  AND quiz_questions IS NULL;
