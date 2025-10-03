-- Simple Chat Test
-- This script tests if the chat messages table works

-- 1. Check if table exists
SELECT 
    'Table Check' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_chat_messages' AND table_schema = 'public') 
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status;

-- 2. Check table structure
SELECT 
    'Column Check' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'class_chat_messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
    'RLS Check' as test_name,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'class_chat_messages' 
AND schemaname = 'public';

-- 4. Check policies
SELECT 
    'Policy Check' as test_name,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'class_chat_messages' 
AND schemaname = 'public'
ORDER BY policyname;

-- 5. Test basic functionality
SELECT 
    'Functionality Test' as test_name,
    'Ready for testing' as status;
