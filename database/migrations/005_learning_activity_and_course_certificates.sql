-- Track authenticated student lesson views and issue verifiable course certificates.
CREATE TABLE IF NOT EXISTS student_article_views (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  view_count INT NOT NULL DEFAULT 1 CHECK (view_count > 0),
  first_viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_student_article_views_last_viewed
  ON student_article_views(last_viewed_at DESC);

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS article_id INT REFERENCES articles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_user_meeting_unique
  ON certificates(user_id, meeting_id)
  WHERE meeting_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_user_article_unique
  ON certificates(user_id, article_id)
  WHERE article_id IS NOT NULL;
