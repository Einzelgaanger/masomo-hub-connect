-- Create storage buckets for Ukumbi media files
-- This script creates the necessary storage buckets for images and videos

-- Create ukumbi-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ukumbi-images',
  'ukumbi-images',
  true,
  10485760, -- 10MB limit for images
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Create ukumbi-videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ukumbi-videos',
  'ukumbi-videos',
  true,
  104857600, -- 100MB limit for videos
  ARRAY['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for ukumbi-images bucket
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'ukumbi-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view all images (public read)
CREATE POLICY "Anyone can view ukumbi images" ON storage.objects
FOR SELECT USING (bucket_id = 'ukumbi-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'ukumbi-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for ukumbi-videos bucket
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'ukumbi-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view all videos (public read)
CREATE POLICY "Anyone can view ukumbi videos" ON storage.objects
FOR SELECT USING (bucket_id = 'ukumbi-videos');

-- Allow users to delete their own videos
CREATE POLICY "Users can delete their own videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'ukumbi-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify buckets were created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('ukumbi-images', 'ukumbi-videos');

