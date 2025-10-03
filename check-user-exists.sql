-- Check if the user exists in auth.users and profiles
-- This will help diagnose the 406 error

-- ==============================================
-- 1. CHECK IF USER EXISTS IN AUTH.USERS
-- ==============================================

SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE id = 'f43dab7a-da80-4f2e-9d1c-12bc7426e23b';

-- ==============================================
-- 2. CHECK IF PROFILE EXISTS
-- ==============================================

SELECT 
    user_id,
    full_name,
    email,
    role,
    class_id,
    points,
    rank,
    created_at
FROM public.profiles 
WHERE user_id = 'f43dab7a-da80-4f2e-9d1c-12bc7426e23b';

-- ==============================================
-- 3. CHECK RLS STATUS
-- ==============================================

SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles' 
AND schemaname = 'public';

-- ==============================================
-- 4. CHECK ACTIVE POLICIES
-- ==============================================

SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public';

-- ==============================================
-- 5. DIAGNOSTIC SUMMARY
-- ==============================================

DO $$
DECLARE
    user_exists BOOLEAN;
    profile_exists BOOLEAN;
    rls_enabled BOOLEAN;
BEGIN
    -- Check if user exists in auth
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE id = 'f43dab7a-da80-4f2e-9d1c-12bc7426e23b'
    ) INTO user_exists;
    
    -- Check if profile exists
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE user_id = 'f43dab7a-da80-4f2e-9d1c-12bc7426e23b'
    ) INTO profile_exists;
    
    -- Check RLS status
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables 
    WHERE tablename = 'profiles' AND schemaname = 'public';
    
    -- Report findings
    IF user_exists THEN
        RAISE NOTICE 'SUCCESS: User exists in auth.users';
    ELSE
        RAISE NOTICE 'ERROR: User does not exist in auth.users';
    END IF;
    
    IF profile_exists THEN
        RAISE NOTICE 'SUCCESS: Profile exists in profiles table';
    ELSE
        RAISE NOTICE 'ERROR: Profile does not exist - this is likely the cause of 406 error';
    END IF;
    
    IF rls_enabled THEN
        RAISE NOTICE 'INFO: RLS is enabled on profiles table';
    ELSE
        RAISE NOTICE 'INFO: RLS is disabled on profiles table';
    END IF;
    
    -- Final diagnosis
    IF NOT profile_exists THEN
        RAISE NOTICE 'DIAGNOSIS: Missing profile is causing the 406 error';
        RAISE NOTICE 'SOLUTION: Run emergency-fix-406-error.sql to create the profile';
    ELSIF rls_enabled THEN
        RAISE NOTICE 'DIAGNOSIS: RLS policies may be blocking access';
        RAISE NOTICE 'SOLUTION: Run emergency-fix-406-error.sql to disable RLS';
    ELSE
        RAISE NOTICE 'DIAGNOSIS: Unknown issue - check Supabase logs';
    END IF;
END $$;
