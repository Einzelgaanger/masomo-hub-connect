-- TEST CONCERNS SETUP
-- Run this after setting up the concerns table to verify it's working

-- 1. Check if concerns table exists
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'concerns' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check RLS policies on concerns table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'concerns';

-- 3. Check if we can insert a test concern (this will only work if you're authenticated)
-- Uncomment the line below to test insertion:
-- INSERT INTO public.concerns (user_id, message) VALUES (auth.uid(), 'Test concern from SQL');

-- 4. Check if we can view concerns (this will only work if you're an admin)
-- Uncomment the line below to test viewing:
-- SELECT * FROM public.concerns ORDER BY created_at DESC LIMIT 5;
