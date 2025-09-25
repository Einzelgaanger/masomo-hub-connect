-- Create public events table for community events
CREATE TABLE IF NOT EXISTS public.public_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on the table
ALTER TABLE public.public_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public events
CREATE POLICY "Anyone can view public events" ON public.public_events 
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create public events" ON public.public_events 
FOR INSERT TO authenticated 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own public events" ON public.public_events 
FOR UPDATE TO authenticated 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own public events" ON public.public_events 
FOR DELETE TO authenticated 
USING (created_by = auth.uid());

-- Create storage bucket for public events images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public-events', 'public-events', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for public events images
CREATE POLICY "Authenticated users can upload public event images" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'public-events');

CREATE POLICY "Anyone can view public event images" ON storage.objects 
FOR SELECT TO authenticated 
USING (bucket_id = 'public-events');

CREATE POLICY "Users can delete their own public event images" ON storage.objects 
FOR DELETE TO authenticated 
USING (
  bucket_id = 'public-events' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_public_events_created_at ON public.public_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_events_event_date ON public.public_events(event_date);
CREATE INDEX IF NOT EXISTS idx_public_events_created_by ON public.public_events(created_by);
