-- Enable Row Level Security (RLS) on all tables
-- This script enables RLS and creates proper policies for data security

-- 1. Enable RLS on all tables
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_visits ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Countries are viewable by authenticated users" ON public.countries;
DROP POLICY IF EXISTS "Universities are viewable by authenticated users" ON public.universities;
DROP POLICY IF EXISTS "Classes are viewable by authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Units are viewable by authenticated users" ON public.units;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Announcements are viewable by authenticated users" ON public.announcements;
DROP POLICY IF EXISTS "Uploads are viewable by authenticated users" ON public.uploads;
DROP POLICY IF EXISTS "Assignments are viewable by authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON public.events;
DROP POLICY IF EXISTS "Comments are viewable by authenticated users" ON public.comments;
DROP POLICY IF EXISTS "Upload reactions are viewable by authenticated users" ON public.upload_reactions;
DROP POLICY IF EXISTS "Assignment completions are viewable by authenticated users" ON public.assignment_completions;
DROP POLICY IF EXISTS "Daily visits are viewable by authenticated users" ON public.daily_visits;

-- 3. Create new RLS policies

-- Countries: Allow all authenticated users to read, only admins to write
CREATE POLICY "Countries are viewable by authenticated users" ON public.countries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage countries" ON public.countries
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Universities: Allow all authenticated users to read, only admins to write
CREATE POLICY "Universities are viewable by authenticated users" ON public.universities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage universities" ON public.universities
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Classes: Allow users to read classes in their university, admins to manage all
CREATE POLICY "Users can view classes in their university" ON public.classes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.class_id = classes.id
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Units: Allow users to read units in their class, admins to manage all
CREATE POLICY "Users can view units in their class" ON public.units
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.class_id = units.class_id
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage units" ON public.units
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Profiles: Users can read all profiles, update only their own
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Announcements: Allow all authenticated users to read, admins and lecturers to write
CREATE POLICY "Announcements are viewable by authenticated users" ON public.announcements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and lecturers can manage announcements" ON public.announcements
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'lecturer')
    )
    OR created_by = auth.uid()
  );

-- Uploads: Users can read uploads in their class, upload their own, lecturers can manage all
CREATE POLICY "Uploads are viewable by class members" ON public.uploads
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.units u ON p.class_id = u.class_id
      WHERE p.user_id = auth.uid() 
      AND u.id = uploads.unit_id
    )
  );

CREATE POLICY "Users can upload to their class units" ON public.uploads
  FOR INSERT TO authenticated WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.units u ON p.class_id = u.class_id
      WHERE p.user_id = auth.uid() 
      AND u.id = uploads.unit_id
    )
  );

CREATE POLICY "Users can update their own uploads, lecturers can update all" ON public.uploads
  FOR UPDATE TO authenticated USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('lecturer', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Users can delete their own uploads, lecturers can delete all" ON public.uploads
  FOR DELETE TO authenticated USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('lecturer', 'admin', 'super_admin')
    )
  );

-- Assignments: Similar to uploads
CREATE POLICY "Assignments are viewable by class members" ON public.assignments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.units u ON p.class_id = u.class_id
      WHERE p.user_id = auth.uid() 
      AND u.id = assignments.unit_id
    )
  );

CREATE POLICY "Lecturers can manage assignments" ON public.assignments
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('lecturer', 'admin', 'super_admin')
    )
    OR created_by = auth.uid()
  );

-- Events: Similar to assignments
CREATE POLICY "Events are viewable by class members" ON public.events
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.units u ON p.class_id = u.class_id
      WHERE p.user_id = auth.uid() 
      AND u.id = events.unit_id
    )
  );

CREATE POLICY "Lecturers can manage events" ON public.events
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('lecturer', 'admin', 'super_admin')
    )
    OR created_by = auth.uid()
  );

-- Comments: Users can read all comments in their class, create their own
CREATE POLICY "Comments are viewable by class members" ON public.comments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.units u ON p.class_id = u.class_id
      WHERE p.user_id = auth.uid() 
      AND u.id = comments.unit_id
    )
  );

CREATE POLICY "Users can create comments in their class" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.units u ON p.class_id = u.class_id
      WHERE p.user_id = auth.uid() 
      AND u.id = comments.unit_id
    )
  );

CREATE POLICY "Users can update their own comments, lecturers can update all" ON public.comments
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('lecturer', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Users can delete their own comments, lecturers can delete all" ON public.comments
  FOR DELETE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('lecturer', 'admin', 'super_admin')
    )
  );

-- Upload reactions: Users can manage their own reactions
CREATE POLICY "Upload reactions are viewable by class members" ON public.upload_reactions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.units u ON p.class_id = u.class_id
      JOIN public.uploads up ON u.id = up.unit_id
      WHERE p.user_id = auth.uid() 
      AND up.id = upload_reactions.upload_id
    )
  );

CREATE POLICY "Users can manage their own upload reactions" ON public.upload_reactions
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Assignment completions: Users can manage their own completions
CREATE POLICY "Assignment completions are viewable by class members" ON public.assignment_completions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.units u ON p.class_id = u.class_id
      JOIN public.assignments a ON u.id = a.unit_id
      WHERE p.user_id = auth.uid() 
      AND a.id = assignment_completions.assignment_id
    )
  );

CREATE POLICY "Users can manage their own assignment completions" ON public.assignment_completions
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Daily visits: Users can manage their own visits
CREATE POLICY "Daily visits are viewable by class members" ON public.daily_visits
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.units u ON p.class_id = u.class_id
      WHERE p.user_id = auth.uid() 
      AND u.id = daily_visits.unit_id
    )
  );

CREATE POLICY "Users can manage their own daily visits" ON public.daily_visits
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- 4. Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can view uploads" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'uploads');

CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS enabled and policies created successfully!
