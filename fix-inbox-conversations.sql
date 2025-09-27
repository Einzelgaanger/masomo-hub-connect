-- Fix the get_conversation_participants function to work properly
-- This version is simpler and should show all conversations for a user

CREATE OR REPLACE FUNCTION public.get_conversation_participants(user_id_param UUID)
RETURNS TABLE (
  participant_id UUID,
  participant_name TEXT,
  participant_email TEXT,
  participant_avatar TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH conversation_partners AS (
    -- Get all unique conversation partners
    SELECT DISTINCT
      CASE 
        WHEN dm.sender_id = user_id_param THEN dm.receiver_id
        ELSE dm.sender_id
      END as partner_id
    FROM public.direct_messages dm
    WHERE dm.sender_id = user_id_param OR dm.receiver_id = user_id_param
  ),
  last_messages AS (
    -- Get the last message for each conversation
    SELECT 
      cp.partner_id,
      dm.content as last_msg,
      dm.created_at as last_msg_time,
      dm.sender_id as last_sender_id
    FROM conversation_partners cp
    LEFT JOIN LATERAL (
      SELECT content, created_at, sender_id
      FROM public.direct_messages
      WHERE (sender_id = user_id_param AND receiver_id = cp.partner_id)
         OR (receiver_id = user_id_param AND sender_id = cp.partner_id)
      ORDER BY created_at DESC
      LIMIT 1
    ) dm ON true
  ),
  unread_counts AS (
    -- Count unread messages for each conversation
    SELECT 
      cp.partner_id,
      COUNT(*) as unread
    FROM conversation_partners cp
    JOIN public.direct_messages dm ON (
      dm.sender_id = cp.partner_id AND 
      dm.receiver_id = user_id_param AND 
      dm.is_read = false
    )
    GROUP BY cp.partner_id
  )
  SELECT 
    p.user_id,
    p.full_name,
    p.email,
    p.profile_picture_url,
    lm.last_msg,
    lm.last_msg_time,
    COALESCE(uc.unread, 0)::INTEGER
  FROM conversation_partners cp
  JOIN public.profiles p ON p.user_id = cp.partner_id
  LEFT JOIN last_messages lm ON lm.partner_id = cp.partner_id
  LEFT JOIN unread_counts uc ON uc.partner_id = cp.partner_id
  ORDER BY lm.last_msg_time DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_conversation_participants(UUID) TO authenticated;

-- Also simplify the RLS policies for direct_messages
DROP POLICY IF EXISTS "Users can send direct messages to users in their university" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their own direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.direct_messages;

-- Create simple, working RLS policies
CREATE POLICY "Users can insert their own messages" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their own messages" ON public.direct_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can update their own messages" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own messages" ON public.direct_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- Ensure RLS is enabled
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
