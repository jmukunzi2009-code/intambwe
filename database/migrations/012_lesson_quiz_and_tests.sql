-- ==========================================
-- Migration: 012_lesson_quiz_and_tests.sql
-- Custom Lesson Knowledge Check & Step Completion Tests
-- ==========================================

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS quiz_question TEXT,
  ADD COLUMN IF NOT EXISTS quiz_options JSONB,
  ADD COLUMN IF NOT EXISTS quiz_correct_index INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quiz_explanation TEXT;

-- Seed default customized tests for existing published articles
UPDATE articles
SET 
  quiz_question = COALESCE(quiz_question, 'What is the primary foundation of self-leadership according to this lesson?'),
  quiz_options = COALESCE(quiz_options, '["Mastering internal discipline, self-awareness, and personal integrity before leading others", "Waiting for instructions from teachers or parents before acting", "Seeking popular praise and public approval above all else", "Avoiding difficult conversations and peer accountability"]'::jsonb),
  quiz_correct_index = COALESCE(quiz_correct_index, 0),
  quiz_explanation = COALESCE(quiz_explanation, 'Excellence in leadership begins from the inside out: by mastering yourself, your character, and your word, you earn the moral authority to inspire others.')
WHERE slug = 'architecture-of-self-leadership';

UPDATE articles
SET 
  quiz_question = COALESCE(quiz_question, 'What defines taking "the first step" of a young leader?'),
  quiz_options = COALESCE(quiz_options, '["Taking initiative on an everyday problem without waiting for external permission", "Criticizing what others are doing wrong without offering solutions", "Holding a title or elected office in school", "Speaking the loudest in a group debate"]'::jsonb),
  quiz_correct_index = COALESCE(quiz_correct_index, 0),
  quiz_explanation = COALESCE(quiz_explanation, 'Leadership is not a title; it is the courage to take the first proactive step toward positive change.')
WHERE slug = 'first-step-of-a-leader';

UPDATE articles
SET 
  quiz_question = COALESCE(quiz_question, 'How does a critical thinker evaluate claims in an age of media noise?'),
  quiz_options = COALESCE(quiz_options, '["Examining underlying evidence, testing assumptions, and questioning biases before forming a conclusion", "Believing information immediately if it confirms their existing opinion", "Forwarding unverified news to group chats", "Ignoring alternative viewpoints that challenge their assumptions"]'::jsonb),
  quiz_correct_index = COALESCE(quiz_correct_index, 0),
  quiz_explanation = COALESCE(quiz_explanation, 'Critical thinking demands verifying sources, testing assumptions, and seeking truth with humility.')
WHERE slug = 'critical-thinking-dissecting-information';

UPDATE articles
SET 
  quiz_question = COALESCE(quiz_question, 'What is the core purpose of public speaking and conviction?'),
  quiz_options = COALESCE(quiz_options, '["Communicating with clarity, dignity, and empathy to move a group toward collective action", "Dominating the conversation and out-shouting opposing voices", "Using complex vocabulary to impress the audience", "Memorizing speeches without understanding the core message"]'::jsonb),
  quiz_correct_index = COALESCE(quiz_correct_index, 0),
  quiz_explanation = COALESCE(quiz_explanation, 'Genuine public speaking builds conviction, elevates dignity, and inspires constructive action.')
WHERE slug = 'power-of-spoken-conviction';
