-- MINIMAL FIX - ONLY CREATES WHAT'S MISSING
-- Run this in Supabase SQL Editor

-- ===========================================
-- 1. CREATE JOB POSTINGS TABLE (FOR AJIRA)
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

-- Create policies only if they don't exist
DO $$
BEGIN
    -- Check if policies exist before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_postings' 
        AND policyname = 'Anyone can view job postings'
    ) THEN
        CREATE POLICY "Anyone can view job postings" ON public.job_postings 
        FOR SELECT TO authenticated 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_postings' 
        AND policyname = 'Authenticated users can create job postings'
    ) THEN
        CREATE POLICY "Authenticated users can create job postings" ON public.job_postings 
        FOR INSERT TO authenticated 
        WITH CHECK (created_by = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_postings' 
        AND policyname = 'Users can update their own job postings'
    ) THEN
        CREATE POLICY "Users can update their own job postings" ON public.job_postings 
        FOR UPDATE TO authenticated 
        USING (created_by = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_postings' 
        AND policyname = 'Users can delete their own job postings'
    ) THEN
        CREATE POLICY "Users can delete their own job postings" ON public.job_postings 
        FOR DELETE TO authenticated 
        USING (created_by = auth.uid());
    END IF;
END $$;

-- ===========================================
-- 2. FIX FOREIGN KEY RELATIONSHIPS
-- ===========================================

-- Fix public_events relationship with profiles (if it exists)
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
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ===========================================

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
-- 4. REFRESH SCHEMA CACHE
-- ===========================================
NOTIFY pgrst, 'reload schema';
