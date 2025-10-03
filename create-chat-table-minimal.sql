-- Minimal Chat Table Creation
-- This script creates only the essential class_chat_messages table

-- Create the table
CREATE TABLE IF NOT EXISTS public.class_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.class_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Allow all operations" ON public.class_chat_messages
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.class_chat_messages TO authenticated;
GRANT ALL ON public.class_chat_messages TO anon;

-- Test
SELECT 'Chat table created successfully' as result;
