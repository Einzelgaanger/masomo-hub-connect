-- Create a test profile for John Doe
-- This will allow testing the student lookup functionality

-- First, create a test auth user
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'john.doe@student.nairobi.ac.ke',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"John Doe"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
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
  profile_picture_url,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'John Doe',
  'john.doe@student.nairobi.ac.ke',
  'ADM001',
  'student',
  (SELECT id FROM classes 
   WHERE course_name = 'Computer Science' 
   AND course_year = 1 
   AND semester = 1 
   AND course_group = 'Group A'
   AND university_id = (SELECT id FROM universities WHERE name = 'University of Nairobi')),
  150,
  'silver',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Also create a test profile for Jane Smith
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'jane.smith@student.nairobi.ac.ke',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Jane Smith"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

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
  profile_picture_url,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002',
  'Jane Smith',
  'jane.smith@student.nairobi.ac.ke',
  'ADM002',
  'student',
  (SELECT id FROM classes 
   WHERE course_name = 'Computer Science' 
   AND course_year = 1 
   AND semester = 1 
   AND course_group = 'Group A'
   AND university_id = (SELECT id FROM universities WHERE name = 'University of Nairobi')),
  200,
  'gold',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Create a test lecturer profile
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'peter.kimani@nairobi.ac.ke',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. Peter Kimani"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

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
  profile_picture_url,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000003',
  'Dr. Peter Kimani',
  'peter.kimani@nairobi.ac.ke',
  'LEC001',
  'lecturer',
  (SELECT id FROM classes 
   WHERE course_name = 'Computer Science' 
   AND course_year = 1 
   AND semester = 1 
   AND course_group = 'Group A'
   AND university_id = (SELECT id FROM universities WHERE name = 'University of Nairobi')),
  0,
  'diamond',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Verify the profiles were created
SELECT 
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
WHERE p.admission_number IN ('ADM001', 'ADM002', 'LEC001');
