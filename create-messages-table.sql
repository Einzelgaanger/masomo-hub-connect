-- Create messages table for campus-based chat (Ukumbi)

-- First, create the messages table
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

-- Create message_likes table for tracking who liked which messages
CREATE TABLE IF NOT EXISTS public.message_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_message_likes_message_id ON public.message_likes(message_id);
CREATE INDEX IF NOT EXISTS idx_message_likes_user_id ON public.message_likes(user_id);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages table

-- Allow authenticated users to read all messages (campus-based filtering happens in app)
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert their own messages
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own messages
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
CREATE POLICY "messages_update_policy" ON public.messages
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own messages
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;
CREATE POLICY "messages_delete_policy" ON public.messages
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create RLS policies for message_likes table

-- Allow authenticated users to read all message likes
DROP POLICY IF EXISTS "message_likes_select_policy" ON public.message_likes;
CREATE POLICY "message_likes_select_policy" ON public.message_likes
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert their own likes
DROP POLICY IF EXISTS "message_likes_insert_policy" ON public.message_likes;
CREATE POLICY "message_likes_insert_policy" ON public.message_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own likes
DROP POLICY IF EXISTS "message_likes_delete_policy" ON public.message_likes;
CREATE POLICY "message_likes_delete_policy" ON public.message_likes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.messages IS 'Campus-based chat messages for Ukumbi';
COMMENT ON TABLE public.message_likes IS 'Likes/reactions on chat messages';
COMMENT ON COLUMN public.messages.message_type IS 'Type of message: text, image, video, file';
COMMENT ON COLUMN public.messages.media_duration IS 'Duration in seconds for video messages';
COMMENT ON COLUMN public.messages.delivery_status IS 'Message delivery status: sending, sent, delivered, read';
