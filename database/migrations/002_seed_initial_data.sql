-- ==========================================
-- INTAMBWE - Master Seed Data Migration
-- Migration: 002_seed_initial_data.sql
-- ==========================================

-- 1. Insert Roles
INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Founder / Super Administrator with unrestricted access'),
  ('admin', 'Platform Administrator with broad management rights'),
  ('event_manager', 'Manager of conferences, agendas, speakers, and attendance'),
  ('content_editor', 'Editor and publisher of educational articles and learning resources'),
  ('mentor', 'Distinguished speaker and leadership mentor'),
  ('student', 'Student and participant engaged in youth leadership programs'),
  ('visitor', 'Public visitor browsing leadership content')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Article Categories (8 Leadership Categories)
INSERT INTO article_categories (name, slug, description, icon_name) VALUES
  ('Self-Leadership', 'self-leadership', 'Mastering emotional intelligence, personal discipline, values, and vision for one’s life.', 'UserCheck'),
  ('Critical Thinking', 'critical-thinking', 'Developing deep reasoning, problem analysis, questioning assumptions, and strategic evaluation.', 'Brain'),
  ('Communication and Public Speaking', 'communication-and-public-speaking', 'Expressing ideas with clarity, persuasive speaking, active listening, and inspiring audiences.', 'Mic'),
  ('Teamwork', 'teamwork', 'Fostering collective collaboration, conflict resolution, active empathy, and shared achievement.', 'Users'),
  ('Ethical Leadership', 'ethical-leadership', 'Grounding leadership in integrity, transparency, accountability, and moral courage.', 'ShieldCheck'),
  ('Innovation and Problem-Solving', 'innovation-and-problem-solving', 'Creative approaches to modern challenges, design thinking, and resource-efficient solutions.', 'Lightbulb'),
  ('Community Leadership', 'community-leadership', 'Driving grassroots impact, civic responsibility, social service, and community mobilization.', 'HeartHandshake'),
  ('Youth Leadership and Empowerment', 'youth-leadership-and-empowerment', 'Unlocking youth potential, peer mentorship, global citizenship, and transformative advocacy.', 'Sparkles')
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Resource Categories
INSERT INTO resource_categories (name, slug, description) VALUES
  ('Leadership Guides', 'leadership-guides', 'Structured reference guides and manuals for student leaders.'),
  ('Interactive Worksheets', 'worksheets', 'Practical reflection templates, goal sheets, and self-assessments.'),
  ('Presentation Slides', 'presentations', 'Slide decks from INTAMBWE conferences and keynote sessions.'),
  ('Case Studies', 'case-studies', 'Real-world leadership case studies from Rwanda, Africa, and global pioneers.')
ON CONFLICT (slug) DO NOTHING;

-- 4. Insert Schools
INSERT INTO schools (name, district, country, contact_person, contact_email) VALUES
  ('Lycée de Kigali', 'Nyarugenge', 'Rwanda', 'Leadership Club Patron', 'info@ldk.rw'),
  ('FAWE Girls School Gisozi', 'Gasabo', 'Rwanda', 'Dean of Students', 'info@fawegirls.rw'),
  ('Green Hills Academy', 'Nyarugenge', 'Rwanda', 'Student Council Advisor', 'admissions@greenhillsacademy.rw'),
  ('Riviera High School', 'Gasabo', 'Rwanda', 'Head of Pastoral Care', 'info@rivierahighschool.org'),
  ('Wellspring Academy', 'Gasabo', 'Rwanda', 'Youth Coordinator', 'info@wellspringacademy.org')
ON CONFLICT (name) DO NOTHING;

-- 5. Insert Website Settings
INSERT INTO website_settings (setting_key, setting_value, description) VALUES
  ('site_name', 'INTAMBWE', 'Organization Brand Name'),
  ('tagline', 'Every Step Creates a Leader.', 'Official Organization Tagline'),
  ('philosophy', 'Learn. Think. Connect. Act. Create Impact.', 'Educational & Leadership Philosophy'),
  ('founder_name', 'Irakoze Sarah Divine', 'Founder of INTAMBWE'),
  ('founder_bio', 'A visionary young Rwandan leader whose international exposure and experiences exploring youth leadership in the United States inspired her to create INTAMBWE — a movement connecting students across schools to cultivate ethical, visionary African leadership.', 'Founder biography summary'),
  ('contact_email', 'contact@intambwe.org', 'Official Contact Email'),
  ('contact_phone', '+250 788 000 000', 'Official Telephone'),
  ('headquarters', 'Kigali, Rwanda', 'Organization Location'),
  ('stats_schools_count', '12', 'Participating schools counter'),
  ('stats_students_impacted', '850', 'Youth impacted metric')
