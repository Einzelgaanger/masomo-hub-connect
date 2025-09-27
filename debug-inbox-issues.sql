-- Debug script to check inbox issues
-- This will help us understand what's happening with direct messages

-- 1. Check if direct_messages table exists and its structure
SELECT 
    'Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'direct_messages' 
ORDER BY ordinal_position;

-- 2. Check current RLS policies
SELECT 
    'RLS Policies' as check_type,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'direct_messages';

-- 3. Check if RLS is enabled
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'direct_messages';

-- 4. Check if the function exists
SELECT 
    'Function Check' as check_type,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'get_conversation_participants';

-- 5. Check recent direct messages (if any exist)
SELECT 
    'Recent Messages' as check_type,
    id,
    sender_id,
    receiver_id,
    LEFT(content, 50) as content_preview,
    created_at,
    is_read
FROM public.direct_messages 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Check if there are any messages for a specific user (replace with actual user ID)
-- SELECT 
--     'User Messages' as check_type,
--     COUNT(*) as total_messages,
--     COUNT(CASE WHEN sender_id = 'YOUR_USER_ID_HERE' THEN 1 END) as sent_messages,
--     COUNT(CASE WHEN receiver_id = 'YOUR_USER_ID_HERE' THEN 1 END) as received_messages
-- FROM public.direct_messages 
-- WHERE sender_id = 'YOUR_USER_ID_HERE' OR receiver_id = 'YOUR_USER_ID_HERE';

-- 7. Test the function with a sample user ID (replace with actual user ID)
-- SELECT * FROM public.get_conversation_participants('YOUR_USER_ID_HERE');
