-- Fix RLS policies for messages table to allow authenticated users to insert and read messages

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all messages
CREATE POLICY "messages_select_policy" ON public.messages
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert their own messages
CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own messages
CREATE POLICY "messages_update_policy" ON public.messages
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own messages
CREATE POLICY "messages_delete_policy" ON public.messages
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Also check if message_likes table needs RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "message_likes_select_policy" ON public.message_likes;
DROP POLICY IF EXISTS "message_likes_insert_policy" ON public.message_likes;
DROP POLICY IF EXISTS "message_likes_delete_policy" ON public.message_likes;

-- Enable RLS on message_likes table
ALTER TABLE public.message_likes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all message likes
CREATE POLICY "message_likes_select_policy" ON public.message_likes
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert their own likes
CREATE POLICY "message_likes_insert_policy" ON public.message_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own likes
CREATE POLICY "message_likes_delete_policy" ON public.message_likes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
