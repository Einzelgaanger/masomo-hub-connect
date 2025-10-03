CREATE TABLE class_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID,
    sender_id UUID,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
