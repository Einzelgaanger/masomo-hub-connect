-- Simple diagnostic queries to check current state
-- Run these one by one in your Supabase SQL Editor

-- 1. Check if you have any uploads
SELECT COUNT(*) as total_uploads FROM public.uploads;

-- 2. Check your profile
SELECT user_id, full_name, email, class_id FROM public.profiles WHERE user_id = auth.uid();

-- 3. Check what classes exist
SELECT id, course_name, university_id FROM public.classes LIMIT 5;

-- 4. Check what universities exist  
SELECT id, name FROM public.universities LIMIT 5;

-- 5. Check recent uploads (last 10)
SELECT id, title, upload_type, created_at, uploaded_by 
FROM public.uploads 
ORDER BY created_at DESC 
LIMIT 10;
