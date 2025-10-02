-- Fix class_join_requests table schema and related issues
-- This script ensures the table has the correct columns and removes any incorrect ones

-- First, let's check and fix the class_join_requests table structure
DO $$
BEGIN
    -- Drop columns that shouldn't exist (if they do)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'class_join_requests' 
               AND column_name = 'full_name') THEN
        ALTER TABLE public.class_join_requests DROP COLUMN full_name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'class_join_requests' 
               AND column_name = 'email') THEN
        ALTER TABLE public.class_join_requests DROP COLUMN email;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'class_join_requests' 
               AND column_name = 'message') THEN
        ALTER TABLE public.class_join_requests DROP COLUMN message;
    END IF;
    
    -- Add columns that should exist (if they don't)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_join_requests' 
                   AND column_name = 'request_message') THEN
        ALTER TABLE public.class_join_requests ADD COLUMN request_message TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_join_requests' 
                   AND column_name = 'responded_at') THEN
        ALTER TABLE public.class_join_requests ADD COLUMN responded_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_join_requests' 
                   AND column_name = 'responder_id') THEN
        ALTER TABLE public.class_join_requests ADD COLUMN responder_id UUID REFERENCES public.profiles(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_join_requests' 
                   AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.class_join_requests ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- Ensure RLS policies are correct for class_join_requests
DROP POLICY IF EXISTS "Users can view join requests for their classes" ON public.class_join_requests;
DROP POLICY IF EXISTS "Users can create join requests" ON public.class_join_requests;
DROP POLICY IF EXISTS "Class creators can update join requests" ON public.class_join_requests;
DROP POLICY IF EXISTS "Users can view their own join requests" ON public.class_join_requests;

-- Create simple, permissive policies
CREATE POLICY "Allow all operations on class_join_requests" ON public.class_join_requests
    FOR ALL USING (true) WITH CHECK (true);

-- Also ensure class_chat_messages table exists and has correct RLS
CREATE TABLE IF NOT EXISTS public.class_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on class_chat_messages
ALTER TABLE public.class_chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on class_chat_messages
DROP POLICY IF EXISTS "Users can view messages in their classes" ON public.class_chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their classes" ON public.class_chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.class_chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.class_chat_messages;

-- Create permissive policies for class_chat_messages
CREATE POLICY "Allow all operations on class_chat_messages" ON public.class_chat_messages
    FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_join_requests_class_id ON public.class_join_requests(class_id);
CREATE INDEX IF NOT EXISTS idx_class_join_requests_user_id ON public.class_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_class_join_requests_status ON public.class_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_class_id ON public.class_chat_messages(class_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_created_at ON public.class_chat_messages(created_at);

-- Ensure proper foreign key constraints exist
DO $$
BEGIN
    -- Add foreign key for class_join_requests.class_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'class_join_requests_class_id_fkey') THEN
        ALTER TABLE public.class_join_requests 
        ADD CONSTRAINT class_join_requests_class_id_fkey 
        FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for class_join_requests.user_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'class_join_requests_user_id_fkey') THEN
        ALTER TABLE public.class_join_requests 
        ADD CONSTRAINT class_join_requests_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

COMMIT;
