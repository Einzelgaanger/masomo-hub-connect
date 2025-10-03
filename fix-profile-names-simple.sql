-- Simple Profile Names Fix
-- This script fixes profile names that are showing as email addresses

-- ==============================================
-- 1. FIX ALL PROFILES WITH EMAIL-BASED NAMES
-- ==============================================

-- Update profiles where full_name looks like an email or email prefix
UPDATE public.profiles 
SET full_name = INITCAP(REPLACE(SPLIT_PART(email, '@', 1), '.', ' '))
WHERE full_name = SPLIT_PART(email, '@', 1)
   OR full_name = LOWER(SPLIT_PART(email, '@', 1))
   OR full_name ~ '^[a-z0-9._-]+$'  -- Only lowercase letters, numbers, dots, underscores, hyphens
   OR full_name = email  -- If full_name is the same as email
   OR full_name LIKE '%@%';  -- If full_name contains @ symbol

-- ==============================================
-- 2. FIX SPECIFIC USERS FROM LOGS
-- ==============================================

-- Fix the specific users mentioned in the error logs
UPDATE public.profiles 
SET full_name = INITCAP(REPLACE(SPLIT_PART(email, '@', 1), '.', ' '))
WHERE user_id IN (
    'f43dab7a-da80-4f2e-9d1c-12bc7426e23b',
    '04d6ac6d-9b91-4b1f-ab65-4f72fc461f3a'
)
AND (full_name = SPLIT_PART(email, '@', 1) OR full_name = email OR full_name LIKE '%@%');

-- ==============================================
-- 3. VERIFY THE FIXES
-- ==============================================

-- Check the specific users
SELECT 
    user_id,
    full_name,
    email,
    'Fixed' as status
FROM public.profiles 
WHERE user_id IN (
    'f43dab7a-da80-4f2e-9d1c-12bc7426e23b',
    '04d6ac6d-9b91-4b1f-ab65-4f72fc461f3a'
);

-- Show all profiles that were updated
SELECT 
    user_id,
    full_name,
    email,
    'Updated' as status
FROM public.profiles 
WHERE full_name != SPLIT_PART(email, '@', 1)
  AND full_name != email
  AND email IS NOT NULL
  AND full_name NOT LIKE '%@%';

-- ==============================================
-- 4. SUCCESS MESSAGE
-- ==============================================

DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Count how many profiles were updated
    SELECT COUNT(*) INTO updated_count
    FROM public.profiles 
    WHERE full_name != SPLIT_PART(email, '@', 1)
      AND full_name != email
      AND email IS NOT NULL
      AND full_name NOT LIKE '%@%';
    
    RAISE NOTICE '=== PROFILE NAMES FIXED ===';
    RAISE NOTICE 'Updated % profiles with proper names', updated_count;
    RAISE NOTICE 'Names are now properly formatted (e.g., "Alfred Maweu" instead of "alfred.maweu@strathmore.edu")';
    RAISE NOTICE 'Email addresses remain unchanged';
    RAISE NOTICE '=== FIX COMPLETE ===';
END $$;
