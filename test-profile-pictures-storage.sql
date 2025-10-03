-- Test Profile Pictures Storage
-- This script tests if the storage bucket is working correctly

-- ==============================================
-- 1. CHECK BUCKET EXISTS
-- ==============================================

SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id = 'profile-pictures';

-- ==============================================
-- 2. CHECK STORAGE POLICIES
-- ==============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%profile-pictures%';

-- ==============================================
-- 3. CHECK CURRENT USER PERMISSIONS
-- ==============================================

-- Check if current user can access storage
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    'Storage access test' as test_description;

-- ==============================================
-- 4. TEST BUCKET ACCESS
-- ==============================================

-- Try to list objects in the bucket (this will show if we have read access)
SELECT 
    name,
    bucket_id,
    owner,
    created_at,
    updated_at
FROM storage.objects 
WHERE bucket_id = 'profile-pictures'
LIMIT 5;

-- ==============================================
-- 5. SUMMARY
-- ==============================================

DO $$
DECLARE
    bucket_exists BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check if bucket exists
    SELECT EXISTS(
        SELECT 1 FROM storage.buckets WHERE id = 'profile-pictures'
    ) INTO bucket_exists;
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname LIKE '%profile-pictures%';
    
    RAISE NOTICE '=== STORAGE TEST RESULTS ===';
    RAISE NOTICE 'Bucket exists: %', bucket_exists;
    RAISE NOTICE 'Policies configured: %', policy_count;
    
    IF bucket_exists AND policy_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Profile pictures storage is ready!';
    ELSE
        RAISE NOTICE 'ISSUE: Storage setup incomplete';
        IF NOT bucket_exists THEN
            RAISE NOTICE '  - Bucket does not exist';
        END IF;
        IF policy_count = 0 THEN
            RAISE NOTICE '  - No policies configured';
        END IF;
    END IF;
    RAISE NOTICE '=== TEST COMPLETE ===';
END $$;
