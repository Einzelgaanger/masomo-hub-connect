-- Add visibility system to public_events and job_postings tables
-- This allows content to be shared at different levels: university, country, or global

-- First, add university_id columns if they don't exist
ALTER TABLE public.public_events ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;

-- Add visibility columns to public_events table
ALTER TABLE public.public_events ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'university' 
  CHECK (visibility IN ('university', 'country', 'global'));

ALTER TABLE public.public_events ADD COLUMN IF NOT EXISTS target_countries TEXT[] DEFAULT NULL;

-- Add visibility columns to job_postings table  
ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'university'
  CHECK (visibility IN ('university', 'country', 'global'));

ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS target_countries TEXT[] DEFAULT NULL;

-- Update RLS policies to handle visibility levels
DROP POLICY IF EXISTS "Users can view public events from their university" ON public.public_events;
CREATE POLICY "Users can view public events based on visibility" ON public.public_events
FOR SELECT TO authenticated
USING (
  -- University only: same university as creator
  (visibility = 'university' AND university_id = (
    SELECT c.university_id 
    FROM public.profiles p 
    JOIN public.classes c ON p.class_id = c.id 
    WHERE p.user_id = auth.uid()
  ))
  OR
  -- Country level: same country as creator AND in target countries
  (visibility = 'country' AND university_id IN (
    SELECT u.id 
    FROM public.universities u 
    JOIN public.countries co ON u.country_id = co.id
    WHERE co.id IN (
      SELECT u2.country_id 
      FROM public.universities u2
      JOIN public.classes c2 ON u2.id = c2.university_id
      JOIN public.profiles p2 ON c2.id = p2.class_id
      WHERE p2.user_id = auth.uid()
    ) AND (target_countries IS NULL OR co.id::text = ANY(target_countries))
  ))
  OR
  -- Global: visible to all users
  (visibility = 'global' AND (target_countries IS NULL OR (
    SELECT co.id::text 
    FROM public.universities u3 
    JOIN public.countries co ON u3.country_id = co.id
    JOIN public.classes c3 ON u3.id = c3.university_id
    JOIN public.profiles p3 ON c3.id = p3.class_id
    WHERE p3.user_id = auth.uid()
  ) = ANY(target_countries)))
);

DROP POLICY IF EXISTS "Users can view job postings from their university" ON public.job_postings;
CREATE POLICY "Users can view job postings based on visibility" ON public.job_postings
FOR SELECT TO authenticated
USING (
  -- University only: same university as creator
  (visibility = 'university' AND university_id = (
    SELECT c.university_id 
    FROM public.profiles p 
    JOIN public.classes c ON p.class_id = c.id 
    WHERE p.user_id = auth.uid()
  ))
  OR
  -- Country level: same country as creator AND in target countries
  (visibility = 'country' AND university_id IN (
    SELECT u.id 
    FROM public.universities u 
    JOIN public.countries co ON u.country_id = co.id
    WHERE co.id IN (
      SELECT u2.country_id 
      FROM public.universities u2
      JOIN public.classes c2 ON u2.id = c2.university_id
      JOIN public.profiles p2 ON c2.id = p2.class_id
      WHERE p2.user_id = auth.uid()
    ) AND (target_countries IS NULL OR co.id::text = ANY(target_countries))
  ))
  OR
  -- Global: visible to all users
  (visibility = 'global' AND (target_countries IS NULL OR (
    SELECT co.id::text 
    FROM public.universities u3 
    JOIN public.countries co ON u3.country_id = co.id
    JOIN public.classes c3 ON u3.id = c3.university_id
    JOIN public.profiles p3 ON c3.id = p3.class_id
    WHERE p3.user_id = auth.uid()
  ) = ANY(target_countries)))
);

-- Function to get available countries for selection
CREATE OR REPLACE FUNCTION public.get_available_countries()
RETURNS TABLE (
  country_id UUID,
  country_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    c.id as country_id,
    c.name as country_name
  FROM public.countries c
  WHERE EXISTS (
    SELECT 1 FROM public.universities u 
    WHERE u.country_id = c.id
  )
  ORDER BY c.name;
END;
$$;

-- Grant execute permission for get_available_countries
GRANT EXECUTE ON FUNCTION public.get_available_countries() TO authenticated;

-- Function to get university_id from user profile
CREATE OR REPLACE FUNCTION public.get_user_university_id(user_id_param UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  user_uni_id UUID;
BEGIN
  SELECT c.university_id INTO user_uni_id
  FROM public.profiles p
  JOIN public.classes c ON p.class_id = c.id
  WHERE p.user_id = user_id_param;
  
  RETURN user_uni_id;
END;
$$;

-- Grant execute permission for get_user_university_id
GRANT EXECUTE ON FUNCTION public.get_user_university_id(UUID) TO authenticated;

-- Function to set university_id for public_events and job_postings on insert
CREATE OR REPLACE FUNCTION public.set_university_id_from_profile()
RETURNS TRIGGER AS $$
DECLARE
  user_uni_id UUID;
BEGIN
  SELECT public.get_user_university_id(NEW.created_by) INTO user_uni_id;
  
  IF user_uni_id IS NOT NULL THEN
    NEW.university_id = user_uni_id;
  ELSE
    RAISE EXCEPTION 'User must be associated with a university to create this entry.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic university_id setting
DROP TRIGGER IF EXISTS set_public_event_university_id ON public.public_events;
CREATE TRIGGER set_public_event_university_id
  BEFORE INSERT ON public.public_events
  FOR EACH ROW EXECUTE FUNCTION public.set_university_id_from_profile();

DROP TRIGGER IF EXISTS set_job_posting_university_id ON public.job_postings;
CREATE TRIGGER set_job_posting_university_id
  BEFORE INSERT ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.set_university_id_from_profile();

-- Update existing records to have university visibility by default first
UPDATE public.public_events SET visibility = 'university' WHERE visibility IS NULL;
UPDATE public.job_postings SET visibility = 'university' WHERE visibility IS NULL;

-- Update existing records to populate university_id (after functions are created)
UPDATE public.public_events 
SET university_id = public.get_user_university_id(created_by)
WHERE university_id IS NULL;

UPDATE public.job_postings 
SET university_id = public.get_user_university_id(created_by)
WHERE university_id IS NULL;
