-- CONCERNS TABLE SETUP
-- Run this in your Supabase SQL Editor to enable the concerns system

-- 1. CREATE CONCERNS TABLE
CREATE TABLE IF NOT EXISTS public.concerns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'addressed')),
  admin_notes TEXT
);

-- 2. ENABLE RLS ON CONCERNS
ALTER TABLE public.concerns ENABLE ROW LEVEL SECURITY;

-- 3. CREATE CONCERNS POLICIES
DROP POLICY IF EXISTS "Users can insert their own concerns" ON public.concerns;
DROP POLICY IF EXISTS "Admins can view all concerns" ON public.concerns;
DROP POLICY IF EXISTS "Admins can update concerns" ON public.concerns;

CREATE POLICY "Users can insert their own concerns" ON public.concerns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all concerns" ON public.concerns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR role = 'super_admin')
    )
  );

CREATE POLICY "Admins can update concerns" ON public.concerns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND (role = 'admin' OR role = 'super_admin')
    )
  );

-- 4. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_concerns_created_at ON public.concerns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_concerns_status ON public.concerns(status);
CREATE INDEX IF NOT EXISTS idx_concerns_user_id ON public.concerns(user_id);

-- 5. GRANT ACCESS
GRANT ALL ON public.concerns TO authenticated;

-- DONE! The concerns system should now work.
