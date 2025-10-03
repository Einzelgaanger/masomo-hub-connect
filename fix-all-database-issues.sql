-- Comprehensive fix for all database issues
-- This script addresses chat messages, class units, and RLS policies

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
-- 2. CREATE INDEXES FOR CHAT MESSAGES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_class_chat_messages_class_id ON public.class_chat_messages(class_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_sender_id ON public.class_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_created_at ON public.class_chat_messages(created_at);

-- ==============================================
-- 3. ENABLE RLS FOR CHAT MESSAGES
-- ==============================================

ALTER TABLE public.class_chat_messages ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 4. DROP EXISTING CHAT MESSAGES POLICIES
-- ==============================================

DROP POLICY IF EXISTS "class_chat_messages_select_all" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_insert_member" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_update_own" ON public.class_chat_messages;
DROP POLICY IF EXISTS "class_chat_messages_delete_own" ON public.class_chat_messages;

-- ==============================================
-- 5. CREATE NEW CHAT MESSAGES POLICIES
-- ==============================================

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
-- 6. ENSURE CLASS UNITS TABLE EXISTS
-- ==============================================

CREATE TABLE IF NOT EXISTS public.class_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 7. ADD MISSING COLUMNS TO CLASS UNITS
-- ==============================================

DO $$
BEGIN
    -- Add order_index column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'class_units' AND column_name = 'order_index'
    ) THEN
        ALTER TABLE public.class_units ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'class_units' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.class_units ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ==============================================
-- 8. CREATE INDEXES FOR CLASS UNITS
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_class_units_class_id ON public.class_units(class_id);
CREATE INDEX IF NOT EXISTS idx_class_units_order ON public.class_units(class_id, order_index);

-- ==============================================
-- 9. ENABLE RLS FOR CLASS UNITS
-- ==============================================

ALTER TABLE public.class_units ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 10. DROP EXISTING CLASS UNITS POLICIES
-- ==============================================

DROP POLICY IF EXISTS "class_units_select_all" ON public.class_units;
DROP POLICY IF EXISTS "class_units_insert_creator" ON public.class_units;
DROP POLICY IF EXISTS "class_units_update_creator" ON public.class_units;
DROP POLICY IF EXISTS "class_units_delete_creator" ON public.class_units;

-- ==============================================
-- 11. CREATE NEW CLASS UNITS POLICIES
-- ==============================================

CREATE POLICY "class_units_select_all" ON public.class_units
    FOR SELECT USING (true);
    
CREATE POLICY "class_units_insert_creator" ON public.class_units
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.class_members 
            WHERE class_id = class_units.class_id 
            AND user_id = auth.uid() 
            AND role = 'creator'
        )
    );
    
CREATE POLICY "class_units_update_creator" ON public.class_units
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.class_members 
            WHERE class_id = class_units.class_id 
            AND user_id = auth.uid() 
            AND role = 'creator'
        )
    );
    
CREATE POLICY "class_units_delete_creator" ON public.class_units
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.class_members 
            WHERE class_id = class_units.class_id 
            AND user_id = auth.uid() 
            AND role = 'creator'
        )
    );

-- ==============================================
-- 12. VERIFY TABLES EXIST
-- ==============================================

SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END as rls_status
FROM pg_tables 
WHERE tablename IN ('class_chat_messages', 'class_units', 'class_members', 'classes')
ORDER BY tablename;

-- ==============================================
-- 13. TEST QUERIES
-- ==============================================

-- Test if we can query the tables
SELECT COUNT(*) as chat_messages_count FROM public.class_chat_messages;
SELECT COUNT(*) as class_units_count FROM public.class_units;
SELECT COUNT(*) as class_members_count FROM public.class_members;
SELECT COUNT(*) as classes_count FROM public.classes;

-- ==============================================
-- 14. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== DATABASE ISSUES FIXED ===';
    RAISE NOTICE 'class_chat_messages table created with RLS policies';
    RAISE NOTICE 'class_units table verified and fixed';
    RAISE NOTICE 'All RLS policies created successfully';
    RAISE NOTICE 'Chat and units should now work properly!';
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;
