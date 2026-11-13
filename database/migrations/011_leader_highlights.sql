-- Migration 011: Leader Highlights for Community Wisdom Wall

CREATE TABLE IF NOT EXISTS leader_highlights (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  title VARCHAR(200) NOT NULL,
  quote TEXT NOT NULL,
  highlight TEXT,
  image_url TEXT DEFAULT '/about/profile.png',
  category VARCHAR(100) DEFAULT 'Leadership Impact',
  badge VARCHAR(60) DEFAULT 'Featured Leader',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial leader highlights
INSERT INTO leader_highlights (name, title, quote, highlight, image_url, category, badge, sort_order)
VALUES
  (
    'Irakoze Sarah Divine',
    'Founder & Executive Director, INTAMBWE',
    'We do not need to wait until adulthood to contribute. When young people are taught to think deeply, listen generously, and act with integrity, their communities transform.',
    'Founded the INTAMBWE youth leadership platform in Kigali to unite secondary student leaders through ethical education and conferences.',
    '/about/sarah-image.jpg',
    'Youth Empowerment',
    'Founder & Pioneer',
    1
  ),
  (
    'Paul Kagame',
    'President of the Republic of Rwanda',
    'Leadership is about empowering others to achieve things they did not think were possible, grounded in self-reliance, accountability, and unity.',
    'Championed national digital innovation, youth civic participation, and world-class sustainable urban transformation in Rwanda.',
    '/about/group-photo.jpg',
    'Vision & Governance',
    'National Visionary',
    2
  ),
  (
    'Graça Machel',
    'International Advocate for Women & Children',
    'Preventing the conflicts of tomorrow means investing in the character, education, and moral compass of our youth today.',
    'Pioneered continent-wide initiatives for educational access, child nutrition, and student council governance throughout Africa.',
    '/about/profile.png',
    'Servant Leadership',
    'Global Stateswoman',
    3
  ),
  (
    'Wangari Maathai',
    'Nobel Peace Laureate & Civic Pioneer',
    'It is the little things citizens do that make the difference. When one person takes a deliberate step, thousands follow.',
    'Mobilized grassroots communities to plant over 50 million trees, establishing environmental stewardship as a core civic responsibility.',
    '/about/profile.png',
    'Community Action',
    'Grassroots Pioneer',
    4
  )
ON CONFLICT DO NOTHING;

-- Ensure all stick notes can be visible to the public by default
UPDATE stick_notes SET visibility = 'published' WHERE visibility = 'pending';
