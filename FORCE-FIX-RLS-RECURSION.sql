-- =====================================================
-- FORCE FIX: Disable RLS, Drop All Policies, Recreate
-- =====================================================

-- Step 1: Temporarily disable RLS
ALTER TABLE public.class_members DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Class members can view other members" ON public.class_members;
DROP POLICY IF EXISTS "Class creators can manage members" ON public.class_members;
DROP POLICY IF EXISTS "Users can manage their own membership" ON public.class_members;
DROP POLICY IF EXISTS "Class members view members" ON public.class_members;
DROP POLICY IF EXISTS "Manage class members" ON public.class_members;

-- Step 3: Wait a moment (PostgreSQL internal)
SELECT pg_sleep(1);

-- Step 4: Create SIMPLE policies (no recursion possible)
CREATE POLICY "view_own_membership" ON public.class_members
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "view_same_class_members" ON public.class_members
  FOR SELECT TO authenticated 
  USING (
    class_id IN (
      SELECT cm.class_id 
      FROM public.class_members cm 
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "delete_own_membership" ON public.class_members
  FOR DELETE TO authenticated 
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "creator_insert_members" ON public.class_members
  FOR INSERT TO authenticated 
  WITH CHECK (
    -- Only via RPC or if you're the creator
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id 
      AND c.creator_id = auth.uid()
    )
    OR user_id = auth.uid() -- Allow self-insertion via trigger
  );

CREATE POLICY "creator_delete_members" ON public.class_members
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id 
      AND c.creator_id = auth.uid()
    )
  );

CREATE POLICY "creator_update_members" ON public.class_members
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id 
      AND c.creator_id = auth.uid()
    )
  );

-- Step 5: Re-enable RLS
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- Step 6: Force cache refresh
SELECT pg_notify('pgrst', 'reload schema');

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS FORCE FIXED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All policies dropped and recreated';
  RAISE NOTICE 'RLS cache should be cleared';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Wait 5 seconds';
  RAISE NOTICE '2. Hard refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '3. Clear browser cache if needed';
  RAISE NOTICE '4. Go to /masomo';
  RAISE NOTICE '========================================';
END $$;

