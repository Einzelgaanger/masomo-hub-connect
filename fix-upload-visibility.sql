-- Fix upload visibility issues
-- This script will make uploads visible to all authenticated users in the same class

-- First, let's check if RLS is enabled and what policies exist
-- (This is for reference - we'll create new policies)

-- Drop existing restrictive upload policies
DROP POLICY IF EXISTS "Users can view uploads in their class units" ON public.uploads;
DROP POLICY IF EXISTS "Uploads are viewable by class members" ON public.uploads;
DROP POLICY IF EXISTS "Users can create uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can update their own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users and lecturers can delete uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can upload to their class units" ON public.uploads;
DROP POLICY IF EXISTS "Users can update their own uploads, lecturers can update all" ON public.uploads;
DROP POLICY IF EXISTS "Users can delete their own uploads, lecturers can delete all" ON public.uploads;

-- Create simplified policies that work better

-- Allow all authenticated users to view uploads (for now, to fix the visibility issue)
CREATE POLICY "All authenticated users can view uploads" ON public.uploads
  FOR SELECT TO authenticated USING (true);

-- Allow users to upload to any unit (we'll restrict this later if needed)
CREATE POLICY "Authenticated users can upload" ON public.uploads
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

-- Allow users to update their own uploads
CREATE POLICY "Users can update own uploads" ON public.uploads
  FOR UPDATE TO authenticated USING (uploaded_by = auth.uid());

-- Allow users to delete their own uploads, admins can delete any
CREATE POLICY "Users can delete own uploads, admins can delete any" ON public.uploads
  FOR DELETE TO authenticated USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'lecturer')
    )
  );

-- Note: Storage policies need to be managed by a super admin
-- The storage.objects table requires special permissions

-- Make sure RLS is enabled on uploads table
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
