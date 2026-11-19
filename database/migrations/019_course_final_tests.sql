CREATE TABLE IF NOT EXISTS course_final_test_questions (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES article_categories(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  UNIQUE (category_id, sort_order),
  CHECK (jsonb_typeof(options) = 'array'),
  CHECK (correct_index >= 0)
);

CREATE TABLE IF NOT EXISTS course_final_test_attempts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES article_categories(id) ON DELETE CASCADE,
  score INT NOT NULL,
  total_questions INT NOT NULL,
  passed BOOLEAN NOT NULL,
  submission_reason VARCHAR(30) NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK (score >= 0 AND score <= total_questions),
  CHECK (total_questions > 0)
);

CREATE INDEX IF NOT EXISTS idx_course_final_test_attempts_latest
  ON course_final_test_attempts(user_id, category_id, submitted_at DESC);
