-- ADD EMAIL COLUMN TO APPLICATIONS TABLE
-- Run this in your Supabase SQL Editor to add email functionality

-- 1. ADD EMAIL COLUMN TO APPLICATIONS TABLE
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. UPDATE EXISTING APPLICATIONS WITH USER EMAILS
-- This will populate existing applications with user emails from auth.users
UPDATE public.applications 
SET email = auth.users.email
FROM auth.users 
WHERE applications.user_id = auth.users.id 
AND applications.email IS NULL;

-- 3. CREATE INDEX FOR EMAIL SEARCHES
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);

-- 4. UPDATE ADMIN APPLICATIONS VIEW TO INCLUDE EMAIL
DROP VIEW IF EXISTS public.admin_applications_view;

CREATE VIEW public.admin_applications_view AS
SELECT 
  a.id,
  a.user_id,
  a.full_name,
  a.admission_number,
  a.email,
  a.status,
  a.created_at,
  a.updated_at,
  a.approved_at,
  a.rejected_at,
  a.rejection_reason,
  a.class_id
FROM public.applications a
ORDER BY a.created_at DESC;

-- 5. GRANT ACCESS TO THE VIEW
GRANT SELECT ON public.admin_applications_view TO authenticated;

-- DONE! Applications now include email addresses
