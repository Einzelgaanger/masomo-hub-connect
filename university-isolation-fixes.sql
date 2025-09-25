-- University Isolation Fixes
-- This script ensures all features are properly isolated by university

-- 1. Update public_events table to include university_id for better filtering
ALTER TABLE public.public_events ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id);

-- 2. Update job_postings table to include university_id for better filtering  
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id);

-- 3. Create function to get user's university_id
CREATE OR REPLACE FUNCTION public.get_user_university_id(user_id_param UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT c.university_id 
    FROM public.profiles p 
    JOIN public.classes c ON p.class_id = c.id 
    WHERE p.user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update RLS policies for public_events to be university-specific
DROP POLICY IF EXISTS "Anyone can view public events" ON public.public_events;
CREATE POLICY "Users can view public events from their university" ON public.public_events 
FOR SELECT TO authenticated 
USING (
  university_id = public.get_user_university_id(auth.uid())
);

DROP POLICY IF EXISTS "Authenticated users can create public events" ON public.public_events;
CREATE POLICY "Users can create public events in their university" ON public.public_events 
FOR INSERT TO authenticated 
WITH CHECK (
  created_by = auth.uid() AND
  university_id = public.get_user_university_id(auth.uid())
);

-- 5. Update RLS policies for job_postings to be university-specific
DROP POLICY IF EXISTS "Anyone can view job postings" ON public.job_postings;
CREATE POLICY "Users can view job postings from their university" ON public.job_postings 
FOR SELECT TO authenticated 
USING (
  university_id = public.get_user_university_id(auth.uid())
);

DROP POLICY IF EXISTS "Authenticated users can create job postings" ON public.job_postings;
CREATE POLICY "Users can create job postings in their university" ON public.job_postings 
FOR INSERT TO authenticated 
WITH CHECK (
  created_by = auth.uid() AND
  university_id = public.get_user_university_id(auth.uid())
);

-- 6. Create triggers to automatically set university_id when creating events/jobs
CREATE OR REPLACE FUNCTION public.set_university_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.university_id IS NULL THEN
    NEW.university_id = public.get_user_university_id(NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS set_university_id_public_events ON public.public_events;
CREATE TRIGGER set_university_id_public_events
  BEFORE INSERT ON public.public_events
  FOR EACH ROW EXECUTE FUNCTION public.set_university_id_on_insert();

DROP TRIGGER IF EXISTS set_university_id_job_postings ON public.job_postings;
CREATE TRIGGER set_university_id_job_postings
  BEFORE INSERT ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.set_university_id_on_insert();

-- 7. Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.get_user_university_id(UUID) TO authenticated;
