-- Check if the test profiles were created successfully
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.admission_number,
  p.role,
  p.user_id,
  c.course_name,
  c.course_year,
  c.semester,
  c.course_group,
  u.name as university_name,
  co.name as country_name
FROM profiles p
JOIN classes c ON p.class_id = c.id
JOIN universities u ON c.university_id = u.id
JOIN countries co ON u.country_id = co.id
WHERE p.admission_number IN ('ADM001', 'ADM002', 'LEC001')
ORDER BY p.admission_number;

-- Also check if the auth users exist
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email IN (
  'john.doe@student.nairobi.ac.ke', 
  'jane.smith@student.nairobi.ac.ke', 
  'peter.kimani@nairobi.ac.ke'
);

-- Check the specific query that's failing
SELECT 
  p.*,
  c.university_id,
  u.name as university_name,
  co.name as country_name
FROM profiles p
JOIN classes c ON p.class_id = c.id
JOIN universities u ON c.university_id = u.id
JOIN countries co ON u.country_id = co.id
WHERE p.admission_number = 'ADM001'
  AND co.name = 'Kenya'
  AND u.name = 'University of Nairobi';
