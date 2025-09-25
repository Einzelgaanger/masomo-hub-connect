-- Create messages table for Ukumbi chat
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video')),
  media_url TEXT,
  media_filename TEXT,
  media_size INTEGER,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message likes table
CREATE TABLE IF NOT EXISTS public.message_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on tables
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their university" ON public.messages 
FOR SELECT TO authenticated 
USING (
  university_id IN (
    SELECT c.university_id 
    FROM public.profiles p 
    JOIN public.classes c ON p.class_id = c.id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their university" ON public.messages 
FOR INSERT TO authenticated 
WITH CHECK (
  user_id = auth.uid() AND
  university_id IN (
    SELECT c.university_id 
    FROM public.profiles p 
    JOIN public.classes c ON p.class_id = c.id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages" ON public.messages 
FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.messages 
FOR DELETE TO authenticated 
USING (user_id = auth.uid());

-- RLS Policies for message likes
CREATE POLICY "Users can view likes on messages from their university" ON public.message_likes 
FOR SELECT TO authenticated 
USING (
  message_id IN (
    SELECT m.id 
    FROM public.messages m
    WHERE m.university_id IN (
      SELECT c.university_id 
      FROM public.profiles p 
      JOIN public.classes c ON p.class_id = c.id 
      WHERE p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can like messages from their university" ON public.message_likes 
FOR INSERT TO authenticated 
WITH CHECK (
  user_id = auth.uid() AND
  message_id IN (
    SELECT m.id 
    FROM public.messages m
    WHERE m.university_id IN (
      SELECT c.university_id 
      FROM public.profiles p 
      JOIN public.classes c ON p.class_id = c.id 
      WHERE p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can unlike their own likes" ON public.message_likes 
FOR DELETE TO authenticated 
USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_university_created ON public.messages(university_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_message_likes_message_id ON public.message_likes(message_id);
CREATE INDEX IF NOT EXISTS idx_message_likes_user_id ON public.message_likes(user_id);

-- Function to update message likes count
CREATE OR REPLACE FUNCTION public.update_message_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.messages 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.message_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.messages 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.message_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating likes count
CREATE TRIGGER update_message_likes_count_trigger
  AFTER INSERT OR DELETE ON public.message_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_message_likes_count();

-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ukumbi-media', 'ukumbi-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat media
CREATE POLICY "Authenticated users can upload chat media" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'ukumbi-media');

CREATE POLICY "Users can view chat media from their university" ON storage.objects 
FOR SELECT TO authenticated 
USING (bucket_id = 'ukumbi-media');

CREATE POLICY "Users can delete their own chat media" ON storage.objects 
FOR DELETE TO authenticated 
USING (
  bucket_id = 'ukumbi-media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
