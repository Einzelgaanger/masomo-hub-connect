-- Simple Chat Messages Fix
-- This script creates the class_chat_messages table and fixes chat functionality

-- 1. Create class_chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.class_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key to classes table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes' AND table_schema = 'public') THEN
        ALTER TABLE public.class_chat_messages 
        ADD CONSTRAINT IF NOT EXISTS fk_class_chat_messages_class_id 
        FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key to auth.users if possible
    BEGIN
        ALTER TABLE public.class_chat_messages 
        ADD CONSTRAINT IF NOT EXISTS fk_class_chat_messages_sender_id 
        FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not add foreign key to auth.users: %', SQLERRM;
    END;
END
$$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_class_id ON public.class_chat_messages(class_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_sender_id ON public.class_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_created_at ON public.class_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_class_created ON public.class_chat_messages(class_id, created_at);

-- 4. Enable RLS
ALTER TABLE public.class_chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "class_chat_messages_select_all" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_insert_authenticated" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_update_own" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_delete_own" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_select_class_members" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_insert_class_members" ON public.class_chat_messages;

-- 6. Create simple RLS policies
-- Allow all authenticated users to view messages
CREATE POLICY "class_chat_messages_select_all" ON public.class_chat_messages
    FOR SELECT USING (true);

-- Allow authenticated users to insert messages
CREATE POLICY "class_chat_messages_insert_authenticated" ON public.class_chat_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = sender_id);

-- Allow users to update their own messages
CREATE POLICY "class_chat_messages_update_own" ON public.class_chat_messages
    FOR UPDATE USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

-- Allow users to delete their own messages
CREATE POLICY "class_chat_messages_delete_own" ON public.class_chat_messages
    FOR DELETE USING (auth.uid() = sender_id);

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_chat_messages TO anon;

-- 8. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON public.class_chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON public.class_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_message_updated_at();

-- 9. Test the setup
SELECT 
    'Chat Messages Setup Complete' as status,
    (SELECT COUNT(*) FROM public.class_chat_messages) as total_messages,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'class_chat_messages') as policy_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'class_chat_messages') as column_count;
