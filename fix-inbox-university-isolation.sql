-- Fix the get_conversation_participants function to include university isolation
-- This ensures users can only see conversations with people from their university

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
  WITH user_university AS (
    -- Get the current user's university ID
    SELECT c.university_id
    FROM public.profiles p
    JOIN public.classes c ON p.class_id = c.id
    WHERE p.user_id = user_id_param
  ),
  conversation_partners AS (
    SELECT DISTINCT
      CASE 
        WHEN dm.sender_id = user_id_param THEN dm.receiver_id
        ELSE dm.sender_id
      END as partner_id
    FROM public.direct_messages dm
    JOIN public.profiles sender_p ON sender_p.user_id = dm.sender_id
    JOIN public.profiles receiver_p ON receiver_p.user_id = dm.receiver_id
    JOIN public.classes sender_c ON sender_p.class_id = sender_c.id
    JOIN public.classes receiver_c ON receiver_p.class_id = receiver_c.id
    WHERE (dm.sender_id = user_id_param OR dm.receiver_id = user_id_param)
      AND sender_c.university_id = (SELECT university_id FROM user_university)
      AND receiver_c.university_id = (SELECT university_id FROM user_university)
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

-- Also update the RLS policies for direct_messages to ensure university isolation
DROP POLICY IF EXISTS "Users can send direct messages to users in their university" ON public.direct_messages;

CREATE POLICY "Users can send direct messages to users in their university" ON public.direct_messages 
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

-- Update the view policy as well
DROP POLICY IF EXISTS "Users can view their own direct messages" ON public.direct_messages;

CREATE POLICY "Users can view their own direct messages" ON public.direct_messages 
FOR SELECT TO authenticated 
USING (
  (sender_id = auth.uid() OR receiver_id = auth.uid()) AND
  (
    -- Either sender or receiver must be in the same university
    EXISTS (
      SELECT 1 FROM public.profiles p_sender
      JOIN public.classes c_sender ON p_sender.class_id = c_sender.id
      WHERE p_sender.user_id = sender_id AND c_sender.university_id IN (
        SELECT c.university_id FROM public.profiles p
        JOIN public.classes c ON p.class_id = c.id
        WHERE p.user_id = auth.uid()
      )
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles p_receiver
      JOIN public.classes c_receiver ON p_receiver.class_id = c_receiver.id
      WHERE p_receiver.user_id = receiver_id AND c_receiver.university_id IN (
        SELECT c.university_id FROM public.profiles p
        JOIN public.classes c ON p.class_id = c.id
        WHERE p.user_id = auth.uid()
      )
    )
  )
);
