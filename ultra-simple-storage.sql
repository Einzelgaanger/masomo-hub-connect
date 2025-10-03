-- Ultra Simple Storage Setup
-- This creates the most basic storage configuration possible

-- ==============================================
-- 1. DELETE AND RECREATE BUCKET
-- ==============================================

-- Delete bucket if exists
DELETE FROM storage.buckets WHERE id = 'profile-pictures';

-- Create bucket with absolute minimal config
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true);

-- ==============================================
-- 2. REMOVE ALL POLICIES
-- ==============================================

-- Drop ALL policies on storage.objects
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- ==============================================
-- 3. CREATE SINGLE PERMISSIVE POLICY
-- ==============================================

-- One policy to rule them all
CREATE POLICY "allow_all_profile_pictures" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'profile-pictures');

-- ==============================================
-- 4. VERIFY
-- ==============================================

-- Check bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'profile-pictures';

-- Check policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- ==============================================
-- 5. SUCCESS
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== ULTRA SIMPLE STORAGE READY ===';
    RAISE NOTICE 'Bucket: profile-pictures';
    RAISE NOTICE 'Public: true';
    RAISE NOTICE 'Policy: allow_all_profile_pictures';
    RAISE NOTICE 'This should work now!';
    RAISE NOTICE '=== DONE ===';
END $$;
