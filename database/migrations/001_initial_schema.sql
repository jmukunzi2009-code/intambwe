-- ==========================================
-- INTAMBWE - Master Database Schema Migration
-- Migration: 001_initial_schema.sql
-- ==========================================

-- 1. Roles and Permissions
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 2. Users and Authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS student_profiles (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  school_name VARCHAR(200) NOT NULL,
  class_level VARCHAR(100) NOT NULL,
  country VARCHAR(100) DEFAULT 'Rwanda',
  preferred_language VARCHAR(50) DEFAULT 'English',
  phone VARCHAR(50),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 3. Education: Schools and Mentors
CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) UNIQUE NOT NULL,
  district VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Rwanda',
  contact_person VARCHAR(100),
  contact_email VARCHAR(150),
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Events & Conferences
CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  meeting_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  theme VARCHAR(250) NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue VARCHAR(250) NOT NULL,
  capacity INT DEFAULT 100,
  status VARCHAR(50) NOT NULL DEFAULT 'published',
  summary TEXT,
  outcomes TEXT,
  recommendations TEXT,
  cover_image_url TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(event_date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

CREATE TABLE IF NOT EXISTS meeting_schools (
  meeting_id INT REFERENCES meetings(id) ON DELETE CASCADE,
  school_id INT REFERENCES schools(id) ON DELETE CASCADE,
  PRIMARY KEY (meeting_id, school_id)
);

CREATE TABLE IF NOT EXISTS agenda_items (
  id SERIAL PRIMARY KEY,
  meeting_id INT REFERENCES meetings(id) ON DELETE CASCADE,
  session_title VARCHAR(200) NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  speaker_name VARCHAR(150),
  facilitator_name VARCHAR(150),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meeting_speakers (
  id SERIAL PRIMARY KEY,
  meeting_id INT REFERENCES meetings(id) ON DELETE CASCADE,
  speaker_name VARCHAR(150) NOT NULL,
  role_title VARCHAR(150),
  organization VARCHAR(150),
  bio TEXT,
  topic VARCHAR(200),
  image_url TEXT,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  meeting_id INT REFERENCES meetings(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_registrations_meeting ON event_registrations(meeting_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON event_registrations(user_id);

CREATE TABLE IF NOT EXISTS attendance_records (
  id SERIAL PRIMARY KEY,
  meeting_id INT REFERENCES meetings(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'present',
  marked_by INT REFERENCES users(id) ON DELETE SET NULL,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS meeting_reports (
  id SERIAL PRIMARY KEY,
  meeting_id INT REFERENCES meetings(id) ON DELETE CASCADE UNIQUE,
  total_registered INT DEFAULT 0,
  total_attended INT DEFAULT 0,
  key_learnings TEXT,
  participant_feedback_summary TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Learning & Resources
CREATE TABLE IF NOT EXISTS article_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon_name VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES article_categories(id) ON DELETE SET NULL,
  author_id INT REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(250) NOT NULL,
  slug VARCHAR(250) UNIQUE NOT NULL,
  introduction TEXT NOT NULL,
  content TEXT NOT NULL,
  learning_objectives TEXT,
  practical_exercises TEXT,
  critical_thinking_questions TEXT,
  reflection_activity TEXT,
  reading_time_minutes INT DEFAULT 5,
  status VARCHAR(50) NOT NULL DEFAULT 'published',
  cover_image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);

CREATE TABLE IF NOT EXISTS resource_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES resource_categories(id) ON DELETE SET NULL,
  title VARCHAR(250) NOT NULL,
  description TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL DEFAULT 'pdf',
  file_url TEXT NOT NULL,
  file_size_mb NUMERIC(5,2),
  is_public BOOLEAN DEFAULT true,
  download_count INT DEFAULT 0,
  uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  quote_text TEXT NOT NULL,
  author_name VARCHAR(150) NOT NULL,
  role_or_context VARCHAR(150),
  is_featured BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_submissions (
  id SERIAL PRIMARY KEY,
  challenge_id INT REFERENCES challenges(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  submission_text TEXT NOT NULL,
  attachment_url TEXT,
  status VARCHAR(50) DEFAULT 'submitted',
  feedback TEXT,
  reviewed_by INT REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_journals (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  lesson_reflected TEXT,
  reflection_content TEXT NOT NULL,
  action_commitment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_resources (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  resource_id INT REFERENCES resources(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  meeting_id INT REFERENCES meetings(id) ON DELETE SET NULL,
  certificate_code VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verification_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Community & Communication
CREATE TABLE IF NOT EXISTS discussion_topics (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussion_responses (
  id SERIAL PRIMARY KEY,
  topic_id INT REFERENCES discussion_topics(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
