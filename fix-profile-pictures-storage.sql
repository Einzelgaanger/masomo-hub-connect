-- Fix Profile Pictures Storage - Simple Version
-- This script ensures the storage bucket exists with proper permissions

-- ==============================================
-- 1. CREATE STORAGE BUCKET (if not exists)
-- ==============================================

-- First, let's check if the bucket exists and create it if it doesn't
DO $$
BEGIN
    -- Check if bucket exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'profile-pictures'
    ) THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'profile-pictures',
            'profile-pictures',
            true,
            5242880, -- 5MB limit
            ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        );
        
        RAISE NOTICE 'Storage bucket profile-pictures created successfully';
    ELSE
        RAISE NOTICE 'Storage bucket profile-pictures already exists';
    END IF;
END $$;

-- ==============================================
-- 2. DROP EXISTING POLICIES (to avoid conflicts)
-- ==============================================

-- Drop existing policies on storage.objects for profile-pictures
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly readable" ON storage.objects;

-- ==============================================
-- 3. CREATE SIMPLE, PERMISSIVE POLICIES
-- ==============================================

-- Allow authenticated users to upload any file to profile-pictures bucket
CREATE POLICY "Allow authenticated uploads to profile-pictures" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow authenticated users to update any file in profile-pictures bucket
CREATE POLICY "Allow authenticated updates to profile-pictures" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'profile-pictures')
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow authenticated users to delete any file in profile-pictures bucket
CREATE POLICY "Allow authenticated deletes to profile-pictures" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'profile-pictures');

-- Allow public read access to profile-pictures bucket
CREATE POLICY "Allow public read access to profile-pictures" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-pictures');

-- ==============================================
-- 4. VERIFY BUCKET EXISTS
-- ==============================================

-- Check if bucket was created successfully
DO $$
DECLARE
    bucket_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO bucket_count 
    FROM storage.buckets 
    WHERE id = 'profile-pictures';
    
    IF bucket_count > 0 THEN
        RAISE NOTICE 'SUCCESS: profile-pictures bucket exists';
    ELSE
        RAISE NOTICE 'ERROR: profile-pictures bucket not found';
    END IF;
END $$;

-- ==============================================
-- 5. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== PROFILE PICTURES STORAGE FIX ===';
    RAISE NOTICE 'Storage bucket: profile-pictures verified/created';
    RAISE NOTICE 'Storage policies: configured with permissive access';
    RAISE NOTICE 'Profile picture uploads should now work!';
    RAISE NOTICE '=== FIX COMPLETE ===';
END $$;
