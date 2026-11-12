ALTER TABLE article_categories
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published';

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

WITH ordered_lessons AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at, id) AS lesson_order
  FROM articles
)
UPDATE articles a
SET sort_order = ordered_lessons.lesson_order
FROM ordered_lessons
WHERE a.id = ordered_lessons.id AND a.sort_order = 0;

CREATE TABLE IF NOT EXISTS course_enrollments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES article_categories(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_category
  ON course_enrollments(category_id, enrolled_at DESC);

CREATE TABLE IF NOT EXISTS stick_note_likes (
  note_id INT NOT NULL REFERENCES stick_notes(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (note_id, user_id)
);
