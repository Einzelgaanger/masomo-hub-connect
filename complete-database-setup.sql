-- COMPLETE DATABASE SETUP FOR TUKIO AND AJIRA
-- Run this entire script in Supabase SQL Editor

-- ===========================================
-- 1. CREATE PUBLIC EVENTS TABLE (FOR TUKIO)
-- ===========================================
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

-- Enable RLS on public_events
ALTER TABLE public.public_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public_events
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

-- ===========================================
-- 2. CREATE JOB POSTINGS TABLE (FOR AJIRA)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('full_time', 'part_time', 'internship', 'contract')),
  location TEXT NOT NULL,
  salary_range TEXT,
  application_deadline DATE,
  application_url TEXT,
  contact_email TEXT,
  requirements TEXT NOT NULL,
  benefits TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on job_postings
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_postings
CREATE POLICY "Anyone can view job postings" ON public.job_postings 
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create job postings" ON public.job_postings 
FOR INSERT TO authenticated 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own job postings" ON public.job_postings 
FOR UPDATE TO authenticated 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own job postings" ON public.job_postings 
FOR DELETE TO authenticated 
USING (created_by = auth.uid());

-- ===========================================
-- 3. FIX FOREIGN KEY RELATIONSHIPS
-- ===========================================

-- Fix public_events relationship with profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'public_events_created_by_profiles_fkey'
        AND table_name = 'public_events'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.public_events 
        ADD CONSTRAINT public_events_created_by_profiles_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fix job_postings relationship with profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_postings_created_by_profiles_fkey'
        AND table_name = 'job_postings'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.job_postings 
        ADD CONSTRAINT job_postings_created_by_profiles_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- ===========================================
-- 4. CREATE STORAGE BUCKETS
-- ===========================================

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

-- ===========================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ===========================================

-- Indexes for public_events
CREATE INDEX IF NOT EXISTS idx_public_events_created_at ON public.public_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_events_event_date ON public.public_events(event_date);
CREATE INDEX IF NOT EXISTS idx_public_events_created_by ON public.public_events(created_by);

-- Indexes for job_postings
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON public.job_postings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_type ON public.job_postings(job_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_location ON public.job_postings(location);
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON public.job_postings(company);
CREATE INDEX IF NOT EXISTS idx_job_postings_application_deadline ON public.job_postings(application_deadline);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_by ON public.job_postings(created_by);

-- Full-text search index for job postings
CREATE INDEX IF NOT EXISTS idx_job_postings_search ON public.job_postings 
USING gin(to_tsvector('english', title || ' ' || company || ' ' || description || ' ' || location));

-- ===========================================
-- 6. REFRESH SCHEMA CACHE
-- ===========================================
NOTIFY pgrst, 'reload schema';
