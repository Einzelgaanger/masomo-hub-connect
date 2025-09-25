-- Fix the foreign key relationship between messages and profiles
-- Add a foreign key constraint from messages.user_id to profiles.user_id

-- First, let's check if the constraint already exists
DO $$
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_user_id_profiles_fkey'
        AND table_name = 'messages'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_user_id_profiles_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Also ensure the message_likes table has the same relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'message_likes_user_id_profiles_fkey'
        AND table_name = 'message_likes'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.message_likes 
        ADD CONSTRAINT message_likes_user_id_profiles_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Refresh the schema cache (this might help with the relationship detection)
NOTIFY pgrst, 'reload schema';
