-- FINAL WORKING SCRIPTS - All tested and working
-- Run these in your Supabase SQL Editor

-- ==============================================
-- 1. UPLOAD VISIBILITY FIX (WORKING)
-- ==============================================
-- This fixes the upload visibility issue completely

DROP POLICY IF EXISTS "Users can view uploads in their class units" ON public.uploads;
DROP POLICY IF EXISTS "Uploads are viewable by class members" ON public.uploads;
DROP POLICY IF EXISTS "Users can create uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can update their own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users and lecturers can delete uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can upload to their class units" ON public.uploads;
DROP POLICY IF EXISTS "Users can update their own uploads, lecturers can update all" ON public.uploads;
DROP POLICY IF EXISTS "Users can delete their own uploads, lecturers can delete all" ON public.uploads;
DROP POLICY IF EXISTS "All authenticated users can view uploads" ON public.uploads;
DROP POLICY IF EXISTS "Authenticated users can upload" ON public.uploads;
DROP POLICY IF EXISTS "Users can update own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can delete own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can view uploads in their class or all if no class" ON public.uploads;
DROP POLICY IF EXISTS "Users can delete own uploads, admins can delete any" ON public.uploads;

CREATE POLICY "All authenticated users can view uploads" ON public.uploads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can upload" ON public.uploads
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own uploads" ON public.uploads
  FOR UPDATE TO authenticated USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete own uploads" ON public.uploads
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 2. DIAGNOSTIC QUERIES (WORKING)
-- ==============================================
-- Run these one by one to check your current state

-- Check total uploads
SELECT COUNT(*) as total_uploads FROM public.uploads;

-- Check your profile
SELECT user_id, full_name, email, class_id FROM public.profiles WHERE user_id = auth.uid();

-- Check classes (with correct column names)
SELECT id, course_name, university_id FROM public.classes LIMIT 5;

-- Check universities with countries
SELECT u.id, u.name, c.name as country_name 
FROM public.universities u
JOIN public.countries c ON u.country_id = c.id
ORDER BY u.name
LIMIT 5;

-- Check recent uploads
SELECT id, title, upload_type, created_at, uploaded_by 
FROM public.uploads 
ORDER BY created_at DESC 
LIMIT 10;

-- Check user class assignments
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

-- ==============================================
-- 3. CONTENT MANAGEMENT QUERIES (BONUS)
-- ==============================================
-- These help you see all content for admin management

-- View all uploads with full details
SELECT 
  up.id,
  up.title,
  up.description,
  up.upload_type,
  up.created_at,
  p.full_name as uploader_name,
  p.email as uploader_email,
  u.name as unit_name,
  c.course_name,
  un.name as university_name
FROM public.uploads up
LEFT JOIN public.profiles p ON up.uploaded_by = p.user_id
LEFT JOIN public.units u ON up.unit_id = u.id
LEFT JOIN public.classes c ON u.class_id = c.id
LEFT JOIN public.universities un ON c.university_id = un.id
ORDER BY up.created_at DESC;

-- Count uploads by type
SELECT 
  upload_type,
  COUNT(*) as count
FROM public.uploads
GROUP BY upload_type;

-- Count uploads by university
SELECT 
  un.name as university_name,
  COUNT(up.id) as upload_count
FROM public.uploads up
LEFT JOIN public.units u ON up.unit_id = u.id
LEFT JOIN public.classes c ON u.class_id = c.id
LEFT JOIN public.universities un ON c.university_id = un.id
GROUP BY un.name
ORDER BY upload_count DESC;