ON CONFLICT (setting_key) DO NOTHING;

-- 6. Insert Quotes
INSERT INTO quotes (quote_text, author_name, role_or_context, is_featured) VALUES
  ('Leadership is not about a title or a podium; it begins in the quiet decisions of integrity you make when no one is watching.', 'Irakoze Sarah Divine', 'Founder, INTAMBWE', true),
  ('Do not wait until tomorrow to lead. The questions our communities face today require the clarity, courage, and action of youth right now.', 'Dr. Jean Bosco', 'Keynote Speaker & Educator', true),
  ('Every step taken in service of another person builds the foundation of lasting character.', 'Nelson Mandela', 'African Statesman', true)
ON CONFLICT DO NOTHING;

-- 7. Insert Real Seed Conferences
INSERT INTO meetings (meeting_number, title, theme, description, event_date, start_time, end_time, venue, capacity, status, summary, outcomes, recommendations) VALUES
  (
    'INT-CONF-2026-01',
    'INTAMBWE Inter-School Leadership Summit 2026',
    'Voices of Tomorrow: Ethical Action in an Interconnected World',
    'A landmark gathering bringing together over 200 student leaders, educators, and guest mentors from across Rwanda to explore integrity, ethical decision-making, and community engagement.',
    CURRENT_DATE + INTERVAL '14 days',
    '09:00:00',
    '16:30:00',
    'Kigali Conference Hall & Cultural Centre, Gasabo',
    250,
    'registration_open',
    'Annual summit focusing on building ethical resilience and cross-school collaboration among student councils.',
    'Formation of inter-school student leadership alliances and local community action pledges.',
    'Establishment of regular peer-mentorship sessions and follow-up reflection journals.'
  ),
  (
    'INT-CONF-2025-02',
    'Youth Empowerment & Critical Thinking Forum',
    'From Passive Learning to Active Solutions',
    'An intensive conference where students analyzed community challenges in sanitation, education, and digital literacy using human-centered design principles.',
    CURRENT_DATE - INTERVAL '45 days',
    '08:30:00',
    '15:00:00',
    'Lycée de Kigali Auditorium',
    180,
    'completed',
    'Over 160 students from 6 partner secondary schools participated in panel discussions and workshop breakout sessions.',
    'Five student-led action projects were formulated, tackling peer tutoring, environmental conservation, and library revitalization.',
    'Recommended ongoing monthly check-ins and the release of practical guides on critical reasoning.'
  )
ON CONFLICT (meeting_number) DO NOTHING;

-- 8. Seed Agenda for Meeting 1
INSERT INTO agenda_items (meeting_id, session_title, description, start_time, end_time, speaker_name, facilitator_name, sort_order)
SELECT m.id, 'Arrival, Registration & Networking Breakfast', 'Welcoming delegates, distribution of conference badges, and peer introductions.', '08:30:00'::TIME, '09:15:00'::TIME, 'INTAMBWE Host Team', 'Student Volunteers', 1
FROM meetings m WHERE m.meeting_number = 'INT-CONF-2026-01'
UNION ALL
SELECT m.id, 'Official Opening & Keynote: Every Step Creates a Leader', 'Opening remarks by Founder Irakoze Sarah Divine on the vision of INTAMBWE and our leadership journey.', '09:15:00'::TIME, '10:15:00'::TIME, 'Irakoze Sarah Divine', 'Master of Ceremonies', 2
FROM meetings m WHERE m.meeting_number = 'INT-CONF-2026-01'
UNION ALL
SELECT m.id, 'Panel Discussion: Leading With Integrity in the Digital Era', 'Interactive debate with student leaders and invited guest educators on digital ethics and responsibility.', '10:30:00'::TIME, '12:00:00'::TIME, 'Student Council Panelists & Mentors', 'Facilitator Dr. Bosco', 3
FROM meetings m WHERE m.meeting_number = 'INT-CONF-2026-01'
UNION ALL
SELECT m.id, 'Collaborative Problem-Solving Workshops', 'Small group breakout sessions tackling real community challenges across Rwandan districts.', '13:00:00'::TIME, '15:00:00'::TIME, 'Workshop Leaders', 'School Mentors', 4
FROM meetings m WHERE m.meeting_number = 'INT-CONF-2026-01'
UNION ALL
SELECT m.id, 'Action Pledges & Certificate of Participation Ceremony', 'Delegates present commitments and receive certificates of participation.', '15:15:00'::TIME, '16:30:00'::TIME, 'Founder & Guest Speakers', 'Organizing Committee', 5
FROM meetings m WHERE m.meeting_number = 'INT-CONF-2026-01';

