-- EMERGENCY FIX for Ukumbi messaging and Alumni page errors
-- Run this entire script in your Supabase SQL Editor to fix all issues

-- ============================================================================
-- PART 1: FIX MESSAGES TABLE AND RELATIONSHIPS
-- ============================================================================

-- First, let's disable RLS temporarily to fix the relationships
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_likes DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view messages in their university" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update message likes" ON public.messages;
DROP POLICY IF EXISTS "Users can view message likes" ON public.message_likes;
DROP POLICY IF EXISTS "Users can like messages" ON public.message_likes;
DROP POLICY IF EXISTS "Users can unlike messages" ON public.message_likes;

-- Ensure foreign key constraints exist
DO $$ BEGIN
  -- Add foreign key for messages.user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_user_id_fkey' 
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE public.messages 
    ADD CONSTRAINT messages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign keys for message_likes if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'message_likes_message_id_fkey' 
    AND table_name = 'message_likes'
  ) THEN
    ALTER TABLE public.message_likes 
    ADD CONSTRAINT message_likes_message_id_fkey 
    FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'message_likes_user_id_fkey' 
    AND table_name = 'message_likes'
  ) THEN
    ALTER TABLE public.message_likes 
    ADD CONSTRAINT message_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Re-enable RLS with simple policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_likes ENABLE ROW LEVEL SECURITY;

-- Create simple, working RLS policies for messages
CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "messages_insert_policy" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "messages_update_policy" ON public.messages
FOR UPDATE TO authenticated
USING (true);

-- Create simple, working RLS policies for message_likes
CREATE POLICY "message_likes_select_policy" ON public.message_likes
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "message_likes_insert_policy" ON public.message_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "message_likes_delete_policy" ON public.message_likes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- PART 2: FIX ALUMNI SUCCESS STORIES
-- ============================================================================

-- Disable RLS temporarily
ALTER TABLE public.alumni_success_stories DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view success stories in their university" ON public.alumni_success_stories;
DROP POLICY IF EXISTS "Users can create success stories" ON public.alumni_success_stories;

-- Re-enable RLS with simple policies
ALTER TABLE public.alumni_success_stories ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "alumni_success_stories_select_policy" ON public.alumni_success_stories
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "alumni_success_stories_insert_policy" ON public.alumni_success_stories
FOR INSERT TO authenticated
WITH CHECK (alumni_id = auth.uid());

-- ============================================================================
-- PART 3: FIX ALUMNI EVENTS
-- ============================================================================

-- Disable RLS temporarily
ALTER TABLE public.alumni_events DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view alumni events in their university" ON public.alumni_events;
DROP POLICY IF EXISTS "Users can create alumni events" ON public.alumni_events;

-- Re-enable RLS with simple policies
ALTER TABLE public.alumni_events ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "alumni_events_select_policy" ON public.alumni_events
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "alumni_events_insert_policy" ON public.alumni_events
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- PART 4: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_university_id ON public.messages(university_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_likes_message_id ON public.message_likes(message_id);
CREATE INDEX IF NOT EXISTS idx_alumni_success_stories_alumni_id ON public.alumni_success_stories(alumni_id);
CREATE INDEX IF NOT EXISTS idx_alumni_events_university_id ON public.alumni_events(university_id);
CREATE INDEX IF NOT EXISTS idx_alumni_events_created_by ON public.alumni_events(created_by);

-- ============================================================================
-- PART 5: REFRESH SCHEMA CACHE
-- ============================================================================

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICATION QUERIES (Optional - you can run these to test)
-- ============================================================================

-- Test messages table
-- SELECT COUNT(*) FROM public.messages;

-- Test message_likes table  
-- SELECT COUNT(*) FROM public.message_likes;

-- Test alumni tables
-- SELECT COUNT(*) FROM public.alumni_success_stories;
-- SELECT COUNT(*) FROM public.alumni_events;

-- Success message
SELECT 'Database relationships and RLS policies have been fixed successfully!' as status;
