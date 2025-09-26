-- Create storage bucket for Ukumbi images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ukumbi-images', 'ukumbi-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for ukumbi-images
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload ukumbi images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view ukumbi images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own ukumbi images" ON storage.objects;

-- Create new storage policies for ukumbi-images
CREATE POLICY "Authenticated users can upload ukumbi images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ukumbi-images');

CREATE POLICY "Authenticated users can view ukumbi images" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'ukumbi-images');

CREATE POLICY "Users can delete their own ukumbi images" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'ukumbi-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Also create inbox-images bucket if it doesn't exist (for Inbox feature)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('inbox-images', 'inbox-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for inbox-images
DROP POLICY IF EXISTS "Authenticated users can upload inbox images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view inbox images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own inbox images" ON storage.objects;

CREATE POLICY "Authenticated users can upload inbox images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inbox-images');

CREATE POLICY "Authenticated users can view inbox images" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'inbox-images');

CREATE POLICY "Users can delete their own inbox images" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'inbox-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Also create public-events bucket if it doesn't exist (for Events feature)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public-events', 'public-events', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for public-events
DROP POLICY IF EXISTS "Authenticated users can upload public events" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view public events" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own public events" ON storage.objects;

CREATE POLICY "Authenticated users can upload public events" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public-events');

CREATE POLICY "Authenticated users can view public events" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'public-events');

CREATE POLICY "Users can delete their own public events" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'public-events' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