-- 9. Seed Speakers for Meeting 1
INSERT INTO meeting_speakers (meeting_id, speaker_name, role_title, organization, bio, topic, sort_order)
SELECT m.id, 'Irakoze Sarah Divine', 'Founder & Director', 'INTAMBWE Youth Initiative', 'Rwandan youth leader whose international exposure and passion for youth mentorship led to the founding of INTAMBWE.', 'Every Step Creates a Leader: Awakening the Builder Inside', 1
FROM meetings m WHERE m.meeting_number = 'INT-CONF-2026-01'
UNION ALL
SELECT m.id, 'Dr. Emmanuel Rutayisire', 'Senior Lecturer & Leadership Coach', 'African Leadership Center', 'Scholar and community mentor dedicated to youth civic engagement and ethical governance.', 'Ethical Decision Making When Facing Peer Pressure', 2
FROM meetings m WHERE m.meeting_number = 'INT-CONF-2026-01';

-- 10. Seed Core Leadership Articles
INSERT INTO articles (category_id, title, slug, introduction, content, learning_objectives, practical_exercises, critical_thinking_questions, reflection_activity, reading_time_minutes, status)
SELECT 
  c.id,
  'The Architecture of Self-Leadership: Mastering the Inner Landscape',
  'architecture-of-self-leadership',
  'Before one can inspire a team, organize a movement, or lead a nation, one must first learn to guide oneself. Self-leadership is the foundation upon which all other leadership dimensions rest.',
  'Self-leadership is the deliberate practice of understanding who you are, what values steer your decisions, and managing your thoughts, actions, and energy toward purposeful goals.\n\nIn our daily lives as students and young citizens, distractions and external pressures abound. True leaders cultivate internal discipline. This means honoring commitments made to oneself, maintaining consistency in study and ethical conduct, and treating setbacks as laboratory data for personal growth.',
  '1. Understand the core principles of emotional regulation and self-awareness.\n2. Identify personal values and create non-negotiable ethical standards.\n3. Develop daily habits that reinforce self-accountability.',
  'Personal Integrity Audit: Write down 3 commitments you made to yourself this week. Assess whether you honored them. For any commitment missed, write down the root cause and how you will address it next time.',
  '1. If your actions when alone were broadcasted publicly, would they reflect the values you speak about?\n2. What is the difference between being motivated and being disciplined?\n3. How does self-leadership protect a leader from the corruption of praise or criticism?',
  'Spend 10 minutes in quiet journaling. Complete this sentence: "The one area of my life where I must take stronger ownership right now is..." Outline two immediate steps.',
  6,
  'published'
FROM article_categories c WHERE c.slug = 'self-leadership'
UNION ALL
SELECT 
  c.id,
  'Critical Thinking: Dissecting Information in an Age of Clutter',
  'critical-thinking-dissecting-information',
  'In the modern information ecosystem, youth are bombarded with opinions, claims, and persuasive rhetoric. A genuine leader does not merely consume information; they scrutinize it with rigor and empathy.',
  'Critical thinking is not about cynicism or looking for faults; it is the art of clear, reasoned, and reflective thinking focused on deciding what to believe or do.\n\nGreat leaders evaluate evidence, recognize cognitive biases, trace root causes, and remain humble enough to change their perspective when presented with superior reasoning.',
  '1. Distinguish between emotional assertion and verifiable evidence.\n2. Recognize common logical fallacies in peer debates and media.\n3. Formulate well-reasoned arguments grounded in factual context.',
  'The 5-Whys Root Cause Analysis: Take a real challenge in your school or neighborhood (such as classroom litter or peer apathy). Ask "Why?" five consecutive times to dig beneath superficial symptoms to uncover the root cause.',
  '1. How often do you seek out opinions that challenge your existing beliefs?\n2. What makes an argument convincing: its emotional intensity or its factual coherence?\n3. In what situations can peer pressure distort our logical evaluation?',
  'Identify a recent topic where you held a strong opinion. Write down the strongest counter-argument against your position, as fairly and accurately as possible.',
  7,
  'published'
