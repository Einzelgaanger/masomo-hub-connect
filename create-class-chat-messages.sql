-- Create class_chat_messages table if it doesn't exist
-- This script ensures the chat messages table exists with proper structure

-- ==============================================
-- 1. CREATE CLASS CHAT MESSAGES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS public.class_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_class_chat_messages_class_id ON public.class_chat_messages(class_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_sender_id ON public.class_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_created_at ON public.class_chat_messages(created_at);

-- ==============================================
-- 3. ENABLE RLS
-- ==============================================

ALTER TABLE public.class_chat_messages ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 4. CREATE RLS POLICIES
-- ==============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "class_chat_messages_select_all" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_insert_member" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_update_own" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_delete_own" ON public.class_chat_messages;

-- Create new policies
CREATE POLICY "class_chat_messages_select_all" ON public.class_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_members 
            WHERE class_id = class_chat_messages.class_id 
            AND user_id = auth.uid()
        )
    );
    
CREATE POLICY "class_chat_messages_insert_member" ON public.class_chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.class_members 
            WHERE class_id = class_chat_messages.class_id 
            AND user_id = auth.uid()
        )
    );
    
CREATE POLICY "class_chat_messages_update_own" ON public.class_chat_messages
    FOR UPDATE USING (sender_id = auth.uid());
    
CREATE POLICY "class_chat_messages_delete_own" ON public.class_chat_messages
    FOR DELETE USING (sender_id = auth.uid());

-- ==============================================
-- 5. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== CLASS CHAT MESSAGES TABLE SETUP ===';
    RAISE NOTICE 'Table created with proper RLS policies';
    RAISE NOTICE 'Chat functionality should now work!';
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;
