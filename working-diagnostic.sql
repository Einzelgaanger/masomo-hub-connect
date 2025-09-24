-- Working diagnostic queries with correct column names
-- Run these one by one in your Supabase SQL Editor

-- 1. Check if you have any uploads
SELECT COUNT(*) as total_uploads FROM public.uploads;

-- 2. Check your profile
SELECT user_id, full_name, email, class_id FROM public.profiles WHERE user_id = auth.uid();

-- 3. Check what classes exist (with correct column names)
SELECT id, course_name, university_id FROM public.classes LIMIT 5;

-- 4. Check what universities exist  
SELECT id, name FROM public.universities LIMIT 5;

-- 5. Check recent uploads (last 10)
SELECT id, title, upload_type, created_at, uploaded_by 
FROM public.uploads 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Check user class assignments
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
ORDER BY p.created_at DESC
LIMIT 10;