FROM article_categories c WHERE c.slug = 'critical-thinking'
UNION ALL
SELECT 
  c.id,
  'The Power of Spoken Conviction: Communicating with Clarity and Dignity',
  'power-of-spoken-conviction',
  'Ideas remain dormant until given voice. Effective leadership communication is not about grandiloquent vocabulary; it is about resonance, authentic conviction, and deep listening.',
  'Public speaking is a trainable skill, not an innate privilege. When addressing an assembly, a student council, or a community circle, the communicator serves the audience.\n\nBy structuring your thoughts into clear pillars—Problem, Vision, and Action—you invite listeners into a shared narrative of hope and responsibility.',
  '1. Structure a persuasive 3-minute leadership speech using the Problem-Vision-Action framework.\n2. Overcome speech anxiety through breath control and mental centering.\n3. Practice active, non-judgmental listening in group discussions.',
  'The 2-Minute Elevator Pitch: Draft and deliver a 2-minute spoken pitch explaining why student voice matters in your school community. Record yourself on your phone or practice in front of a mirror.',
  '1. Why is listening considered the most overlooked half of communication?\n2. How does body language alter the reception of spoken words?\n3. How can a speaker inspire others without resorting to manipulation or fear?',
  'Reflect on a speech or presentation you recently watched. What made it memorable or forgettable? Note down 2 techniques you can adopt.',
  5,
  'published'
FROM article_categories c WHERE c.slug = 'communication-and-public-speaking'
ON CONFLICT (slug) DO NOTHING;

-- 11. Seed Educational Resources
INSERT INTO resources (category_id, title, description, file_type, file_url, file_size_mb, is_public)
SELECT 
  rc.id,
  'INTAMBWE Student Leadership Handbook 2026',
  'Comprehensive handbook on leadership principles, meeting facilitation, and community engagement for high school leaders.',
  'pdf',
  '/resources/intambwe-student-leadership-handbook.pdf',
  3.40,
  true
FROM resource_categories rc WHERE rc.slug = 'leadership-guides'
UNION ALL
SELECT 
  rc.id,
  'Personal Leadership Reflection Journal Template',
  'A printable multi-week journal for setting weekly goals, tracking ethical commitments, and recording leadership growth.',
  'worksheet',
  '/resources/personal-leadership-reflection-journal.pdf',
  1.15,
  true
FROM resource_categories rc WHERE rc.slug = 'worksheets'
UNION ALL
SELECT 
  rc.id,
  'Keynote Presentation: Voices of Tomorrow Summit Slides',
  'Full slide deck accompanying Founder Irakoze Sarah Divine’s opening address at the Inter-School Leadership Summit.',
  'presentation',
  '/resources/voices-of-tomorrow-summit.pdf',
  4.80,
  true
FROM resource_categories rc WHERE rc.slug = 'presentations'
ON CONFLICT DO NOTHING;

-- 12. Seed Leadership Challenge
INSERT INTO challenges (title, description, instructions, start_date, end_date, is_active) VALUES
  (
    'Step Forward: The Community Action Challenge',
    'Identify a concrete, practical need in your school or neighborhood and design a youth-led action plan to address it.',
    '1. Form a team of 2-4 students or participate individually.\n2. Identify a tangible problem (e.g., student mentorship, campus greening, peer reading assistance).\n3. Outline: Problem Statement, Planned Action, Required Resources, and Expected Impact.\n4. Submit your written proposal (300-600 words) through your Student Dashboard.',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '25 days',
    true
  )
ON CONFLICT DO NOTHING;
