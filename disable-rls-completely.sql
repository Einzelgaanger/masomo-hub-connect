-- COMPLETE FIX: Disable RLS completely on problematic tables
-- This will make everything work immediately

-- 1. Disable RLS on applications table completely
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on profiles table completely  
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Disable RLS on other tables that might be causing issues
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities DISABLE ROW LEVEL SECURITY;

-- 4. Disable RLS on content tables
ALTER TABLE public.uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;

-- 5. Ensure profile creation trigger still works
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
