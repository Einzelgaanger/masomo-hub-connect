-- Direct Table Creation - No Snippets
-- Copy and paste this directly into Supabase SQL Editor

CREATE TABLE IF NOT EXISTS class_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE class_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON class_chat_messages FOR ALL USING (true);

GRANT ALL ON class_chat_messages TO authenticated;
GRANT ALL ON class_chat_messages TO anon;

SELECT 'Chat table created successfully' as result;
