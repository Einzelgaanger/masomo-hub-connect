-- Simple test profile creation
-- This creates a minimal test profile for John Doe

-- First, let's check what classes exist
SELECT 
  c.id,
  c.course_name,
  c.course_year,
  c.semester,
  c.course_group,
  u.name as university_name,
  co.name as country_name
FROM classes c
JOIN universities u ON c.university_id = u.id
JOIN countries co ON u.country_id = co.id
WHERE c.course_name = 'Computer Science' 
  AND c.course_year = 1 
  AND c.semester = 1 
  AND c.course_group = 'Group A'
  AND u.name = 'University of Nairobi';

-- Create a simple auth user for John Doe
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'john.doe@student.nairobi.ac.ke',
  '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"John Doe"}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create the profile for John Doe
INSERT INTO profiles (
  id,
  user_id,
  full_name,
  email,
  admission_number,
  role,
  class_id,
  points,
  rank,
  created_at,
  updated_at
) 
SELECT 
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'John Doe',
  'john.doe@student.nairobi.ac.ke',
  'ADM001',
  'student',
  c.id,
  150,
  'silver',
  NOW(),
  NOW()
FROM classes c
JOIN universities u ON c.university_id = u.id
JOIN countries co ON u.country_id = co.id
WHERE c.course_name = 'Computer Science' 
  AND c.course_year = 1 
  AND c.semester = 1 
  AND c.course_group = 'Group A'
  AND u.name = 'University of Nairobi'
  AND co.name = 'Kenya'
ON CONFLICT (id) DO NOTHING;

-- Verify the profile was created
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.admission_number,
  p.role,
  c.course_name,
  u.name as university_name,
  co.name as country_name
FROM profiles p
JOIN classes c ON p.class_id = c.id
JOIN universities u ON c.university_id = u.id
JOIN countries co ON u.country_id = co.id
WHERE p.admission_number = 'ADM001';
