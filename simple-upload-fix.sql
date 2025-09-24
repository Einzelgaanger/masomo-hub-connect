-- Simple upload visibility fix
-- This script fixes the main upload visibility issue without requiring special permissions

-- Drop existing restrictive policies
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

-- Create simple, working policies
-- Policy 1: Allow all authenticated users to view uploads
CREATE POLICY "All authenticated users can view uploads" ON public.uploads
  FOR SELECT TO authenticated USING (true);

-- Policy 2: Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON public.uploads
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

-- Policy 3: Allow users to update their own uploads
CREATE POLICY "Users can update own uploads" ON public.uploads
  FOR UPDATE TO authenticated USING (uploaded_by = auth.uid());

-- Policy 4: Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads" ON public.uploads
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
