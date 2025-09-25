-- Comprehensive Alumni Network System
-- This creates a powerful alumni network that universities will love

-- 1. Add graduation tracking to classes table
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_graduated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS graduation_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS graduation_year INTEGER;

-- 2. Create alumni profiles table (extends profiles with alumni-specific data)
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  graduation_year INTEGER NOT NULL,
  graduation_class_id UUID NOT NULL REFERENCES public.classes(id),
  current_company TEXT,
  current_position TEXT,
  current_location TEXT,
  industry TEXT,
  linkedin_url TEXT,
  personal_website TEXT,
  bio TEXT,
  achievements TEXT[],
  skills TEXT[],
  willing_to_mentor BOOLEAN NOT NULL DEFAULT false,
  available_for_hiring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create alumni connections table (networking)
CREATE TABLE IF NOT EXISTS public.alumni_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_alumni_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('colleague', 'mentor', 'mentee', 'friend', 'business_partner')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(alumni_id, connected_alumni_id)
);

-- 4. Create mentorship requests table
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create job referrals table
CREATE TABLE IF NOT EXISTS public.job_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  application_url TEXT,
  referral_bonus TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 6. Create alumni events table
CREATE TABLE IF NOT EXISTS public.alumni_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('networking', 'career_development', 'social', 'reunion', 'webinar')),
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  is_virtual BOOLEAN NOT NULL DEFAULT false,
  meeting_url TEXT,
  max_attendees INTEGER,
  current_attendees INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create alumni event attendees table
CREATE TABLE IF NOT EXISTS public.alumni_event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.alumni_events(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, attendee_id)
);

-- 8. Create alumni success stories table
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

-- 9. Create current student-alumni interactions table
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
ALTER TABLE public.alumni_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_alumni_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alumni_profiles
CREATE POLICY "Alumni can view all alumni profiles from their university" ON public.alumni_profiles 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.alumni_profiles ap1
    JOIN public.classes c1 ON ap1.graduation_class_id = c1.id
    JOIN public.alumni_profiles ap2 ON ap2.graduation_class_id = c2.id
    JOIN public.classes c2 ON ap2.graduation_class_id = c2.id
    WHERE ap1.user_id = auth.uid() AND c1.university_id = c2.university_id
  )
);

CREATE POLICY "Alumni can update their own profile" ON public.alumni_profiles 
FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Alumni can insert their profile" ON public.alumni_profiles 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

-- RLS Policies for alumni_connections
CREATE POLICY "Alumni can manage their connections" ON public.alumni_connections 
FOR ALL TO authenticated 
USING (alumni_id = auth.uid() OR connected_alumni_id = auth.uid());

-- RLS Policies for mentorship_requests
CREATE POLICY "Users can manage their mentorship requests" ON public.mentorship_requests 
FOR ALL TO authenticated 
USING (mentee_id = auth.uid() OR mentor_id = auth.uid());

-- RLS Policies for job_referrals
CREATE POLICY "Alumni can view and create job referrals from their university" ON public.job_referrals 
FOR ALL TO authenticated 
USING (
  referrer_id IN (
    SELECT ap.user_id 
    FROM public.alumni_profiles ap
    JOIN public.classes c ON ap.graduation_class_id = c.id
    WHERE c.university_id IN (
      SELECT c2.university_id 
      FROM public.profiles p
      JOIN public.classes c2 ON p.class_id = c2.id
      WHERE p.user_id = auth.uid()
    )
  )
);

-- RLS Policies for alumni_events
CREATE POLICY "University members can view alumni events" ON public.alumni_events 
FOR SELECT TO authenticated 
USING (
  university_id IN (
    SELECT c.university_id 
    FROM public.profiles p
    JOIN public.classes c ON p.class_id = c.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Alumni can create events for their university" ON public.alumni_events 
FOR INSERT TO authenticated 
WITH CHECK (
  created_by IN (
    SELECT ap.user_id 
    FROM public.alumni_profiles ap
    JOIN public.classes c ON ap.graduation_class_id = c.id
    WHERE c.university_id = university_id
  )
);

-- RLS Policies for alumni_event_attendees
CREATE POLICY "Users can manage their event attendance" ON public.alumni_event_attendees 
FOR ALL TO authenticated 
USING (attendee_id = auth.uid());

-- RLS Policies for alumni_success_stories
CREATE POLICY "University members can view success stories" ON public.alumni_success_stories 
FOR SELECT TO authenticated 
USING (
  alumni_id IN (
    SELECT ap.user_id 
    FROM public.alumni_profiles ap
    JOIN public.classes c ON ap.graduation_class_id = c.id
    WHERE c.university_id IN (
      SELECT c2.university_id 
      FROM public.profiles p
      JOIN public.classes c2 ON p.class_id = c2.id
      WHERE p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Alumni can manage their success stories" ON public.alumni_success_stories 
FOR ALL TO authenticated 
USING (alumni_id = auth.uid());

-- RLS Policies for student_alumni_interactions
CREATE POLICY "Users can manage their interactions" ON public.student_alumni_interactions 
FOR ALL TO authenticated 
USING (student_id = auth.uid() OR alumni_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_graduation_year ON public.alumni_profiles(graduation_year);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_company ON public.alumni_profiles(current_company);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_industry ON public.alumni_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_mentor ON public.alumni_profiles(willing_to_mentor);
CREATE INDEX IF NOT EXISTS idx_alumni_connections_alumni ON public.alumni_connections(alumni_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor ON public.mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_job_referrals_active ON public.job_referrals(is_active);
CREATE INDEX IF NOT EXISTS idx_alumni_events_date ON public.alumni_events(event_date);
CREATE INDEX IF NOT EXISTS idx_alumni_events_university ON public.alumni_events(university_id);

-- Create function to graduate a class
CREATE OR REPLACE FUNCTION public.graduate_class(class_id_param UUID)
RETURNS VOID AS $$
DECLARE
  class_record RECORD;
  student_record RECORD;
BEGIN
  -- Get class information
  SELECT * INTO class_record FROM public.classes WHERE id = class_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class not found';
  END IF;
  
  -- Mark class as graduated
  UPDATE public.classes 
  SET 
    is_graduated = true,
    graduation_date = NOW(),
    graduation_year = EXTRACT(YEAR FROM NOW())
  WHERE id = class_id_param;
  
  -- Update all students in this class to alumni role
  UPDATE public.profiles 
  SET role = 'alumni'
  WHERE class_id = class_id_param AND role = 'student';
  
  -- Create alumni profiles for all graduated students
  FOR student_record IN 
    SELECT user_id FROM public.profiles WHERE class_id = class_id_param
  LOOP
    INSERT INTO public.alumni_profiles (
      user_id,
      graduation_year,
      graduation_class_id
    ) VALUES (
      student_record.user_id,
      EXTRACT(YEAR FROM NOW()),
      class_id_param
    ) ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.graduate_class(UUID) TO authenticated;
