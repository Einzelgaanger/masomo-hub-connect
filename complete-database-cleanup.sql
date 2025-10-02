-- Complete Database Cleanup Script
-- This will remove all data except binfred.ke@gmail.com
-- WARNING: This is irreversible!

-- First, let's see what we're working with
SELECT 'Current user count:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Current profiles count:' as info, COUNT(*) as count FROM public.profiles;

-- Disable RLS temporarily for cleanup
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.concerns DISABLE ROW LEVEL SECURITY;

-- Get the user ID for binfred.ke@gmail.com
DO $$
DECLARE
    binfred_user_id UUID;
BEGIN
    SELECT id INTO binfred_user_id FROM auth.users WHERE email = 'binfred.ke@gmail.com';
    
    IF binfred_user_id IS NULL THEN
        RAISE EXCEPTION 'User binfred.ke@gmail.com not found!';
    END IF;
    
    RAISE NOTICE 'Found binfred user ID: %', binfred_user_id;
    
    -- Delete all data except for binfred's data
    -- Delete in reverse dependency order
    
    -- Delete achievement-related data
    DELETE FROM public.achievement_views WHERE user_id != binfred_user_id;
    DELETE FROM public.achievement_comments WHERE user_id != binfred_user_id;
    DELETE FROM public.achievement_likes WHERE user_id != binfred_user_id;
    DELETE FROM public.achievement_media WHERE achievement_id IN (
        SELECT id FROM public.achievements WHERE user_id != binfred_user_id
    );
    DELETE FROM public.achievements WHERE user_id != binfred_user_id;
    
    -- Delete uploads and assignments
    DELETE FROM public.uploads WHERE uploaded_by != binfred_user_id;
    DELETE FROM public.assignments WHERE created_by != binfred_user_id;
    
    -- Delete messages and follows
    DELETE FROM public.direct_messages WHERE sender_id != binfred_user_id AND receiver_id != binfred_user_id;
    DELETE FROM public.follows WHERE follower_id != binfred_user_id AND following_id != binfred_user_id;
    
    -- Delete job postings, events, concerns
    DELETE FROM public.job_postings WHERE created_by != binfred_user_id;
    DELETE FROM public.public_events WHERE created_by != binfred_user_id;
    DELETE FROM public.concerns WHERE user_id != binfred_user_id;
    
    -- Delete applications
    DELETE FROM public.applications WHERE user_id != binfred_user_id;
    
    -- Update binfred's profile to remove foreign key references
    UPDATE public.profiles 
    SET country_id = NULL, university_id = NULL, course_id = NULL 
    WHERE user_id = binfred_user_id;
    
    -- Delete profiles (this will cascade to related data)
    DELETE FROM public.profiles WHERE user_id != binfred_user_id;
    
    -- Delete all units and classes (since we're starting fresh)
    -- Use TRUNCATE CASCADE to handle foreign key dependencies
    TRUNCATE TABLE public.class_members, public.class_units, public.classes, public.units CASCADE;
    
    -- Delete courses first, then universities, then countries
    DELETE FROM public.courses;
    DELETE FROM public.universities;
    DELETE FROM public.countries;
    
    RAISE NOTICE 'Cleanup completed successfully!';
END $$;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concerns ENABLE ROW LEVEL SECURITY;

-- Verify cleanup
SELECT 'Remaining user count:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Remaining profiles count:' as info, COUNT(*) as count FROM public.profiles;
SELECT 'Remaining classes count:' as info, COUNT(*) as count FROM public.classes;
SELECT 'Remaining universities count:' as info, COUNT(*) as count FROM public.universities;

-- Show remaining data
SELECT 'Remaining users:' as info, email FROM auth.users;
SELECT 'Remaining profiles:' as info, full_name, email FROM public.profiles;
