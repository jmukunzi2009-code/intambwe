-- ========================================================
-- INTAMBWE - Migration 003: Complete Curriculum & Features
-- Migration: 003_complete_curriculum_and_features.sql
-- ========================================================

-- 1. Student Learning Progress Table
CREATE TABLE IF NOT EXISTS student_learning_progress (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  article_id INT REFERENCES articles(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON student_learning_progress(user_id);

-- 2. Seed Rich Articles for the remaining 5 Leadership Categories
INSERT INTO articles (category_id, title, slug, introduction, content, learning_objectives, practical_exercises, critical_thinking_questions, reflection_activity, reading_time_minutes, status)
SELECT 
  c.id,
  'The Power of Many: Building Cohesive and Resilient Student Teams',
  'building-cohesive-resilient-student-teams',
  'No individual leader achieves lasting transformation in isolation. True leadership is the art of orchestrating diverse talents, resolving friction with empathy, and uniting peers behind a shared community goal.',
  'Effective team dynamics in schools and youth groups do not happen by accident; they require deliberate cultivation of psychological safety, clear communication channels, and transparent accountability.\n\nGreat student leaders understand that diversity of perspective is a strength, not an inconvenience. When organizing a school debate club, a sports event, or an environmental project, the role of the team leader is not to dominate discussion, but to ensure every voice is valued and aligned toward common excellence.\n\nConflict is inevitable in any committed group. Rather than avoiding disagreement, effective leaders distinguish between cognitive disagreement (healthy debates about ideas) and affective friction (personal grievances). By focusing on core goals and shared values, leaders turn moments of disagreement into catalysts for collective innovation.',
  '1. Define the four stages of team formation: Forming, Storming, Norming, and Performing.\n2. Master collaborative consensus-building techniques for student committees.\n3. Implement structured de-escalation strategies when team conflicts arise.',
  'The Role Clarity Matrix: Take your current student council, sports team, or study group. Write down each member’s name, their primary superpower, and one specific deliverable they own this month. Share it openly to remove ambiguity.',
  '1. How do you respond when a team member fails to meet a deadline? Does your response inspire accountability or fear?\n2. What is the difference between true consensus and forced compliance?\n3. How can quiet team members be empowered to share their most brilliant ideas?',
  'Reflect on a team project you recently participated in. Identify one communication breakdown that occurred. What specific question could you have asked to prevent that misunderstanding?',
  6,
  'published'
FROM article_categories c WHERE c.slug = 'teamwork'
UNION ALL
SELECT 
  c.id,
  'Integrity Under Pressure: Ethical Decision Making in Student Life',
  'integrity-under-pressure-ethical-decisions',
  'Ethics is tested not in moments of comfort, but when standing for what is right carries personal risk or social friction. True leaders hold their moral ground when peer pressure is at its peak.',
  'Ethics is the compass that guides human behavior when no overseer, teacher, or parent is watching. In secondary schools and universities, students face subtle ethical crossroads daily: academic honesty, fairness in peer elections, standing against bullying, and managing collective funds.\n\nAn ethical leader recognizes that reputation takes years to build but can be compromised in a single moment of compromise. Ethical leadership is not merely the avoidance of wrongdoing; it is the active defense of fairness, truthfulness, and dignity.\n\nIn the Rwandan tradition of Ubupfura (noble character, integrity, and honor), ethical conduct is viewed as the cornerstone of community trust. By practicing radical transparency and holding oneself to the highest standards, young leaders earn the moral authority required to inspire others.',
  '1. Apply the "Front Page Test" and "Mirror Test" to evaluate ethical dilemmas in school.\n2. Understand the cognitive biases that tempt individuals to justify unethical shortcuts.\n3. Formulate moral courage strategies to speak up against peer injustice.',
  'The Ethical Dilemma Case Simulation: You observe a close friend copying exam notes in a national trial examination. Your silence protects your friend, but compromises academic fairness for everyone. Write a 200-word decision rationale balancing compassion with ethical integrity.',
  '1. Can an outcome ever be genuinely successful if the method used to achieve it was deceitful?\n2. What causes good people to remain silent in the face of recognized unfairness?\n3. How does personal integrity in school days predict leadership conduct in national governance?',
  'Identify one area in your student life where you feel tempted to cut corners or conform to low expectations. Draft a personal oath of integrity committing to principled action in that specific area.',
  7,
  'published'
FROM article_categories c WHERE c.slug = 'ethical-leadership'
UNION ALL
SELECT 
  c.id,
  'Human-Centered Problem Solving: From Community Challenges to Sustainable Solutions',
  'human-centered-problem-solving',
  'Innovation is not limited to software code or laboratory patents; it is the empathetic discovery of new pathways to solve everyday human struggles with resourcefulness and dignity.',
  'Young innovators in Rwanda are uniquely positioned to address grassroots challenges. From school campus waste reduction to peer mental health support and digital study groups, transformative solutions begin with deep empathy.\n\nDesign Thinking provides a systematic 5-step methodology for youth problem-solving: Empathize, Define, Ideate, Prototype, and Test. Instead of assuming what a school or community needs, student innovators spend time listening to stakeholders, observing bottlenecks, and understanding unstated frustrations.\n\nTrue innovation is distinguished by sustainability and resource efficiency. Rather than waiting for external funding, innovative youth harness local assets, peer volunteerism, and available materials to test functional prototypes quickly.',
  '1. Master the 5 stages of the Human-Centered Design process.\n2. Conduct empathetic user interviews with school peers and community members.\n3. Build low-cost pilot prototypes to test innovative concepts before full deployment.',
  'Campus Resource Mapping: Spend 30 minutes walking through your school or neighborhood. Identify three underutilized assets (e.g., idle library hours, scrap timber, unused bulletin boards) and brainstorm how they can solve an existing student need.',
  '1. Why do so many well-funded social projects fail because of a lack of initial empathy?\n2. How does embracing failure as educational feedback accelerate innovation?\n3. What is the difference between solving a symptom and eradicating a root cause?',
  'Choose one challenge in your school (e.g., textbook shortages, canteen queuing, or library noise). Write down 10 wild, unrestricted ideas to solve it, then select the most practical one to test as a pilot.',
  8,
  'published'
FROM article_categories c WHERE c.slug = 'innovation-and-problem-solving'
UNION ALL
SELECT 
  c.id,
  'Leading Beyond the School Gates: Civic Responsibility and Grassroots Impact in Rwanda',
  'leading-beyond-school-gates-civic-responsibility',
  'Leadership within the classroom finds its ultimate fulfillment when translated into service for the broader neighborhood, honoring Rwanda’s deep tradition of communal solidarity and Umuganda.',
  'A student leader’s perspective should never be confined by school fences. The ultimate purpose of acquiring knowledge, critical reasoning, and communication skills is to uplift society.\n\nIn Rwanda, community mobilization is anchored in our cultural values: Umuganda (collective service), Ubudehe (community problem-solving), and Imihigo (performance contracts grounded in public commitment). When secondary school students initiate reading camps for younger village children, organize tree-planting drives, or support elderly residents, they bridge the gap between classroom theory and societal vitality.\n\nCivic responsibility also means active stewardship of public resources, respect for the environment, and setting a daily example of civic pride and active citizenship.',
  '1. Understand the connection between Rwandan cultural institutions and modern civic leadership.\n2. Design and execute an impactful youth-led community service initiative.\n3. Measure tangible social return on community action projects.',
  'Community Action Proposal: Draft a one-page Imihigo (commitment pledge) for a 1-day community initiative you and your peers can conduct during holidays or school breaks.',
  '1. How does hands-on community service reshape a young person’s self-esteem and worldview?\n2. What makes community engagement sustainable rather than a one-time photo opportunity?\n3. In what ways can student councils partner with local sector and cell administrators in Rwanda?',
  'Reflect on your surrounding village, cell, or neighborhood. What is one persistent need that youth are capable of solving together? Write down your initial three action steps.',
  7,
  'published'
FROM article_categories c WHERE c.slug = 'community-leadership'
UNION ALL
SELECT 
  c.id,
  'Awakening Peer Potential: Mentorship, Voice, and African Youth Empowerment',
  'awakening-peer-potential-youth-empowerment',
  'Youth empowerment is not something bestowed by others; it is the conscious realization that young people are not merely future leaders, but active architects of society today.',
  'Across the African continent, youth comprise over 60 percent of the population. In Rwanda, young people are driving technological innovation, environmental conservation, and social progress. However, potential remains theoretical until unlocked through peer mentorship, structured platforms, and self-belief.\n\nPeer-to-peer mentorship is one of INTAMBWE’s most potent instruments. When an older secondary student mentors an incoming student, both grow exponentially. The mentor deepens their emotional intelligence and pedagogical clarity, while the mentee gains a relatable role model who navigated the exact same academic and social waters.\n\nTrue empowerment means cultivating "agency"—the internalized conviction that your actions matter, that your voice deserves to be heard, and that you possess the capacity to reshape your environment.',
  '1. Grasp the core dynamics of effective peer-to-peer mentorship models.\n2. Develop active advocacy skills to champion student welfare and voice.\n3. Create an empowering peer culture that celebrates classmates’ triumphs.',
  'The Peer Mentorship Contract: Pair up with a younger student in your school. Schedule two 30-minute mentoring conversations focused on study habits, goal setting, and building confidence in public speaking.',
  '1. Why is peer mentorship often more influential than formal adult lecturing?\n2. What internal barriers stop students from believing they have leadership potential?\n3. How can youth avoid the trap of waiting for someone else to grant them permission to lead?',
  'Write a short letter of encouragement to yourself as an incoming first-year student. What wisdom and courage would you share with your younger self?',
  6,
  'published'
FROM article_categories c WHERE c.slug = 'youth-leadership-and-empowerment'
ON CONFLICT (slug) DO NOTHING;

-- 3. Seed Additional Real Rwandan Educational Summits
INSERT INTO meetings (meeting_number, title, theme, description, event_date, start_time, end_time, venue, capacity, status, summary, outcomes, recommendations) VALUES
  (
    'INT-CONF-2026-03',
    'Rwanda Youth Innovation & Digital Ethics Summit',
    'Responsible Innovation: Shaping Africa’s Digital Renaissance',
    'Bringing together student innovators, STEM leaders, and civic technology advocates across secondary schools to address digital ethics, artificial intelligence in education, and cyber citizenship.',
    CURRENT_DATE + INTERVAL '35 days',
    '08:30:00'::TIME,
    '16:00:00'::TIME,
    'Kigali Innovation City Auditorium, Gasabo',
    300,
    'published',
    'A pioneering conference examining youth leadership in the digital era.',
    'Formulation of student digital ethics codes for participating secondary schools.',
    'Recommended inter-school coding and ethical debate challenges.'
  ),
  (
    'INT-CONF-2026-04',
    'National Secondary School Public Speaking & Debate Championship',
    'Spoken Conviction: Articulating Sustainable Solutions',
    'An intensive conference and competitive debate forum celebrating public speaking, persuasive advocacy, and constructive dialogue among high school student councils.',
    CURRENT_DATE + INTERVAL '60 days',
    '09:00:00'::TIME,
    '17:00:00'::TIME,
    'Green Hills Academy Main Theatre, Nyarugenge',
    200,
    'published',
    'Annual debating summit sharpening public speaking and constructive debate.',
    'Selection of top student advocates and distribution of leadership certificates.',
    'Recommended regular monthly debate clinics across all partner schools.'
  )
ON CONFLICT (meeting_number) DO NOTHING;

-- 4. Seed Agenda Items for Meeting 3
INSERT INTO agenda_items (meeting_id, session_title, description, start_time, end_time, speaker_name, facilitator_name, sort_order)
SELECT m.id, 'Registration & Digital Innovation Showcase', 'Delegates check-in, receive badges, and view student technology displays.', '08:30:00'::TIME, '09:30:00'::TIME, 'INTAMBWE Tech Committee', 'Student Ambassadors', 1
FROM meetings m WHERE m.meeting_number = 'INT-CONF-2026-03'
UNION ALL
SELECT m.id, 'Keynote: Digital Sovereignty & Youth Ethics', 'Opening keynote on navigating social media, AI tools, and data privacy with integrity.', '09:30:00'::TIME, '10:45:00'::TIME, 'Invited ICT Ministry Advisor', 'Irakoze Sarah Divine', 2
FROM meetings m WHERE m.meeting_number = 'INT-CONF-2026-03'
UNION ALL
SELECT m.id, 'Hack-a-Challenge: Building Solutions for Rwandan Schools', 'Breakout teams build prototype proposals for digital peer tutoring.', '11:00:00'::TIME, '13:00:00'::TIME, 'Innovation Coaches', 'Student Council Presidents', 3
FROM meetings m WHERE m.meeting_number = 'INT-CONF-2026-03'
UNION ALL
SELECT m.id, 'Presentation of Prototype Pledges & Certificate Ceremony', 'Schools present digital action commitments and receive participation accreditation.', '14:30:00'::TIME, '16:00:00'::TIME, 'Founder Irakoze Sarah Divine', 'Organizing Staff', 4
FROM meetings m WHERE m.meeting_number = 'INT-CONF-2026-03'
ON CONFLICT DO NOTHING;

-- 5. Seed Additional Interactive Resources
INSERT INTO resources (category_id, title, description, file_type, file_url, file_size_mb, is_public)
SELECT 
  rc.id,
  'Student Council Meeting Facilitation & Minutes Toolkit',
  'A structured guide with printable agendas, parliamentary procedure rules, and minute-taking templates for student leaders.',
  'guide',
  '/resources/meeting-facilitation-toolkit.pdf',
  2.10,
  true
FROM resource_categories rc WHERE rc.slug = 'leadership-guides'
UNION ALL
SELECT 
  rc.id,
  'Ethical Decision Making Flowchart & Assessment Rubric',
  'A handy pocket-guide flowchart assisting student leaders in evaluating moral dilemmas and peer pressures.',
  'worksheet',
  '/resources/ethical-decision-rubric.pdf',
  0.85,
  true
FROM resource_categories rc WHERE rc.slug = 'worksheets'
UNION ALL
SELECT 
  rc.id,
  'Case Study: Youth-Led Community Sanitation in Gasabo District',
  'An inspiring real-world case study detailing how high school leaders organized a sustainable recycling program.',
  'case_study',
  '/resources/case-study-gasabo-sanitation.pdf',
  1.75,
  true
FROM resource_categories rc WHERE rc.slug = 'case-studies'
ON CONFLICT DO NOTHING;

-- 6. Seed Sample Discussion Topics
INSERT INTO discussion_topics (user_id, title, content, is_pinned, is_approved)
SELECT 
  u.id,
  'How do we make student council elections more about ideas than popularity?',
  'In many secondary schools, student elections can become popularity contests rather than debates on school improvements. How can student leadership patron teachers and student candidates establish structured debates and manifestos to focus on real solutions?',
  true,
  true
FROM users u WHERE u.role = 'super_admin' LIMIT 1;
