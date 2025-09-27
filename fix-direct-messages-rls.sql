-- Fix RLS policies for direct_messages table
-- This will allow users to send and receive direct messages

-- First, let's check if the table exists and what policies are currently there
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can send direct messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can receive direct messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON direct_messages;

-- Create comprehensive RLS policies for direct_messages
-- Policy 1: Users can insert messages where they are the sender
CREATE POLICY "Users can insert their own messages" ON direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Policy 2: Users can view messages where they are either sender or receiver
CREATE POLICY "Users can view their own messages" ON direct_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy 3: Users can update messages they sent (for read status, etc.)
CREATE POLICY "Users can update their own messages" ON direct_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy 4: Users can delete messages they sent
CREATE POLICY "Users can delete their own messages" ON direct_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- Ensure RLS is enabled on the table
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Add comment to document the policies
COMMENT ON TABLE direct_messages IS 'Direct messages between users with RLS policies for privacy and security';
