-- Enable Row Level Security (RLS) on all tables
-- This script enables RLS and creates basic policies for data security

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

-- 3. Create simple RLS policies (allow all authenticated users for now)

-- Countries: Allow all authenticated users to read and write
CREATE POLICY "Countries are viewable by authenticated users" ON public.countries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage countries" ON public.countries
  FOR ALL TO authenticated USING (true);

-- Universities: Allow all authenticated users to read and write
CREATE POLICY "Universities are viewable by authenticated users" ON public.universities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage universities" ON public.universities
  FOR ALL TO authenticated USING (true);

-- Classes: Allow all authenticated users to read and write
CREATE POLICY "Classes are viewable by authenticated users" ON public.classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage classes" ON public.classes
  FOR ALL TO authenticated USING (true);

-- Units: Allow all authenticated users to read and write
CREATE POLICY "Units are viewable by authenticated users" ON public.units
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage units" ON public.units
  FOR ALL TO authenticated USING (true);

-- Profiles: Users can read all profiles, update only their own
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Announcements: Allow all authenticated users to read and write
CREATE POLICY "Announcements are viewable by authenticated users" ON public.announcements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage announcements" ON public.announcements
  FOR ALL TO authenticated USING (true);

-- Uploads: Allow all authenticated users to read and write
CREATE POLICY "Uploads are viewable by authenticated users" ON public.uploads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage uploads" ON public.uploads
  FOR ALL TO authenticated USING (true);

-- Assignments: Allow all authenticated users to read and write
CREATE POLICY "Assignments are viewable by authenticated users" ON public.assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage assignments" ON public.assignments
  FOR ALL TO authenticated USING (true);

-- Events: Allow all authenticated users to read and write
CREATE POLICY "Events are viewable by authenticated users" ON public.events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage events" ON public.events
  FOR ALL TO authenticated USING (true);

-- Comments: Allow all authenticated users to read and write
CREATE POLICY "Comments are viewable by authenticated users" ON public.comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage comments" ON public.comments
  FOR ALL TO authenticated USING (true);

-- Upload reactions: Allow all authenticated users to read and write
CREATE POLICY "Upload reactions are viewable by authenticated users" ON public.upload_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage upload reactions" ON public.upload_reactions
  FOR ALL TO authenticated USING (true);

-- Assignment completions: Allow all authenticated users to read and write
CREATE POLICY "Assignment completions are viewable by authenticated users" ON public.assignment_completions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage assignment completions" ON public.assignment_completions
  FOR ALL TO authenticated USING (true);

-- Daily visits: Allow all authenticated users to read and write
CREATE POLICY "Daily visits are viewable by authenticated users" ON public.daily_visits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage daily visits" ON public.daily_visits
  FOR ALL TO authenticated USING (true);

-- 4. Storage policies are managed by Supabase - skipping for now
-- You can configure storage policies through the Supabase dashboard if needed

-- RLS enabled with basic policies successfully!
