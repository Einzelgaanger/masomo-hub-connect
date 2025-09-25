-- Consolidated fix for university isolation errors
-- Fixes both alumni RLS policies and inbox university isolation

-- ============================================
-- FIX 1: Alumni System RLS Policies
-- ============================================

-- Fix alumni_profiles RLS policy (removes circular reference)
DROP POLICY IF EXISTS "Alumni can view all alumni profiles from their university" ON public.alumni_profiles;

CREATE POLICY "Alumni can view all alumni profiles from their university" ON public.alumni_profiles 
FOR SELECT TO authenticated 
USING (
  university_id IN (
    -- Get the current user's university ID (whether they're alumni or current student)
    SELECT COALESCE(
      (SELECT ap_current.university_id FROM public.alumni_profiles ap_current WHERE ap_current.user_id = auth.uid()),
      (SELECT c.university_id FROM public.profiles p JOIN public.classes c ON p.class_id = c.id WHERE p.user_id = auth.uid())
    )
  )
);

-- Fix alumni_events RLS policy  
DROP POLICY IF EXISTS "Alumni and students can view events from their university" ON public.alumni_events;

CREATE POLICY "Alumni and students can view events from their university" ON public.alumni_events 
FOR SELECT TO authenticated 
USING (
  university_id IN (
    -- Get the current user's university ID (whether they're alumni or current student)
    SELECT COALESCE(
      (SELECT ap_current.university_id FROM public.alumni_profiles ap_current WHERE ap_current.user_id = auth.uid()),
      (SELECT c.university_id FROM public.profiles p JOIN public.classes c ON p.class_id = c.id WHERE p.user_id = auth.uid())
    )
  )
);

-- Fix alumni_event_attendees RLS policy
DROP POLICY IF EXISTS "Users can view attendees for events in their university" ON public.alumni_event_attendees;

CREATE POLICY "Users can view attendees for events in their university" ON public.alumni_event_attendees 
FOR SELECT TO authenticated 
USING (
  event_id IN (
    SELECT ae.id 
    FROM public.alumni_events ae
    WHERE ae.university_id IN (
      -- Get the current user's university ID (whether they're alumni or current student)
      SELECT COALESCE(
        (SELECT ap_current.university_id FROM public.alumni_profiles ap_current WHERE ap_current.user_id = auth.uid()),
        (SELECT c.university_id FROM public.profiles p JOIN public.classes c ON p.class_id = c.id WHERE p.user_id = auth.uid())
      )
    )
  )
);

-- Fix alumni_success_stories RLS policy
DROP POLICY IF EXISTS "Alumni and students can view success stories from their university" ON public.alumni_success_stories;

CREATE POLICY "Alumni and students can view success stories from their university" ON public.alumni_success_stories 
FOR SELECT TO authenticated 
USING (
  alumni_id IN (
    SELECT ap.user_id 
    FROM public.alumni_profiles ap
    WHERE ap.university_id IN (
      -- Get the current user's university ID (whether they're alumni or current student)
      SELECT COALESCE(
        (SELECT ap_current.university_id FROM public.alumni_profiles ap_current WHERE ap_current.user_id = auth.uid()),
        (SELECT c.university_id FROM public.profiles p JOIN public.classes c ON p.class_id = c.id WHERE p.user_id = auth.uid())
      )
    )
  )
);

-- Fix student_alumni_interactions RLS policy
DROP POLICY IF EXISTS "Students can request interactions with alumni from their university" ON public.student_alumni_interactions;

CREATE POLICY "Students can request interactions with alumni from their university" ON public.student_alumni_interactions 
FOR INSERT TO authenticated 
WITH CHECK (
  student_id = auth.uid() AND
  alumni_id IN (
    SELECT ap.user_id 
    FROM public.alumni_profiles ap
    WHERE ap.university_id IN (
      -- Get the current user's university ID (whether they're alumni or current student)
      SELECT COALESCE(
        (SELECT ap_current.university_id FROM public.alumni_profiles ap_current WHERE ap_current.user_id = auth.uid()),
        (SELECT c.university_id FROM public.profiles p JOIN public.classes c ON p.class_id = c.id WHERE p.user_id = auth.uid())
      )
    )
  )
);

-- ============================================
-- FIX 2: Inbox University Isolation
-- ============================================

-- Fix the get_conversation_participants function to include university isolation
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

-- Update direct_messages RLS policies for university isolation
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
