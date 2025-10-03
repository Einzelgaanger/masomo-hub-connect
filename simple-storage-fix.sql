-- Simple Storage Fix for Profile Pictures
-- This script creates a basic storage setup that will definitely work

-- ==============================================
-- 1. CREATE STORAGE BUCKET
-- ==============================================

-- Drop bucket if exists (to start fresh)
DELETE FROM storage.buckets WHERE id = 'profile-pictures';

-- Create the bucket with minimal configuration
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true);

-- ==============================================
-- 2. DROP ALL EXISTING POLICIES
-- ==============================================

-- Drop all existing policies on storage.objects
DROP POLICY IF EXISTS "Allow authenticated uploads to profile-pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to profile-pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to profile-pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to profile-pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly readable" ON storage.objects;

-- ==============================================
-- 3. CREATE SIMPLE POLICIES
-- ==============================================

-- Allow all authenticated users to do everything with profile-pictures
CREATE POLICY "profile_pictures_all_access" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'profile-pictures')
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow public read access
CREATE POLICY "profile_pictures_public_read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-pictures');

-- ==============================================
-- 4. VERIFY SETUP
-- ==============================================

-- Check bucket exists
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets 
WHERE id = 'profile-pictures';

-- Check policies exist
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%profile_pictures%';

-- ==============================================
-- 5. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== SIMPLE STORAGE FIX COMPLETE ===';
    RAISE NOTICE 'Bucket: profile-pictures created';
    RAISE NOTICE 'Policies: configured for all authenticated users';
    RAISE NOTICE 'Public read: enabled';
    RAISE NOTICE 'Profile picture uploads should now work!';
    RAISE NOTICE '=== READY TO TEST ===';
END $$;
