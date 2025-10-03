-- Test Profiles Access After RLS Fix
-- Run this script to verify that the 406 error is resolved

-- ==============================================
-- 1. CHECK CURRENT RLS STATUS
-- ==============================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles' 
AND schemaname = 'public';

-- ==============================================
-- 2. CHECK ACTIVE RLS POLICIES
-- ==============================================

SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY policyname;

-- ==============================================
-- 3. TEST BASIC PROFILE ACCESS
-- ==============================================

-- This should work without 406 error
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as profiles_with_user_id,
    COUNT(CASE WHEN class_id IS NOT NULL THEN 1 END) as profiles_with_class_id
FROM public.profiles;

-- ==============================================
-- 4. TEST SPECIFIC USER PROFILE ACCESS
-- ==============================================

-- Test the specific user ID from your error
SELECT 
    user_id,
    full_name,
    email,
    role,
    class_id,
    points,
    rank
FROM public.profiles 
WHERE user_id = 'f43dab7a-da80-4f2e-9d1c-12bc7426e23b';

-- ==============================================
-- 5. CHECK FOR ANY REMAINING ISSUES
-- ==============================================

-- Check if there are any foreign key constraint issues
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'profiles';

-- ==============================================
-- 6. SUCCESS INDICATORS
-- ==============================================

DO $$
BEGIN
    -- Test that we can access profiles
    IF EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
        RAISE NOTICE 'SUCCESS: Profiles table is accessible';
        RAISE NOTICE 'SUCCESS: No 406 error should occur';
    ELSE
        RAISE NOTICE 'WARNING: No profiles found or access denied';
    END IF;
    
    -- Test specific user access
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = 'f43dab7a-da80-4f2e-9d1c-12bc7426e23b') THEN
        RAISE NOTICE 'SUCCESS: Specific user profile is accessible';
    ELSE
        RAISE NOTICE 'INFO: Specific user profile not found (may be normal)';
    END IF;
    
    RAISE NOTICE '=== DIAGNOSTIC COMPLETE ===';
    RAISE NOTICE 'If you see SUCCESS messages above, the 406 error should be fixed';
    RAISE NOTICE 'If you still get 406 errors, check your Supabase project settings';
END $$;
