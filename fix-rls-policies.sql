-- Fix RLS policies to allow admin operations
-- Run this in your Supabase SQL Editor

-- First, let's check what policies exist and fix them

-- Drop existing restrictive policies for countries
DROP POLICY IF EXISTS "Countries are viewable by authenticated users" ON public.countries;
DROP POLICY IF EXISTS "Super admins can manage countries" ON public.countries;
DROP POLICY IF EXISTS "Authenticated users can insert countries" ON public.countries;
DROP POLICY IF EXISTS "Authenticated users can update countries" ON public.countries;
DROP POLICY IF EXISTS "Authenticated users can delete countries" ON public.countries;

-- Drop existing restrictive policies for universities  
DROP POLICY IF EXISTS "Universities are viewable by authenticated users" ON public.universities;
DROP POLICY IF EXISTS "Super admins can manage universities" ON public.universities;
DROP POLICY IF EXISTS "Authenticated users can insert universities" ON public.universities;
DROP POLICY IF EXISTS "Authenticated users can update universities" ON public.universities;
DROP POLICY IF EXISTS "Authenticated users can delete universities" ON public.universities;

-- Drop existing restrictive policies for classes
DROP POLICY IF EXISTS "Users can view classes in their university" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Classes are viewable by authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can update classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can delete classes" ON public.classes;

-- Drop existing restrictive policies for units
DROP POLICY IF EXISTS "Users can view units in their class" ON public.units;
DROP POLICY IF EXISTS "Admins can manage units" ON public.units;
DROP POLICY IF EXISTS "Units are viewable by authenticated users" ON public.units;
DROP POLICY IF EXISTS "Authenticated users can insert units" ON public.units;
DROP POLICY IF EXISTS "Authenticated users can update units" ON public.units;
DROP POLICY IF EXISTS "Authenticated users can delete units" ON public.units;

-- Create new, more permissive policies for admin operations

-- Countries policies - allow all authenticated users to read and insert
CREATE POLICY "Countries are viewable by authenticated users" ON public.countries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert countries" ON public.countries
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update countries" ON public.countries
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete countries" ON public.countries
  FOR DELETE TO authenticated USING (true);

-- Universities policies - allow all authenticated users to read and insert
CREATE POLICY "Universities are viewable by authenticated users" ON public.universities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert universities" ON public.universities
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update universities" ON public.universities
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete universities" ON public.universities
  FOR DELETE TO authenticated USING (true);

-- Classes policies - allow all authenticated users to read and insert
CREATE POLICY "Classes are viewable by authenticated users" ON public.classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert classes" ON public.classes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update classes" ON public.classes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete classes" ON public.classes
  FOR DELETE TO authenticated USING (true);

-- Units policies - allow all authenticated users to read and insert
CREATE POLICY "Units are viewable by authenticated users" ON public.units
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert units" ON public.units
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update units" ON public.units
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete units" ON public.units
  FOR DELETE TO authenticated USING (true);

-- Profiles policies - keep existing user-specific policies but add admin insert
-- Drop existing insert policy first
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.profiles;
CREATE POLICY "Authenticated users can insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (true);

-- Announcements policies - allow all authenticated users to read and insert
DROP POLICY IF EXISTS "Announcements are viewable by authenticated users" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON public.announcements;

CREATE POLICY "Announcements are viewable by authenticated users" ON public.announcements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert announcements" ON public.announcements
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update announcements" ON public.announcements
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete announcements" ON public.announcements
  FOR DELETE TO authenticated USING (true);

-- Uploads policies - allow all authenticated users to read and insert
DROP POLICY IF EXISTS "Uploads are viewable by authenticated users" ON public.uploads;
DROP POLICY IF EXISTS "Authenticated users can insert uploads" ON public.uploads;
DROP POLICY IF EXISTS "Authenticated users can update uploads" ON public.uploads;
DROP POLICY IF EXISTS "Authenticated users can delete uploads" ON public.uploads;

CREATE POLICY "Uploads are viewable by authenticated users" ON public.uploads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert uploads" ON public.uploads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update uploads" ON public.uploads
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete uploads" ON public.uploads
  FOR DELETE TO authenticated USING (true);

-- Assignments policies - allow all authenticated users to read and insert
DROP POLICY IF EXISTS "Assignments are viewable by authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Authenticated users can insert assignments" ON public.assignments;
DROP POLICY IF EXISTS "Authenticated users can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Authenticated users can delete assignments" ON public.assignments;

CREATE POLICY "Assignments are viewable by authenticated users" ON public.assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert assignments" ON public.assignments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update assignments" ON public.assignments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete assignments" ON public.assignments
  FOR DELETE TO authenticated USING (true);

-- Events policies - allow all authenticated users to read and insert
DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;

CREATE POLICY "Events are viewable by authenticated users" ON public.events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update events" ON public.events
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete events" ON public.events
  FOR DELETE TO authenticated USING (true);

-- Comments policies - allow all authenticated users to read and insert
DROP POLICY IF EXISTS "Comments are viewable by authenticated users" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can update comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can delete comments" ON public.comments;

CREATE POLICY "Comments are viewable by authenticated users" ON public.comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update comments" ON public.comments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete comments" ON public.comments
  FOR DELETE TO authenticated USING (true);

-- Upload reactions policies - allow all authenticated users to read and insert
DROP POLICY IF EXISTS "Upload reactions are viewable by authenticated users" ON public.upload_reactions;
DROP POLICY IF EXISTS "Authenticated users can insert upload reactions" ON public.upload_reactions;
DROP POLICY IF EXISTS "Authenticated users can update upload reactions" ON public.upload_reactions;
DROP POLICY IF EXISTS "Authenticated users can delete upload reactions" ON public.upload_reactions;

CREATE POLICY "Upload reactions are viewable by authenticated users" ON public.upload_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert upload reactions" ON public.upload_reactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update upload reactions" ON public.upload_reactions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete upload reactions" ON public.upload_reactions
  FOR DELETE TO authenticated USING (true);

-- Assignment completions policies - allow all authenticated users to read and insert
DROP POLICY IF EXISTS "Assignment completions are viewable by authenticated users" ON public.assignment_completions;
DROP POLICY IF EXISTS "Authenticated users can insert assignment completions" ON public.assignment_completions;
DROP POLICY IF EXISTS "Authenticated users can update assignment completions" ON public.assignment_completions;
DROP POLICY IF EXISTS "Authenticated users can delete assignment completions" ON public.assignment_completions;

CREATE POLICY "Assignment completions are viewable by authenticated users" ON public.assignment_completions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert assignment completions" ON public.assignment_completions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update assignment completions" ON public.assignment_completions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete assignment completions" ON public.assignment_completions
  FOR DELETE TO authenticated USING (true);

-- Daily visits policies - allow all authenticated users to read and insert
DROP POLICY IF EXISTS "Daily visits are viewable by authenticated users" ON public.daily_visits;
DROP POLICY IF EXISTS "Authenticated users can insert daily visits" ON public.daily_visits;
DROP POLICY IF EXISTS "Authenticated users can update daily visits" ON public.daily_visits;
DROP POLICY IF EXISTS "Authenticated users can delete daily visits" ON public.daily_visits;

CREATE POLICY "Daily visits are viewable by authenticated users" ON public.daily_visits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert daily visits" ON public.daily_visits
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update daily visits" ON public.daily_visits
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete daily visits" ON public.daily_visits
  FOR DELETE TO authenticated USING (true);

-- Verify the policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
