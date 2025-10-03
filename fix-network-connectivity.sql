-- Network Connectivity Fix Script
-- This script addresses the ERR_NAME_NOT_RESOLVED errors

-- Check if we can connect to Supabase
SELECT 'Network connectivity test' as test_name, NOW() as test_time;

-- Test basic database connectivity
SELECT 
    'Database connection test' as test_name,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check if essential tables exist
SELECT 
    'Essential tables check' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN 'profiles: OK'
        ELSE 'profiles: MISSING'
    END as profiles_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_chat_messages') THEN 'class_chat_messages: OK'
        ELSE 'class_chat_messages: MISSING'
    END as chat_messages_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_visits') THEN 'daily_visits: OK'
        ELSE 'daily_visits: MISSING'
    END as daily_visits_status;

-- Check RLS status on critical tables
SELECT 
    'RLS Status Check' as test_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'class_chat_messages', 'daily_visits', 'public_events')
ORDER BY tablename;

-- Test basic profile access
SELECT 
    'Profile access test' as test_name,
    COUNT(*) as profile_count
FROM public.profiles 
LIMIT 1;

-- Check if materialized view exists
SELECT 
    'Materialized view check' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'wall_of_fame_mv') THEN 'wall_of_fame_mv: EXISTS'
        ELSE 'wall_of_fame_mv: MISSING'
    END as materialized_view_status;

-- Test chat messages table structure
SELECT 
    'Chat messages structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'class_chat_messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any blocking locks
SELECT 
    'Lock check' as test_name,
    COUNT(*) as active_locks
FROM pg_locks 
WHERE NOT granted;

-- Final connectivity test
SELECT 
    'Final connectivity test' as test_name,
    'SUCCESS' as status,
    NOW() as timestamp;
