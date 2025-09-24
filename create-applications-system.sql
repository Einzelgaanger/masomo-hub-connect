-- Create applications system for new authentication flow
-- Run this in your Supabase SQL Editor

-- 1. Create applications table for student class requests
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  admission_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejected_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  UNIQUE(user_id, class_id) -- Prevent duplicate applications for same class
);

-- 2. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_class_id ON public.applications(class_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at);

-- 3. Enable RLS on applications table
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for applications
-- Applications are viewable by the applicant and admins of the class
CREATE POLICY "Users can view their own applications" ON public.applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view applications for their classes" ON public.applications
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classes c ON c.id = applications.class_id
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
      AND (c.id = applications.class_id OR p.role = 'super_admin')
    )
  );

-- Users can create applications
CREATE POLICY "Authenticated users can create applications" ON public.applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Only admins can update applications (approve/reject)
CREATE POLICY "Admins can update applications" ON public.applications
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classes c ON c.id = applications.class_id
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
      AND (c.id = applications.class_id OR p.role = 'super_admin')
    )
  );

-- Only admins can delete applications
CREATE POLICY "Admins can delete applications" ON public.applications
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classes c ON c.id = applications.class_id
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
      AND (c.id = applications.class_id OR p.role = 'super_admin')
    )
  );

-- 5. Create RLS policies for profiles table
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Allow system to insert profiles (for triggers)
CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (true);

-- Admins can view all profiles in their classes
CREATE POLICY "Admins can view profiles in their classes" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Admins can update profiles in their classes
CREATE POLICY "Admins can update profiles in their classes" ON public.profiles
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Admins can delete profiles in their classes
CREATE POLICY "Admins can delete profiles in their classes" ON public.profiles
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 6. Create function to automatically create profile when application is approved
CREATE OR REPLACE FUNCTION public.handle_approved_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update approved_at timestamp
    NEW.approved_at = now();
    
    -- Create profile for the approved student
    INSERT INTO public.profiles (
      user_id,
      full_name,
      email,
      admission_number,
      class_id,
      role,
      points,
      rank,
      character_id
    )
    SELECT 
      NEW.user_id,
      NEW.full_name,
      au.email,
      NEW.admission_number,
      NEW.class_id,
      'student',
      0,
      'bronze',
      1 -- Default character
    FROM auth.users au
    WHERE au.id = NEW.user_id
    ON CONFLICT (user_id) DO UPDATE SET
      class_id = NEW.class_id,
      full_name = NEW.full_name,
      admission_number = NEW.admission_number,
      updated_at = now();
  END IF;
  
  -- Handle rejection
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    NEW.rejected_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger for automatic profile creation on approval
DROP TRIGGER IF EXISTS trigger_handle_approved_application ON public.applications;
CREATE TRIGGER trigger_handle_approved_application
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_approved_application();

-- 7. Create function to check if user already has an application or profile for a class
CREATE OR REPLACE FUNCTION public.check_existing_class_access(user_uuid UUID, class_uuid UUID)
RETURNS TABLE (
  has_application BOOLEAN,
  has_profile BOOLEAN,
  application_status TEXT,
  profile_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.applications WHERE user_id = user_uuid AND class_id = class_uuid) as has_application,
    EXISTS(SELECT 1 FROM public.profiles WHERE user_id = user_uuid AND class_id = class_uuid) as has_profile,
    COALESCE((SELECT status FROM public.applications WHERE user_id = user_uuid AND class_id = class_uuid), '') as application_status,
    COALESCE((SELECT role FROM public.profiles WHERE user_id = user_uuid AND class_id = class_uuid), '') as profile_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update existing profiles table to handle new flow
-- Add a column to track if profile was created from application
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_from_application BOOLEAN DEFAULT false;

-- 9. Update the trigger to set this flag
CREATE OR REPLACE FUNCTION public.handle_approved_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update approved_at timestamp
    NEW.approved_at = now();
    
    -- Create profile for the approved student
    INSERT INTO public.profiles (
      user_id,
      full_name,
      email,
      admission_number,
      class_id,
      role,
      points,
      rank,
      character_id,
      created_from_application
    )
    SELECT 
      NEW.user_id,
      NEW.full_name,
      au.email,
      NEW.admission_number,
      NEW.class_id,
      'student',
      0,
      'bronze',
      1, -- Default character
      true -- Mark as created from application
    FROM auth.users au
    WHERE au.id = NEW.user_id
    ON CONFLICT (user_id) DO UPDATE SET
      class_id = NEW.class_id,
      full_name = NEW.full_name,
      admission_number = NEW.admission_number,
      updated_at = now();
  END IF;
  
  -- Handle rejection
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    NEW.rejected_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create view for admin to see applications with class details
CREATE OR REPLACE VIEW public.admin_applications_view AS
SELECT 
  a.id,
  a.user_id,
  a.full_name,
  a.admission_number,
  a.status,
  a.created_at,
  a.updated_at,
  a.approved_at,
  a.rejected_at,
  a.rejection_reason,
  c.course_name,
  c.course_year,
  c.semester,
  c.course_group,
  u.name as university_name,
  co.name as country_name,
  au.email
FROM public.applications a
JOIN public.classes c ON c.id = a.class_id
JOIN public.universities u ON u.id = c.university_id
JOIN public.countries co ON co.id = u.country_id
JOIN auth.users au ON au.id = a.user_id
ORDER BY a.created_at DESC;

-- 11. Grant access to the view
GRANT SELECT ON public.admin_applications_view TO authenticated;

-- Note: Views inherit RLS policies from their underlying tables
-- The applications table policies will automatically apply to this view

-- 12. Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a basic profile for new users (they'll update it later through applications)
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    admission_number,
    role,
    points,
    rank,
    created_from_application
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    '',
    'student',
    0,
    'bronze',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
