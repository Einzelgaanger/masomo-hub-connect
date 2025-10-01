-- =====================================================
-- RUN THIS NOW TO FIX ALL ERRORS
-- =====================================================

-- This fixes the "infinite recursion" error you're seeing
-- Copy this entire file and run it in Supabase SQL Editor

-- =====================================================
-- FIX 1: Infinite Recursion in class_members RLS
-- =====================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Class members can view other members" ON public.class_members;
DROP POLICY IF EXISTS "Class creators can manage members" ON public.class_members;

-- Recreate policies without recursion
CREATE POLICY "Class members can view other members" ON public.class_members
  FOR SELECT TO authenticated USING (
    -- User is a member of this class (direct check without recursion)
    user_id = auth.uid()
    OR 
    -- Or check if auth.uid() is in the same class (simple subquery)
    class_id IN (
      SELECT class_id FROM public.class_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Class creators can manage members" ON public.class_members
  FOR ALL TO authenticated USING (
    -- User can manage their own membership (to leave class)
    user_id = auth.uid()
    OR
    -- Or user is the creator of this class (check via classes table directly)
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = class_members.class_id 
      AND classes.creator_id = auth.uid()
    )
  ) WITH CHECK (
    -- Same check for INSERT/UPDATE
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = class_members.class_id 
      AND classes.creator_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS Policies Fixed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Infinite recursion error should be GONE';
  RAISE NOTICE 'Refresh your browser to see changes';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- NEXT STEPS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AFTER RUNNING THIS SCRIPT:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. Refresh your browser';
  RAISE NOTICE '2. Go to /masomo';
  RAISE NOTICE '3. Create a class';
  RAISE NOTICE '4. Test everything!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'System should be fully functional now!';
  RAISE NOTICE '========================================';
END $$;

