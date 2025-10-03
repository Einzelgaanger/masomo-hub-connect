-- Diagnostic script to check messages table and RLS policies

-- Check if messages table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'messages' AND table_schema = 'public';

-- Check current RLS policies on messages table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages';

-- Check if RLS is enabled on messages table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'messages' AND schemaname = 'public';

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'messages' AND table_schema = 'public'
ORDER BY ordinal_position;
