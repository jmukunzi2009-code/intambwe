-- Conference studio, peer stick notes, and a pathway certificate
-- issued when a student finishes every published lesson.

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS certificate_kind VARCHAR(40);

UPDATE certificates
SET certificate_kind = CASE
  WHEN meeting_id IS NOT NULL THEN 'conference'
  WHEN article_id IS NOT NULL THEN 'lesson'
  ELSE 'pathway'
END
WHERE certificate_kind IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_user_pathway
  ON certificates(user_id)
  WHERE certificate_kind = 'pathway';

CREATE TABLE IF NOT EXISTS stick_notes (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  note_kind VARCHAR(40) NOT NULL DEFAULT 'reflection',
  media_url TEXT,
  media_type VARCHAR(20) DEFAULT 'none',
  visibility VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by INT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stick_notes_visibility ON stick_notes(visibility, created_at DESC);

INSERT INTO quotes (quote_text, author_name, role_or_context, is_featured) VALUES
  ('A leader is the one who walks the first step so others can see the path.', 'Irakoze Sarah Divine', 'Founder, INTAMBWE', true),
  ('Umuganda teaches us that a community becomes strong when every person brings one honest effort.', 'INTAMBWE Circle', 'Rwandan youth leadership', true),
  ('Courage is a quiet decision: tell the truth, keep your word, and lift someone else.', 'INTAMBWE Mentors', 'Motivation for student delegates', false);

UPDATE meetings
SET
  cover_image_url = COALESCE(cover_image_url, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'),
  video_url = COALESCE(video_url, 'https://www.youtube.com/embed/qp0HIF3SfI4'),
  gallery_urls = CASE
    WHEN gallery_urls IS NULL OR gallery_urls = '[]'::jsonb THEN '[
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80"
    ]'::jsonb
    ELSE gallery_urls
  END
WHERE cover_image_url IS NULL OR video_url IS NULL OR gallery_urls IS NULL OR gallery_urls = '[]'::jsonb;

INSERT INTO articles (
  category_id, title, slug, introduction, content,
  learning_objectives, practical_exercises, critical_thinking_questions, reflection_activity,
  reading_time_minutes, status, cover_image_url, video_url
)
SELECT
  c.id,
  'Lesson 1: The First Step of a Leader',
  'first-step-of-a-leader',
  'Leadership begins before a title. This opening lesson helps a student notice one daily habit that already shapes how other people experience them.',
  'Every leader in a classroom, a club, or a village starts with a single visible step. In Rwanda, young people learn this through service, study, and the courage to speak with respect.' || E'\n\n' ||
  'Your first step is not a speech. It is a promise you can keep this week: arrive prepared, listen before you answer, and finish the task you accepted. People trust a leader whose actions match their words.' || E'\n\n' ||
  'Practice this lesson by choosing one person you will encourage and one responsibility you will complete without being reminded.',
  '1. Name one leadership habit you already practice.' || E'\n' || '2. Explain why trust grows from small kept promises.' || E'\n' || '3. Choose a first step you can finish in seven days.',
  'Write your name, one responsibility, and the day you will complete it. Tell a classmate so the promise is visible.',
  '1. What makes a first step believable to other students?' || E'\n' || '2. How does waiting for a title delay service?',
  'Stick a short note: “This week I will lead by …” and keep it where you study.',
  6,
  'published',
  'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=80',
  'https://www.youtube.com/embed/qp0HIF3SfI4'
FROM article_categories c
WHERE c.slug = 'self-leadership'
UNION ALL
SELECT
  c.id,
  'Practice Studio: Lead a Ten-Minute Circle',
  'practice-studio-ten-minute-circle',
  'This practice lesson turns communication into action. Students learn how to open a short peer circle, ask one strong question, and close with a shared commitment.',
  'A ten-minute leadership circle can happen after class, during a club meeting, or before Umuganda planning. The facilitator does four things: welcome people by name, state the purpose, ask one question, and write the commitment everyone agrees to keep.' || E'\n\n' ||
  'The question should be specific. “How do we help one younger student this month?” is stronger than “What is leadership?” A good circle ends with a name next to an action, not with a long speech.' || E'\n\n' ||
  'When you practice, notice who has not spoken. Invite that person with a direct, kind question. Leadership in motion is the room becoming braver because you made space.',
  '1. Open, guide, and close a ten-minute peer circle.' || E'\n' || '2. Ask a question that leads to action.' || E'\n' || '3. Record one commitment from the group.',
  'Host a practice circle with three classmates. Use this order: welcome (1 minute), purpose (1 minute), one question (6 minutes), commitment (2 minutes).',
  '1. Why does a short circle sometimes teach more than a long lecture?' || E'\n' || '2. How do you invite a quiet student without putting them on the spot?',
  'Write the commitment your circle chose and bring it to your next INTAMBWE lesson.',
  8,
  'published',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  'https://www.youtube.com/embed/i0a61wFaQD8'
FROM article_categories c
WHERE c.slug = 'communication-and-public-speaking'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO stick_notes (user_id, title, body, note_kind, media_url, media_type, visibility, reviewed_at)
SELECT u.id, note.title, note.body, note.note_kind, note.media_url, note.media_type,
       CASE WHEN note.note_kind = 'reflection' THEN 'secret' ELSE 'published' END, NOW()
FROM users u
CROSS JOIN (
  VALUES
    (
      'A step you can see',
      'Leadership is the courage to take the first honest step, then invite someone to walk with you.',
      'quote',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80',
      'image'
    ),
    (
      'Speak so the room can act',
      'A useful speech names one problem, one person who is affected, and one action the group can finish this week.',
      'speech',
      NULL,
      'none'
    ),
    (
      'Peer reflection starter',
      'After a lesson, write three lines: what I understood, what I will practice, and who I will help. That note is how learning becomes leadership.',
      'reflection',
      NULL,
      'none'
    )
) AS note(title, body, note_kind, media_url, media_type)
WHERE u.role = 'super_admin'
LIMIT 3;
