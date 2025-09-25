-- Simple migration to add missing columns and functions to applications table

-- Add missing columns to applications table if they don't exist
DO $$ 
BEGIN
    -- Add approved_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'approved_at') THEN
        ALTER TABLE public.applications ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add rejected_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'rejected_at') THEN
        ALTER TABLE public.applications ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add rejection_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.applications ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- Add approved_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'approved_by') THEN
        ALTER TABLE public.applications ADD COLUMN approved_by UUID;
    END IF;
    
    -- Add rejected_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'rejected_by') THEN
        ALTER TABLE public.applications ADD COLUMN rejected_by UUID;
    END IF;
END $$;

-- Create or replace the trigger function for approved applications
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
      rank
    )
    SELECT 
      NEW.user_id,
      NEW.full_name,
      au.email,
      NEW.admission_number,
      NEW.class_id,
      'student',
      0,
      'bronze'
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

-- Create or replace the trigger
DROP TRIGGER IF EXISTS handle_approved_application_trigger ON public.applications;
CREATE TRIGGER handle_approved_application_trigger
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_approved_application();

-- Create or replace function to check existing class access
CREATE OR REPLACE FUNCTION public.check_existing_class_access(user_uuid UUID, class_uuid UUID)
RETURNS TABLE(has_application BOOLEAN, has_profile BOOLEAN, application_status TEXT, profile_role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.applications WHERE user_id = user_uuid AND class_id = class_uuid) as has_application,
    EXISTS(SELECT 1 FROM public.profiles WHERE user_id = user_uuid AND class_id = class_uuid) as has_profile,
    COALESCE((SELECT status FROM public.applications WHERE user_id = user_uuid AND class_id = class_uuid), '') as application_status,
    COALESCE((SELECT role FROM public.profiles WHERE user_id = user_uuid AND class_id = class_uuid), '') as profile_role;
END;
$$;
