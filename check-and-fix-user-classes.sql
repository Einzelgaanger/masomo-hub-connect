-- Check and fix user class assignments
-- This script helps identify and fix users who don't have proper class assignments

-- First, let's see what users don't have class assignments
SELECT 
  p.user_id,
  p.full_name,
  p.email,
  p.class_id,
  c.course_name,
  u.name as university_name
FROM public.profiles p
LEFT JOIN public.classes c ON p.class_id = c.id
LEFT JOIN public.universities u ON c.university_id = u.id
ORDER BY p.created_at DESC;

-- Check if there are any classes available
SELECT 
  c.id,
  c.course_name,
  c.university_id,
  u.name as university_name,
  COUNT(p.user_id) as student_count
FROM public.classes c
LEFT JOIN public.universities u ON c.university_id = u.id
LEFT JOIN public.profiles p ON c.id = p.class_id
GROUP BY c.id, c.course_name, c.university_id, u.name
ORDER BY c.course_name;

-- Check what universities exist
SELECT u.id, u.name, c.name as country_name 
FROM public.universities u
JOIN public.countries c ON u.country_id = c.id
ORDER BY u.name;

-- If you need to assign users to a class, use this template:
-- UPDATE public.profiles 
-- SET class_id = 'CLASS_ID_HERE'
-- WHERE user_id = 'USER_ID_HERE';

-- Example: Assign a user to the first available class
-- UPDATE public.profiles 
-- SET class_id = (SELECT id FROM public.classes LIMIT 1)
-- WHERE user_id = auth.uid() AND class_id IS NULL;
