-- Working upload visibility fix - handles existing policies
-- Run this in your Supabase SQL Editor

-- Drop ALL existing upload policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view uploads in their class units" ON public.uploads;
DROP POLICY IF EXISTS "Uploads are viewable by class members" ON public.uploads;
DROP POLICY IF EXISTS "Users can create uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can update their own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users and lecturers can delete uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can upload to their class units" ON public.uploads;
DROP POLICY IF EXISTS "Users can update their own uploads, lecturers can update all" ON public.uploads;
DROP POLICY IF EXISTS "Users can delete their own uploads, lecturers can delete all" ON public.uploads;
DROP POLICY IF EXISTS "All authenticated users can view uploads" ON public.uploads;
DROP POLICY IF EXISTS "Authenticated users can upload" ON public.uploads;
DROP POLICY IF EXISTS "Users can update own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can delete own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can view uploads in their class or all if no class" ON public.uploads;
DROP POLICY IF EXISTS "Users can delete own uploads, admins can delete any" ON public.uploads;

-- Create simple, working policies
CREATE POLICY "All authenticated users can view uploads" ON public.uploads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can upload" ON public.uploads
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own uploads" ON public.uploads
  FOR UPDATE TO authenticated USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete own uploads" ON public.uploads
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
