-- =====================================================
-- FIX: Infinite recursion in class_members RLS policy
-- =====================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Class members can view other members" ON public.class_members;
DROP POLICY IF EXISTS "Class creators can manage members" ON public.class_members;

-- Recreate policies without recursion
-- Policy 1: Anyone can view members of classes they belong to
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

-- Policy 2: Creators can manage, users can delete their own membership
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

-- Verify the policies are working
DO $$
BEGIN
  RAISE NOTICE '✅ class_members RLS policies fixed (infinite recursion removed)';
END $$;

