-- Fix the problematic RLS policies in the alumni system
-- The issue was circular references and incorrect table aliases

-- Fix alumni_profiles RLS policy
DROP POLICY IF EXISTS "Alumni can view all alumni profiles from their university" ON public.alumni_profiles;

CREATE POLICY "Alumni can view all alumni profiles from their university" ON public.alumni_profiles 
FOR SELECT TO authenticated 
USING (
  university_id IN (
    -- Get the current user's university ID (whether they're alumni or current student)
    SELECT COALESCE(
      (SELECT ap_current.university_id FROM public.alumni_profiles ap_current WHERE ap_current.user_id = auth.uid()),
      (SELECT c.university_id FROM public.profiles p JOIN public.classes c ON p.class_id = c.id WHERE p.user_id = auth.uid())
    )
  )
);

-- Fix alumni_events RLS policy  
DROP POLICY IF EXISTS "Alumni and students can view events from their university" ON public.alumni_events;

CREATE POLICY "Alumni and students can view events from their university" ON public.alumni_events 
FOR SELECT TO authenticated 
USING (
  university_id IN (
    -- Get the current user's university ID (whether they're alumni or current student)
    SELECT COALESCE(
      (SELECT ap_current.university_id FROM public.alumni_profiles ap_current WHERE ap_current.user_id = auth.uid()),
      (SELECT c.university_id FROM public.profiles p JOIN public.classes c ON p.class_id = c.id WHERE p.user_id = auth.uid())
    )
  )
);

-- Fix alumni_event_attendees RLS policy
DROP POLICY IF EXISTS "Users can view attendees for events in their university" ON public.alumni_event_attendees;

CREATE POLICY "Users can view attendees for events in their university" ON public.alumni_event_attendees 
FOR SELECT TO authenticated 
USING (
  event_id IN (
    SELECT ae.id 
    FROM public.alumni_events ae
    WHERE ae.university_id IN (
      -- Get the current user's university ID (whether they're alumni or current student)
      SELECT COALESCE(
        (SELECT ap_current.university_id FROM public.alumni_profiles ap_current WHERE ap_current.user_id = auth.uid()),
        (SELECT c.university_id FROM public.profiles p JOIN public.classes c ON p.class_id = c.id WHERE p.user_id = auth.uid())
      )
    )
  )
);

-- Fix alumni_success_stories RLS policy
DROP POLICY IF EXISTS "Alumni and students can view success stories from their university" ON public.alumni_success_stories;

CREATE POLICY "Alumni and students can view success stories from their university" ON public.alumni_success_stories 
FOR SELECT TO authenticated 
USING (
  alumni_id IN (
    SELECT ap.user_id 
    FROM public.alumni_profiles ap
    WHERE ap.university_id IN (
      -- Get the current user's university ID (whether they're alumni or current student)
      SELECT COALESCE(
        (SELECT ap_current.university_id FROM public.alumni_profiles ap_current WHERE ap_current.user_id = auth.uid()),
        (SELECT c.university_id FROM public.profiles p JOIN public.classes c ON p.class_id = c.id WHERE p.user_id = auth.uid())
      )
    )
  )
);

-- Fix student_alumni_interactions RLS policy
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.student_alumni_interactions;

CREATE POLICY "Users can view their own interactions" ON public.student_alumni_interactions 
FOR SELECT TO authenticated 
USING (student_id = auth.uid() OR alumni_id = auth.uid());

-- Fix the interaction creation policy
DROP POLICY IF EXISTS "Students can request interactions with alumni from their university" ON public.student_alumni_interactions;

CREATE POLICY "Students can request interactions with alumni from their university" ON public.student_alumni_interactions 
FOR INSERT TO authenticated 
WITH CHECK (
  student_id = auth.uid() AND
  alumni_id IN (
    SELECT ap.user_id 
    FROM public.alumni_profiles ap
    WHERE ap.university_id IN (
      -- Get the current user's university ID (whether they're alumni or current student)
      SELECT COALESCE(
        (SELECT ap_current.university_id FROM public.alumni_profiles ap_current WHERE ap_current.user_id = auth.uid()),
        (SELECT c.university_id FROM public.profiles p JOIN public.classes c ON p.class_id = c.id WHERE p.user_id = auth.uid())
      )
    )
  )
);
