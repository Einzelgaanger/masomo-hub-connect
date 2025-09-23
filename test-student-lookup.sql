-- Test the student lookup query directly
-- This will help us understand why the 406 error is occurring

-- First, let's check if RLS is enabled on the profiles table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Check what policies exist on the profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Test the exact query that's failing
-- This is the query the application is trying to run
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

-- If the above query works, then the issue is with RLS policies
-- Let's temporarily disable RLS on profiles table for testing
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- After disabling RLS, test the query again
-- Then re-enable RLS when done: ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
