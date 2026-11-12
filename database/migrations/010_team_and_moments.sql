-- 010_team_and_moments.sql
-- Team members and community moments dynamic management for About & Community pages

CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  bio TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_moments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  author_quote TEXT,
  author_name VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial team members if empty
INSERT INTO team_members (name, role, bio, image_url, sort_order, is_active)
SELECT 'Irakoze Sarah Divine', 'Founder & Executive Director', 'Visionary young Rwandan leader dedicated to equipping secondary school students with ethical leadership, public speaking, and community action skills.', '/about/sarah-image.jpg', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Irakoze Sarah Divine');

INSERT INTO team_members (name, role, bio, image_url, sort_order, is_active)
SELECT 'Alliance Uwase', 'Director of Curriculum & Youth Education', 'Passionate educator designing interactive leadership workshops, peer-led debates, and critical thinking frameworks.', '/about/profile.png', 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Alliance Uwase');

INSERT INTO team_members (name, role, bio, image_url, sort_order, is_active)
SELECT 'Patrick Mugabo', 'Coordinator of Conferences & School Partnerships', 'Leads logistics, inter-school council summits, and delegate coordination across Kigali and provincial schools.', '/about/group-photo.jpg', 3, TRUE
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE name = 'Patrick Mugabo');

-- Seed initial community moments if empty
INSERT INTO community_moments (title, description, image_url, author_quote, author_name, sort_order, is_active)
SELECT 'Team Spirit & Inter-School Collaboration', 'Every INTAMBWE gathering creates space for encouragement, collaboration, and practical leadership in motion across secondary school students.', '/about/group-photo.jpg', 'Strong teams grow through honest conversations and shared action.', 'INTAMBWE Youth Council', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM community_moments WHERE title = 'Team Spirit & Inter-School Collaboration');

INSERT INTO community_moments (title, description, image_url, author_quote, author_name, sort_order, is_active)
SELECT 'Good Company, Meaningful Learning & Joyful Growth', 'The INTAMBWE experience is not only about ideas—it is also about joy, belonging, and the confidence to keep moving forward into your school council.', '/about/sarah-image.jpg', 'When young people are taught to think deeply, listen generously, and act with integrity, their communities transform.', 'Irakoze Sarah Divine', 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM community_moments WHERE title = 'Good Company, Meaningful Learning & Joyful Growth');
