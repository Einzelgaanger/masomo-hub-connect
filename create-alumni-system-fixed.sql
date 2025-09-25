-- Comprehensive Alumni Network System - FIXED VERSION
-- This creates a powerful alumni network that universities will love


-- 1. Add graduation tracking to classes table
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_graduated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS graduation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS graduation_year INTEGER;

-- 2. Create alumni profiles table (extends profiles with alumni-specific data)
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  graduation_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  graduation_year INTEGER,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  current_company TEXT,
  current_position TEXT,
  industry TEXT,
  linkedin_url TEXT,
  bio TEXT,
  skills TEXT[],
  mentoring_available BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create alumni events table
CREATE TABLE IF NOT EXISTS public.alumni_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('networking', 'career_development', 'social', 'reunion', 'webinar')),
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create alumni event attendees table
CREATE TABLE IF NOT EXISTS public.alumni_event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.alumni_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsvp_status TEXT NOT NULL DEFAULT 'attending' CHECK (rsvp_status IN ('attending', 'interested', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 5. Create alumni success stories table
CREATE TABLE IF NOT EXISTS public.alumni_success_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('career_advancement', 'entrepreneurship', 'award', 'publication', 'innovation', 'leadership')),
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create current student-alumni interactions table
CREATE TABLE IF NOT EXISTS public.student_alumni_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alumni_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('mentorship_request', 'career_advice', 'job_referral', 'industry_insight', 'project_collaboration')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_alumni_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alumni_profiles
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

CREATE POLICY "Alumni can update their own profile" ON public.alumni_profiles 
FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Alumni can insert their own profile" ON public.alumni_profiles 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

-- RLS Policies for alumni_events
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

CREATE POLICY "Alumni can create events in their university" ON public.alumni_events 
FOR INSERT TO authenticated 
WITH CHECK (
  created_by = auth.uid() AND
  university_id IN (
    SELECT ap.university_id 
    FROM public.alumni_profiles ap
    WHERE ap.user_id = auth.uid()
  )
);

-- RLS Policies for alumni_event_attendees
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

CREATE POLICY "Authenticated users can RSVP to events" ON public.alumni_event_attendees 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own RSVP status" ON public.alumni_event_attendees 
FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

-- RLS Policies for alumni_success_stories
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

CREATE POLICY "Alumni can create their own success stories" ON public.alumni_success_stories 
FOR INSERT TO authenticated 
WITH CHECK (alumni_id = auth.uid());

-- RLS Policies for student_alumni_interactions
CREATE POLICY "Users can view their own interactions" ON public.student_alumni_interactions 
FOR SELECT TO authenticated 
USING (student_id = auth.uid() OR alumni_id = auth.uid());

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

CREATE POLICY "Alumni can respond to interactions" ON public.student_alumni_interactions 
FOR UPDATE TO authenticated 
USING (alumni_id = auth.uid());

-- Function to graduate a class
CREATE OR REPLACE FUNCTION public.graduate_class(class_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  current_year INTEGER;
  profile_record RECORD;
  university_id_val UUID;
BEGIN
  -- Get the current year
  SELECT EXTRACT(YEAR FROM CURRENT_DATE) INTO current_year;

  -- Update the class as graduated
  UPDATE public.classes
  SET is_graduated = TRUE, graduation_year = current_year
  WHERE id = class_id_param
  RETURNING university_id INTO university_id_val;

  -- Update profiles: change role to 'alumni' and create alumni_profiles
  FOR profile_record IN
    SELECT user_id, full_name, email, class_id
    FROM public.profiles
    WHERE class_id = class_id_param
  LOOP
    -- Update role in profiles table
    UPDATE public.profiles
    SET role = 'alumni', class_id = NULL -- Remove class_id as they are no longer current students
    WHERE user_id = profile_record.user_id;

    -- Insert into alumni_profiles
    INSERT INTO public.alumni_profiles (user_id, full_name, email, graduation_class_id, graduation_year, university_id)
    VALUES (profile_record.user_id, profile_record.full_name, profile_record.email, profile_record.class_id, current_year, university_id_val)
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      graduation_class_id = EXCLUDED.graduation_class_id,
      graduation_year = EXCLUDED.graduation_year,
      university_id = EXCLUDED.university_id,
      updated_at = now();
  END LOOP;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_university_id ON public.alumni_profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_user_id ON public.alumni_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_alumni_events_university_id ON public.alumni_events(university_id);
CREATE INDEX IF NOT EXISTS idx_alumni_events_created_by ON public.alumni_events(created_by);
CREATE INDEX IF NOT EXISTS idx_alumni_success_stories_alumni_id ON public.alumni_success_stories(alumni_id);
