-- Frontend Component Fixes - Handle New Schema Structure
-- This script addresses the schema mismatches in dashboard components

-- The main issues are:
-- 1. Components trying to access classes.university_id (doesn't exist in new schema)
-- 2. Components expecting old class structure with course_name, course_year, etc.
-- 3. Missing relationships between new class system and old components

-- Since we've moved to a new class system, let's create a temporary compatibility layer
-- or update the components to work with the new schema

-- 1. For now, let's disable the problematic dashboard sections by creating a simple fix
-- We'll update the components to handle the new schema properly

-- First, let's see what the current class structure looks like:
SELECT 'Current classes table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'classes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Let's also check what profiles currently have
SELECT 'Current profiles with class_id:' as info;
SELECT COUNT(*) as count, 
       COUNT(CASE WHEN class_id IS NOT NULL THEN 1 END) as with_class_id
FROM public.profiles;

-- Check if there are any actual classes
SELECT 'Current classes count:' as info;
SELECT COUNT(*) as count FROM public.classes;

-- For the immediate fix, let's create a simple view that provides compatibility
-- This will help the old components work with new data structure

-- Create a compatibility view for old class structure
CREATE OR REPLACE VIEW public.legacy_classes AS
SELECT 
  c.id,
  c.name as course_name,
  1 as course_year,
  'Semester 1' as semester,
  'Group A' as course_group,
  c.creator_id,
  c.created_at,
  c.updated_at,
  -- For university_id, we'll need to get it from the creator's profile
  (SELECT p.university_id FROM public.profiles p WHERE p.user_id = c.creator_id) as university_id
FROM public.classes c;

-- Grant access to the view
GRANT SELECT ON public.legacy_classes TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.legacy_classes SET (security_barrier = true);

SELECT 'Compatibility layer created successfully' as status;
