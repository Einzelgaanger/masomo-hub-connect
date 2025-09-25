-- Fix database relationships and RLS policies for messages, alumni tables
-- This script addresses the 400/500 errors in Ukumbi and Alumni pages

-- 1. Fix messages table relationships
-- Ensure proper foreign key relationships exist
DO $$ BEGIN
  -- Check if foreign key exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_user_id_fkey' 
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE public.messages 
    ADD CONSTRAINT messages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure message_likes table has proper relationships
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'message_likes_message_id_fkey' 
    AND table_name = 'message_likes'
  ) THEN
    ALTER TABLE public.message_likes 
    ADD CONSTRAINT message_likes_message_id_fkey 
    FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'message_likes_user_id_fkey' 
    AND table_name = 'message_likes'
  ) THEN
    ALTER TABLE public.message_likes 
    ADD CONSTRAINT message_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Fix alumni_success_stories table structure
-- The table should reference alumni_profiles, not have university_id directly
DO $$ BEGIN
  -- Drop existing problematic policies
  DROP POLICY IF EXISTS "Users can view success stories in their university" ON public.alumni_success_stories;
  
  -- Create proper RLS policy using alumni_profiles relationship
  CREATE POLICY "Users can view success stories in their university" ON public.alumni_success_stories
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.alumni_profiles ap
      JOIN public.classes c ON ap.graduation_class = c.id
      JOIN public.profiles p ON p.user_id = auth.uid()
      JOIN public.classes user_class ON p.class_id = user_class.id
      WHERE ap.user_id = alumni_success_stories.alumni_id
      AND c.university_id = user_class.university_id
    )
  );
END $$;

-- 3. Fix alumni_events table RLS policies
DO $$ BEGIN
  -- Drop existing problematic policies
  DROP POLICY IF EXISTS "Users can view alumni events in their university" ON public.alumni_events;
  
  -- Create proper RLS policy
  CREATE POLICY "Users can view alumni events in their university" ON public.alumni_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles p
      JOIN public.classes c ON p.class_id = c.id
      WHERE p.user_id = auth.uid()
      AND c.university_id = alumni_events.university_id
    )
  );
END $$;

-- 4. Fix messages table RLS policies
DO $$ BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view messages in their university" ON public.messages;
  DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
  
  -- Create proper SELECT policy
  CREATE POLICY "Users can view messages in their university" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles p
      JOIN public.classes c ON p.class_id = c.id
      WHERE p.user_id = auth.uid()
      AND c.university_id = messages.university_id
    )
  );
  
  -- Create proper INSERT policy
  CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 
      FROM public.profiles p
      JOIN public.classes c ON p.class_id = c.id
      WHERE p.user_id = auth.uid()
      AND c.university_id = messages.university_id
    )
  );
  
  -- Create UPDATE policy for likes
  CREATE POLICY "Users can update message likes" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles p
      JOIN public.classes c ON p.class_id = c.id
      WHERE p.user_id = auth.uid()
      AND c.university_id = messages.university_id
    )
  );
END $$;

-- 5. Fix message_likes table RLS policies
DO $$ BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can like messages" ON public.message_likes;
  DROP POLICY IF EXISTS "Users can view message likes" ON public.message_likes;
  
  -- Create proper policies
  CREATE POLICY "Users can view message likes" ON public.message_likes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.messages m
      JOIN public.profiles p ON p.user_id = auth.uid()
      JOIN public.classes c ON p.class_id = c.id
      WHERE m.id = message_likes.message_id
      AND c.university_id = m.university_id
    )
  );
  
  CREATE POLICY "Users can like messages" ON public.message_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 
      FROM public.messages m
      JOIN public.profiles p ON p.user_id = auth.uid()
      JOIN public.classes c ON p.class_id = c.id
      WHERE m.id = message_likes.message_id
      AND c.university_id = m.university_id
    )
  );
  
  CREATE POLICY "Users can unlike messages" ON public.message_likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
END $$;

-- 6. Ensure all tables have RLS enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_events ENABLE ROW LEVEL SECURITY;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_university_id ON public.messages(university_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_likes_message_id ON public.message_likes(message_id);
CREATE INDEX IF NOT EXISTS idx_alumni_success_stories_alumni_id ON public.alumni_success_stories(alumni_id);
CREATE INDEX IF NOT EXISTS idx_alumni_events_university_id ON public.alumni_events(university_id);

-- 8. Refresh schema cache (this helps PostgREST recognize new relationships)
NOTIFY pgrst, 'reload schema';

-- Comments for documentation
COMMENT ON POLICY "Users can view messages in their university" ON public.messages IS 'Users can only see messages from their university';
COMMENT ON POLICY "Users can send messages" ON public.messages IS 'Users can only send messages to their university chat';
COMMENT ON POLICY "Users can view success stories in their university" ON public.alumni_success_stories IS 'Users can only see success stories from alumni in their university';
COMMENT ON POLICY "Users can view alumni events in their university" ON public.alumni_events IS 'Users can only see alumni events from their university';
