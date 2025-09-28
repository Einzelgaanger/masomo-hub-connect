-- Fix uploads table by adding missing link_url column
-- This fixes the error: "Could not find the 'link_url' column of 'uploads' in the schema cache"

-- Add the missing link_url column to uploads table
ALTER TABLE public.uploads 
ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.uploads.link_url IS 'Optional URL link for notes/assignments (alternative to file upload)';

-- Update the uploads table to allow both file_url and link_url to be null
-- but at least one should be provided
ALTER TABLE public.uploads 
ADD CONSTRAINT check_file_or_link 
CHECK (file_url IS NOT NULL OR link_url IS NOT NULL);

-- Create index for better performance on link_url queries
CREATE INDEX IF NOT EXISTS idx_uploads_link_url ON public.uploads(link_url) WHERE link_url IS NOT NULL;

-- Update RLS policies to handle the new column
-- The existing policies should work fine, but let's ensure they're up to date
DROP POLICY IF EXISTS "Uploads are viewable by class members" ON public.uploads;
DROP POLICY IF EXISTS "Users can upload to their class units" ON public.uploads;
DROP POLICY IF EXISTS "Users can update their own uploads, lecturers can update all" ON public.uploads;
DROP POLICY IF EXISTS "Users can delete their own uploads, lecturers can delete all" ON public.uploads;

-- Recreate RLS policies
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

-- Also add link_url to assignments table if it doesn't exist
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.assignments.link_url IS 'Optional URL link for assignments (alternative to file upload)';

-- Update assignments table constraint
ALTER TABLE public.assignments 
ADD CONSTRAINT check_file_or_link_assignments 
CHECK (file_url IS NOT NULL OR link_url IS NOT NULL);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_link_url ON public.assignments(link_url) WHERE link_url IS NOT NULL;

-- Verify the changes
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('uploads', 'assignments') 
  AND column_name = 'link_url'
ORDER BY table_name;
