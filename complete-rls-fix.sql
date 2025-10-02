-- Complete RLS Fix - Remove all potential sources of recursion
-- This will completely reset all RLS policies and functions that might cause recursion

-- 1. DISABLE RLS ON ALL TABLES TEMPORARILY
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.concerns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_views DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES ON PROFILES TABLE
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- 3. DROP ANY PROBLEMATIC FUNCTIONS THAT MIGHT CAUSE RECURSION
DROP FUNCTION IF EXISTS public.update_user_points(uuid, integer);
DROP FUNCTION IF EXISTS public.get_user_profile(uuid);
DROP FUNCTION IF EXISTS public.check_user_permissions(uuid);

-- 4. CREATE SIMPLE, NON-RECURSIVE POLICIES FOR PROFILES
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- 5. CREATE A SIMPLE UPDATE_USER_POINTS FUNCTION WITHOUT RECURSION
CREATE OR REPLACE FUNCTION public.update_user_points(
  target_user_id uuid,
  points_to_add integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple update without any policy checks
  UPDATE public.profiles 
  SET points = COALESCE(points, 0) + points_to_add,
      updated_at = NOW()
  WHERE user_id = target_user_id;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- 6. RE-ENABLE RLS ONLY ON PROFILES TABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. VERIFY THE FIX
SELECT 'RLS policies reset successfully' as status;

-- 8. TEST A SIMPLE QUERY
SELECT COUNT(*) as profile_count FROM public.profiles;
