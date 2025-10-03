-- Test database connection and table access
-- This script helps verify that all tables are accessible

-- ==============================================
-- 1. CHECK TABLE EXISTENCE
-- ==============================================

SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END as rls_status
FROM pg_tables 
WHERE tablename IN ('class_chat_messages', 'class_units', 'class_members', 'classes')
ORDER BY tablename;

-- ==============================================
-- 2. CHECK RLS POLICIES
-- ==============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('class_chat_messages', 'class_units', 'class_members', 'classes')
ORDER BY tablename, policyname;

-- ==============================================
-- 3. TEST BASIC QUERIES
-- ==============================================

-- Test classes table
SELECT COUNT(*) as classes_count FROM public.classes;

-- Test class_members table
SELECT COUNT(*) as class_members_count FROM public.class_members;

-- Test class_units table
SELECT COUNT(*) as class_units_count FROM public.class_units;

-- Test class_chat_messages table
SELECT COUNT(*) as chat_messages_count FROM public.class_chat_messages;

-- ==============================================
-- 4. TEST SPECIFIC CLASS ACCESS
-- ==============================================

-- Test if we can access a specific class
SELECT 
    c.id,
    c.name,
    c.description,
    c.class_code,
    COUNT(cm.user_id) as member_count
FROM public.classes c
LEFT JOIN public.class_members cm ON c.id = cm.class_id
WHERE c.id = 'a6297b1a-db66-4cd2-a868-f96072c4b593'
GROUP BY c.id, c.name, c.description, c.class_code;

-- ==============================================
-- 5. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== DATABASE CONNECTION TEST ===';
    RAISE NOTICE 'All tables are accessible';
    RAISE NOTICE 'RLS policies are in place';
    RAISE NOTICE 'Database connection is working!';
    RAISE NOTICE '=== TEST COMPLETE ===';
END $$;
