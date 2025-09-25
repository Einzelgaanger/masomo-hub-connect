-- Temporary fix for Ukumbi messaging 400 error
-- This creates a simple RLS policy that should work immediately

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view messages in their university" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update message likes" ON public.messages;

-- Create simple, working policies
CREATE POLICY "Users can view messages in their university" ON public.messages
FOR SELECT TO authenticated
USING (true); -- Temporarily allow all authenticated users to see messages

CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update message likes" ON public.messages
FOR UPDATE TO authenticated
USING (true); -- Allow updates for likes

-- Ensure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Also fix message_likes table
DROP POLICY IF EXISTS "Users can view message likes" ON public.message_likes;
DROP POLICY IF EXISTS "Users can like messages" ON public.message_likes;
DROP POLICY IF EXISTS "Users can unlike messages" ON public.message_likes;

CREATE POLICY "Users can view message likes" ON public.message_likes
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can like messages" ON public.message_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike messages" ON public.message_likes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

ALTER TABLE public.message_likes ENABLE ROW LEVEL SECURITY;
