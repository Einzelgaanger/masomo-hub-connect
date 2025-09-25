-- Create direct messages table for inbox functionality
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for direct messages
CREATE POLICY "Users can view their own messages" ON public.direct_messages 
FOR SELECT TO authenticated 
USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);

CREATE POLICY "Users can send messages to university members" ON public.direct_messages 
FOR INSERT TO authenticated 
WITH CHECK (
  sender_id = auth.uid() AND
  receiver_id IN (
    SELECT p.user_id 
    FROM public.profiles p 
    JOIN public.classes c ON p.class_id = c.id 
    WHERE c.university_id IN (
      SELECT c2.university_id 
      FROM public.profiles p2 
      JOIN public.classes c2 ON p2.class_id = c2.id 
      WHERE p2.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update read status of their received messages" ON public.direct_messages 
FOR UPDATE TO authenticated 
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(sender_id, receiver_id, created_at);

-- Create a function to get conversation participants
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
    SELECT DISTINCT
      CASE 
        WHEN sender_id = user_id_param THEN receiver_id
        ELSE sender_id
      END as partner_id
    FROM public.direct_messages
    WHERE sender_id = user_id_param OR receiver_id = user_id_param
  ),
  last_messages AS (
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_conversation_participants(UUID) TO authenticated;
