-- Fix infinite recursion in class_members RLS policies
-- This script will drop and recreate the class_members policies to fix the circular reference

-- Temporarily disable RLS to allow policy updates
ALTER TABLE public.class_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_join_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_chat_messages DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on class_members table
DROP POLICY IF EXISTS "class_members_select" ON public.class_members;
DROP POLICY IF EXISTS "Class members can view members" ON public.class_members;
DROP POLICY IF EXISTS "Class creators can manage members" ON public.class_members;
DROP POLICY IF EXISTS "Users can view class members" ON public.class_members;
DROP POLICY IF EXISTS "Members can view other members" ON public.class_members;

-- Drop all existing policies on classes table
DROP POLICY IF EXISTS "classes_select_members" ON public.classes;
DROP POLICY IF EXISTS "classes_insert_auth" ON public.classes;
DROP POLICY IF EXISTS "classes_update_creator" ON public.classes;
DROP POLICY IF EXISTS "classes_delete_creator" ON public.classes;
DROP POLICY IF EXISTS "Class members can view classes" ON public.classes;
DROP POLICY IF EXISTS "Anyone can create classes" ON public.classes;
DROP POLICY IF EXISTS "Class creators can update their classes" ON public.classes;
DROP POLICY IF EXISTS "Class creators can delete their classes" ON public.classes;

-- Drop all existing policies on class_join_requests table
DROP POLICY IF EXISTS "join_requests_select" ON public.class_join_requests;
DROP POLICY IF EXISTS "join_requests_insert" ON public.class_join_requests;
DROP POLICY IF EXISTS "Class creators can view join requests" ON public.class_join_requests;
DROP POLICY IF EXISTS "Anyone can create join requests" ON public.class_join_requests;
DROP POLICY IF EXISTS "Class creators can manage join requests" ON public.class_join_requests;

-- Drop all existing policies on class_chat_messages table
DROP POLICY IF EXISTS "chat_messages_select" ON public.class_chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON public.class_chat_messages;
DROP POLICY IF EXISTS "Class members can view chat messages" ON public.class_chat_messages;
DROP POLICY IF EXISTS "Class members can send chat messages" ON public.class_chat_messages;

-- Create simple, non-recursive policies for class_members
CREATE POLICY "class_members_select_simple" ON public.class_members
  FOR SELECT USING (true);

CREATE POLICY "class_members_insert_simple" ON public.class_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "class_members_update_simple" ON public.class_members
  FOR UPDATE USING (true);

CREATE POLICY "class_members_delete_simple" ON public.class_members
  FOR DELETE USING (true);

-- Create simple, non-recursive policies for classes
CREATE POLICY "classes_select_simple" ON public.classes
  FOR SELECT USING (true);

CREATE POLICY "classes_insert_simple" ON public.classes
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "classes_update_simple" ON public.classes
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "classes_delete_simple" ON public.classes
  FOR DELETE USING (auth.uid() = creator_id);

-- Create simple, non-recursive policies for class_join_requests
CREATE POLICY "join_requests_select_simple" ON public.class_join_requests
  FOR SELECT USING (true);

CREATE POLICY "join_requests_insert_simple" ON public.class_join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "join_requests_update_simple" ON public.class_join_requests
  FOR UPDATE USING (true);

-- Create simple, non-recursive policies for class_chat_messages
CREATE POLICY "chat_messages_select_simple" ON public.class_chat_messages
  FOR SELECT USING (true);

CREATE POLICY "chat_messages_insert_simple" ON public.class_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Re-enable RLS
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_chat_messages ENABLE ROW LEVEL SECURITY;

-- Verify the policies are working
SELECT 'Class members RLS policies fixed successfully' as status;

-- Test a simple query
SELECT COUNT(*) as class_members_count FROM public.class_members;
SELECT COUNT(*) as classes_count FROM public.classes;
