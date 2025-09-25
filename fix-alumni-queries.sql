-- Fix Alumni page query issues
-- This addresses the 400/500 errors in Alumni success stories and events

-- 1. Fix alumni_success_stories query issue
-- The issue is that the table doesn't have university_id directly
-- We need to join through alumni_profiles -> classes -> universities

-- Create a view that makes this easier to query
CREATE OR REPLACE VIEW alumni_success_stories_with_university AS
SELECT 
  s.*,
  ap.graduation_class,
  c.university_id
FROM alumni_success_stories s
JOIN alumni_profiles ap ON s.alumni_id = ap.user_id
JOIN classes c ON ap.graduation_class = c.id;

-- Create RLS policy for the view
CREATE POLICY "Users can view success stories in their university" ON alumni_success_stories_with_university
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.classes user_class ON p.class_id = user_class.id
    WHERE p.user_id = auth.uid()
    AND user_class.university_id = alumni_success_stories_with_university.university_id
  )
);

ALTER VIEW alumni_success_stories_with_university ENABLE ROW LEVEL SECURITY;

-- 2. Fix alumni_events table
-- Ensure it has proper RLS policies
DROP POLICY IF EXISTS "Users can view alumni events in their university" ON public.alumni_events;
DROP POLICY IF EXISTS "Users can create alumni events" ON public.alumni_events;

CREATE POLICY "Users can view alumni events in their university" ON public.alumni_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.classes c ON p.class_id = c.id
    WHERE p.user_id = auth.uid()
    AND c.university_id = alumni_events.university_id
  )
);

CREATE POLICY "Users can create alumni events" ON public.alumni_events
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.classes c ON p.class_id = c.id
    WHERE p.user_id = auth.uid()
    AND c.university_id = alumni_events.university_id
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.alumni_events ENABLE ROW LEVEL SECURITY;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alumni_success_stories_alumni_id ON public.alumni_success_stories(alumni_id);
CREATE INDEX IF NOT EXISTS idx_alumni_events_university_id ON public.alumni_events(university_id);
CREATE INDEX IF NOT EXISTS idx_alumni_events_created_by ON public.alumni_events(created_by);
