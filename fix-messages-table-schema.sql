-- FIX: Add missing reply_to_message_id column to messages table
-- This will resolve the "Could not find the 'reply_to_message_id' column" error

-- Add the missing column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'reply_to_message_id'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure the messages table has all required columns
DO $$ BEGIN
  -- Check and add any other missing columns that might be needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'university_id'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;
  END IF;
END $$;

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

-- Add foreign key for message_likes if they don't exist
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

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'Messages table schema has been fixed successfully!' as status;
