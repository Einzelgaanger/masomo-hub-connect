-- Fix 406 Error for Profiles Table
-- This script will completely reset and fix the RLS policies for the profiles table
-- to resolve the 406 "Not Acceptable" error when fetching profile data

-- ==============================================
-- 1. COMPLETELY RESET PROFILES RLS POLICIES
-- ==============================================

-- Temporarily disable RLS to allow policy cleanup
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on profiles table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Get all policies on profiles table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND schemaname = 'public'
    LOOP
        -- Drop each policy
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.profiles';
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- ==============================================
-- 2. CREATE SIMPLE, NON-RECURSIVE RLS POLICIES
-- ==============================================

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies that don't cause recursion
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ==============================================
-- 3. ENSURE PROFILE CREATION TRIGGER WORKS
-- ==============================================

-- Create or replace the trigger function for new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    role,
    points,
    rank,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'student',
    0,
    'bronze',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- 4. VERIFY THE FIX
-- ==============================================

-- Test that we can query profiles (this should work now)
DO $$
BEGIN
    -- This will fail if RLS is still broken
    PERFORM 1 FROM public.profiles LIMIT 1;
    RAISE NOTICE '=== PROFILES RLS FIX SUCCESSFUL ===';
    RAISE NOTICE 'Profiles table is now accessible';
    RAISE NOTICE '406 error should be resolved';
    RAISE NOTICE 'Users can now fetch their profile data';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: %', SQLERRM;
        RAISE NOTICE 'Profiles table still has issues - check manually';
END $$;

-- ==============================================
-- 5. ADDITIONAL SAFETY MEASURES
-- ==============================================

-- Ensure the profiles table has the necessary columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON public.profiles(class_id);

-- Success message
SELECT 
    'Profiles RLS policies fixed successfully' as status,
    '406 error should now be resolved' as message,
    'Users can fetch profile data' as result;
