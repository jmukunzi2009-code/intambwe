ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS category_id INT REFERENCES article_categories(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_user_category_unique
  ON certificates(user_id, category_id)
  WHERE category_id IS NOT NULL;
