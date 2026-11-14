INSERT INTO website_settings (setting_key, setting_value, description)
VALUES
  ('contact_email', 'intambwe@gmail.com', 'Official Contact Email'),
  ('headquarters', 'Rwamagana, Eastern Province, Rwanda', 'Organization Location')
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    updated_at = NOW();
