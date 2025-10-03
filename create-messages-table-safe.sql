-- Safe creation of messages table for campus-based chat (Ukumbi)
-- This version handles existing tables and adds missing columns

-- First, create the messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add media_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'media_url') THEN
        ALTER TABLE public.messages ADD COLUMN media_url TEXT;
    END IF;
    
    -- Add media_filename column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'media_filename') THEN
        ALTER TABLE public.messages ADD COLUMN media_filename TEXT;
    END IF;
    
    -- Add media_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'media_size') THEN
        ALTER TABLE public.messages ADD COLUMN media_size BIGINT;
    END IF;
    
    -- Add media_duration column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'media_duration') THEN
        ALTER TABLE public.messages ADD COLUMN media_duration INTEGER;
    END IF;
    
    -- Add media_thumbnail column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'media_thumbnail') THEN
        ALTER TABLE public.messages ADD COLUMN media_thumbnail TEXT;
    END IF;
    
    -- Add likes_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'likes_count') THEN
        ALTER TABLE public.messages ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add reply_to_message_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'reply_to_message_id') THEN
        ALTER TABLE public.messages ADD COLUMN reply_to_message_id UUID;
    END IF;
    
    -- Add delivery_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'delivery_status') THEN
        ALTER TABLE public.messages ADD COLUMN delivery_status TEXT DEFAULT 'sent';
    END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key constraint for user_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'messages' AND constraint_name = 'messages_user_id_fkey') THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key constraint for reply_to_message_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'messages' AND constraint_name = 'messages_reply_to_message_id_fkey') THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_reply_to_message_id_fkey 
        FOREIGN KEY (reply_to_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;
    END IF;
    
    -- Add check constraint for message_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'messages_message_type_check') THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check 
        CHECK (message_type IN ('text', 'image', 'video', 'file'));
    END IF;
    
    -- Add check constraint for delivery_status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'messages_delivery_status_check') THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_delivery_status_check 
        CHECK (delivery_status IN ('sending', 'sent', 'delivered', 'read'));
    END IF;
END $$;

-- Create message_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.message_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraints for message_likes if they don't exist
DO $$
BEGIN
    -- Add foreign key constraint for message_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'message_likes' AND constraint_name = 'message_likes_message_id_fkey') THEN
        ALTER TABLE public.message_likes ADD CONSTRAINT message_likes_message_id_fkey 
        FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key constraint for user_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'message_likes' AND constraint_name = 'message_likes_user_id_fkey') THEN
        ALTER TABLE public.message_likes ADD CONSTRAINT message_likes_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'message_likes' AND constraint_name = 'message_likes_message_id_user_id_key') THEN
        ALTER TABLE public.message_likes ADD CONSTRAINT message_likes_message_id_user_id_key 
        UNIQUE(message_id, user_id);
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_message_likes_message_id ON public.message_likes(message_id);
CREATE INDEX IF NOT EXISTS idx_message_likes_user_id ON public.message_likes(user_id);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;
DROP POLICY IF EXISTS "message_likes_select_policy" ON public.message_likes;
DROP POLICY IF EXISTS "message_likes_insert_policy" ON public.message_likes;
DROP POLICY IF EXISTS "message_likes_delete_policy" ON public.message_likes;

-- Create RLS policies for messages table
CREATE POLICY "messages_select_policy" ON public.messages
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "messages_update_policy" ON public.messages
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "messages_delete_policy" ON public.messages
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create RLS policies for message_likes table
CREATE POLICY "message_likes_select_policy" ON public.message_likes
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "message_likes_insert_policy" ON public.message_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "message_likes_delete_policy" ON public.message_likes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger to ensure it works
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE public.messages IS 'Campus-based chat messages for Ukumbi';
COMMENT ON TABLE public.message_likes IS 'Likes/reactions on chat messages';
COMMENT ON COLUMN public.messages.message_type IS 'Type of message: text, image, video, file';
COMMENT ON COLUMN public.messages.media_duration IS 'Duration in seconds for video messages';
COMMENT ON COLUMN public.messages.delivery_status IS 'Message delivery status: sending, sent, delivered, read';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Messages table setup completed successfully!';
    RAISE NOTICE 'Tables created/updated: messages, message_likes';
    RAISE NOTICE 'RLS policies created for secure access';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Ukumbi messaging system is now ready!';
END $$;
