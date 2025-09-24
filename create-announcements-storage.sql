-- Create announcements storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true);

-- Create storage policies for announcements bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload announcements" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'announcements');

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated users to view announcements" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'announcements');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow users to update their own announcement files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'announcements' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow users to delete their own announcement files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'announcements' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to view files (since bucket is public)
CREATE POLICY "Allow public access to view announcements" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'announcements');
