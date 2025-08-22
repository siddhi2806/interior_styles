-- Run this in your Supabase SQL Editor to populate the styles table

INSERT INTO styles (name, description) VALUES
('Industrial', 'Exposed beams, concrete, raw metal'),
('Minimalist', 'Clean lines, clutter-free, neutral palette'),
('Rustic', 'Warm woods, earthy textiles, cozy'),
('Scandinavian', 'Bright, light wood, cozy minimal'),
('Bohemian', 'Colorful textiles, plants, eclectic'),
('Modern', 'Sleek furniture, polished surfaces')
ON CONFLICT (name) DO NOTHING;
