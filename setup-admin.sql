-- Bunifu Admin Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Add sample countries
INSERT INTO countries (name) VALUES 
  ('Kenya'), 
  ('Uganda'), 
  ('Tanzania'),
  ('Nigeria'),
  ('Ghana')
ON CONFLICT (name) DO NOTHING;

-- 2. Add sample universities
INSERT INTO universities (country_id, name) 
SELECT c.id, univ.name
FROM countries c
CROSS JOIN (VALUES 
  ('University of Nairobi'),
  ('Kenyatta University'),
  ('Makerere University'),
  ('University of Dar es Salaam'),
  ('University of Lagos')
) AS univ(name)
WHERE c.name = 'Kenya'
ON CONFLICT (country_id, name) DO NOTHING;

-- 3. Create a sample class
INSERT INTO classes (university_id, course_name, course_year, semester, course_group)
SELECT u.id, 'Computer Science', 1, 1, 'Group A'
FROM universities u 
WHERE u.name = 'University of Nairobi'
ON CONFLICT DO NOTHING;

-- 4. Add sample units to the class
INSERT INTO units (class_id, name, description)
SELECT c.id, unit_name, unit_desc
FROM classes c 
CROSS JOIN (VALUES 
  ('Introduction to Programming', 'Basic programming concepts and problem solving'),
  ('Data Structures', 'Fundamental data structures and algorithms'),
  ('Database Systems', 'Introduction to database design and management'),
  ('Web Development', 'HTML, CSS, JavaScript and modern web frameworks'),
  ('Software Engineering', 'Software development methodologies and practices')
) AS units(unit_name, unit_desc)
WHERE c.course_name = 'Computer Science'
ON CONFLICT DO NOTHING;

-- 5. Create admin user (replace with your email)
-- First create the user in Authentication → Users in Supabase Dashboard
-- Then run this to make them a super admin:

UPDATE profiles 
SET 
  full_name = 'System Administrator',
  role = 'super_admin',
  admission_number = 'ADMIN001',
  class_id = (SELECT id FROM classes WHERE course_name = 'Computer Science' LIMIT 1)
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@bunifu.com'  -- Replace with your admin email
);

-- 6. Create sample students for testing
INSERT INTO profiles (user_id, full_name, email, admission_number, role, class_id)
SELECT 
  gen_random_uuid(),
  student_name,
  student_email,
  student_adm,
  'student',
  (SELECT id FROM classes WHERE course_name = 'Computer Science' LIMIT 1)
FROM (VALUES 
  ('John Doe', 'john.doe@student.nairobi.ac.ke', 'ADM001'),
  ('Jane Smith', 'jane.smith@student.nairobi.ac.ke', 'ADM002'),
  ('Mike Johnson', 'mike.johnson@student.nairobi.ac.ke', 'ADM003')
) AS students(student_name, student_email, student_adm)
ON CONFLICT (email) DO NOTHING;

-- 7. Create sample announcement
INSERT INTO announcements (title, content, university_id, created_by)
SELECT 
  'Welcome to Bunifu!',
  'Welcome to our new learning platform. Here you can share notes, access past papers, and track your academic progress. Start by exploring your units and uploading your first note!',
  u.id,
  (SELECT id FROM auth.users WHERE email = 'admin@bunifu.com' LIMIT 1)
FROM universities u 
WHERE u.name = 'University of Nairobi'
ON CONFLICT DO NOTHING;
