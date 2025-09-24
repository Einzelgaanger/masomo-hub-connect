-- Create videos storage bucket (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'videos') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('videos', 'videos', true);
    END IF;
END $$;

-- Drop existing storage policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow authenticated users to upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to view videos" ON storage.objects;

-- Create storage policies for videos bucket
-- Allow authenticated users to upload videos
CREATE POLICY "Allow authenticated users to upload videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Allow authenticated users to view videos
CREATE POLICY "Allow authenticated users to view videos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'videos');

-- Allow authenticated users to update their own videos
CREATE POLICY "Allow users to update their own videos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own videos
CREATE POLICY "Allow users to delete their own videos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to view videos (since bucket is public)
CREATE POLICY "Allow public access to view videos" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'videos');
