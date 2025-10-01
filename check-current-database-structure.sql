-- =====================================================
-- CHECK CURRENT DATABASE STRUCTURE
-- Run this first to see what we're working with
-- =====================================================

-- Check what columns exist in profiles table
SELECT 
  'profiles' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if classes table exists and its structure
SELECT 
  'classes' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'classes'
ORDER BY ordinal_position;

-- Check if units table exists and its structure
SELECT 
  'units' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'units'
ORDER BY ordinal_position;

-- Check what tables exist in public schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

