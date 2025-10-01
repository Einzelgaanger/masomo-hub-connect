-- =====================================================
-- STORAGE BUCKETS SETUP
-- Create storage buckets for class chatroom media
-- =====================================================

-- Note: Run this in Supabase SQL Editor
-- OR create buckets manually in Supabase Dashboard > Storage

-- =====================================================
-- STORAGE BUCKET POLICIES
-- =====================================================

-- For class-images bucket
-- Go to Storage > class-images > Policies

-- Policy 1: Allow authenticated users to upload
-- Name: "Class members can upload images"
-- SQL:
/*
CREATE POLICY "Class members can upload images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'class-images'
    AND auth.uid() IS NOT NULL
  );
*/

-- Policy 2: Allow anyone to view images
-- Name: "Anyone can view class images"
-- SQL:
/*
CREATE POLICY "Anyone can view class images" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'class-images'
  );
*/

-- For class-files bucket
-- Go to Storage > class-files > Policies

-- Policy 3: Allow authenticated users to upload files
-- Name: "Class members can upload files"
-- SQL:
/*
CREATE POLICY "Class members can upload files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'class-files'
    AND auth.uid() IS NOT NULL
  );
*/

-- Policy 4: Allow anyone to view files
-- Name: "Anyone can view class files"
-- SQL:
/*
CREATE POLICY "Anyone can view class files" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'class-files'
  );
*/

-- =====================================================
-- MANUAL SETUP INSTRUCTIONS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STORAGE BUCKETS SETUP REQUIRED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. Go to Supabase Dashboard';
  RAISE NOTICE '2. Navigate to Storage';
  RAISE NOTICE '3. Create two buckets:';
  RAISE NOTICE '   - class-images (Public: true)';
  RAISE NOTICE '   - class-files (Public: true)';
  RAISE NOTICE '4. Add RLS policies (see comments above)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'After setup, chatroom media uploads will work!';
  RAISE NOTICE '========================================';
END $$;

