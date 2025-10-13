-- Create messages table for Ukumbi campus chat
-- This script creates the messages table for university-wide chat

-- ==============================================
-- 1. CREATE MESSAGES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'file')),
    media_url TEXT,
    media_filename TEXT,
    media_size BIGINT,
    media_duration INTEGER, -- For videos (seconds)
    media_thumbnail TEXT, -- For video thumbnails
    likes_count INTEGER DEFAULT 0,
    reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sending', 'sent', 'delivered', 'read')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================
-- 2. CREATE MESSAGE LIKES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS public.message_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id)
);

-- ==============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_message_likes_message_id ON public.message_likes(message_id);
CREATE INDEX IF NOT EXISTS idx_message_likes_user_id ON public.message_likes(user_id);

-- ==============================================
-- 4. ENABLE RLS
-- ==============================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_likes ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. CREATE RLS POLICIES
-- ==============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "messages_select_all" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_authenticated" ON public.messages;
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;
DROP POLICY IF EXISTS "message_likes_select_all" ON public.message_likes;
DROP POLICY IF EXISTS "message_likes_insert_authenticated" ON public.message_likes;
DROP POLICY IF EXISTS "message_likes_delete_own" ON public.message_likes;

-- Messages policies
CREATE POLICY "messages_select_all" ON public.messages
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "messages_insert_authenticated" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "messages_update_own" ON public.messages
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "messages_delete_own" ON public.messages
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Message likes policies
CREATE POLICY "message_likes_select_all" ON public.message_likes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "message_likes_insert_authenticated" ON public.message_likes
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "message_likes_delete_own" ON public.message_likes
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- ==============================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for messages table
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 7. INSERT SAMPLE WELCOME MESSAGE
-- ==============================================

-- Insert a welcome message from system (if no messages exist)
INSERT INTO public.messages (user_id, content, message_type)
SELECT 
    (SELECT id FROM auth.users LIMIT 1),
    'Welcome to Ukumbi! This is a campus-wide chat where you can connect with fellow students.',
    'text'
WHERE NOT EXISTS (SELECT 1 FROM public.messages LIMIT 1);

-- ==============================================
-- 8. GRANT PERMISSIONS
-- ==============================================

-- Grant necessary permissions
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.message_likes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
