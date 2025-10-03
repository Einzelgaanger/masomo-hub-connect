-- Test chat messages table and functionality
-- This script checks if the class_chat_messages table exists and works properly

-- 1. Check if table exists
SELECT 
    'Table Existence Check' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_chat_messages' AND table_schema = 'public') 
        THEN 'class_chat_messages table: EXISTS'
        ELSE 'class_chat_messages table: MISSING'
    END as table_status;

-- 2. Check table structure
SELECT 
    'Table Structure Check' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'class_chat_messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
    'RLS Status Check' as test_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'class_chat_messages';

-- 4. Check RLS policies
SELECT 
    'RLS Policies Check' as test_name,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'class_chat_messages' 
AND schemaname = 'public'
ORDER BY policyname;

-- 5. Test basic insert (if table exists)
DO $$
DECLARE
    test_class_id UUID;
    test_user_id UUID;
    insert_result RECORD;
BEGIN
    -- Get a test class ID
    SELECT id INTO test_class_id FROM public.classes LIMIT 1;
    
    -- Get a test user ID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_class_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        -- Try to insert a test message
        INSERT INTO public.class_chat_messages (
            class_id,
            sender_id,
            message,
            message_type
        ) VALUES (
            test_class_id,
            test_user_id,
            'Test message from SQL script',
            'text'
        ) RETURNING id INTO insert_result;
        
        RAISE NOTICE 'Test message inserted successfully with ID: %', insert_result.id;
        
        -- Clean up test message
        DELETE FROM public.class_chat_messages WHERE id = insert_result.id;
        RAISE NOTICE 'Test message cleaned up';
    ELSE
        RAISE NOTICE 'No test data available for insert test';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Insert test failed: %', SQLERRM;
END
$$;

-- 6. Check recent messages
SELECT 
    'Recent Messages Check' as test_name,
    COUNT(*) as total_messages,
    MAX(created_at) as latest_message_time
FROM public.class_chat_messages;

-- 7. Check for any error logs
SELECT 
    'Error Check' as test_name,
    'No specific error logs available' as status;
