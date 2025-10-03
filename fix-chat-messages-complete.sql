-- Complete Chat Messages Fix
-- This script ensures the class_chat_messages table exists and works properly

-- 1. Create class_chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.class_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_class_id ON public.class_chat_messages(class_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_sender_id ON public.class_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_created_at ON public.class_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_class_created ON public.class_chat_messages(class_id, created_at);

-- 3. Enable RLS
ALTER TABLE public.class_chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "class_chat_messages_select_all" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_insert_authenticated" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_update_own" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_delete_own" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_select_class_members" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_insert_class_members" ON public.class_chat_messages;

-- 5. Create comprehensive RLS policies
-- Allow all authenticated users to view messages in classes they're members of
CREATE POLICY "class_chat_messages_select_class_members" ON public.class_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_members cm 
            WHERE cm.class_id = class_chat_messages.class_id 
            AND cm.user_id = auth.uid()
        )
    );

-- Allow authenticated users to insert messages in classes they're members of
CREATE POLICY "class_chat_messages_insert_class_members" ON public.class_chat_messages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.class_members cm 
            WHERE cm.class_id = class_chat_messages.class_id 
            AND cm.user_id = auth.uid()
        )
    );

-- Allow users to update their own messages
CREATE POLICY "class_chat_messages_update_own" ON public.class_chat_messages
    FOR UPDATE USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

-- Allow users to delete their own messages
CREATE POLICY "class_chat_messages_delete_own" ON public.class_chat_messages
    FOR DELETE USING (auth.uid() = sender_id);

-- 6. Create function to get sender profile information
CREATE OR REPLACE FUNCTION get_chat_message_with_profile(message_id UUID)
RETURNS TABLE (
    id UUID,
    class_id UUID,
    sender_id UUID,
    message TEXT,
    message_type TEXT,
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    sender_name TEXT,
    sender_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ccm.id,
        ccm.class_id,
        ccm.sender_id,
        ccm.message,
        ccm.message_type,
        ccm.file_url,
        ccm.file_name,
        ccm.created_at,
        COALESCE(p.full_name, 'Unknown User') as sender_name,
        p.profile_picture_url as sender_avatar
    FROM public.class_chat_messages ccm
    LEFT JOIN public.profiles p ON ccm.sender_id = p.user_id
    WHERE ccm.id = message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to get all messages for a class with profiles
CREATE OR REPLACE FUNCTION get_class_chat_messages(class_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    class_id UUID,
    sender_id UUID,
    message TEXT,
    message_type TEXT,
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    sender_name TEXT,
    sender_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ccm.id,
        ccm.class_id,
        ccm.sender_id,
        ccm.message,
        ccm.message_type,
        ccm.file_url,
        ccm.file_name,
        ccm.created_at,
        COALESCE(p.full_name, 'Unknown User') as sender_name,
        p.profile_picture_url as sender_avatar
    FROM public.class_chat_messages ccm
    LEFT JOIN public.profiles p ON ccm.sender_id = p.user_id
    WHERE ccm.class_id = class_uuid
    ORDER BY ccm.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_chat_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_message_with_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_chat_messages(UUID, INTEGER) TO authenticated;

-- 9. Create trigger to update updated_at timestamp
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

-- 10. Test the setup
DO $$
DECLARE
    test_class_id UUID;
    test_user_id UUID;
    message_count INTEGER;
BEGIN
    -- Get test data
    SELECT id INTO test_class_id FROM public.classes LIMIT 1;
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_class_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        -- Check if user is a member of the class
        IF EXISTS (SELECT 1 FROM public.class_members WHERE class_id = test_class_id AND user_id = test_user_id) THEN
            -- Count existing messages
            SELECT COUNT(*) INTO message_count FROM public.class_chat_messages WHERE class_id = test_class_id;
            RAISE NOTICE 'Found % existing messages for class %', message_count, test_class_id;
        ELSE
            RAISE NOTICE 'User % is not a member of class %', test_user_id, test_class_id;
        END IF;
    ELSE
        RAISE NOTICE 'No test data available';
    END IF;
END
$$;

-- 11. Final status check
SELECT 
    'Chat Messages Setup Complete' as status,
    (SELECT COUNT(*) FROM public.class_chat_messages) as total_messages,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'class_chat_messages') as policy_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'class_chat_messages') as column_count;
