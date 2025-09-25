-- Create job postings table for Ajira
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

-- Enable RLS on the table
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job postings
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON public.job_postings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_type ON public.job_postings(job_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_location ON public.job_postings(location);
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON public.job_postings(company);
CREATE INDEX IF NOT EXISTS idx_job_postings_application_deadline ON public.job_postings(application_deadline);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_by ON public.job_postings(created_by);

-- Create full-text search index for better search functionality
CREATE INDEX IF NOT EXISTS idx_job_postings_search ON public.job_postings 
USING gin(to_tsvector('english', title || ' ' || company || ' ' || description || ' ' || location));
