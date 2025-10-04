# Bypass Database Issues - Alternative Solutions

Since SQL scripts keep giving snippet errors, here are alternative approaches:

## Option 1: Use Supabase CLI (Recommended)

If you have Supabase CLI installed:

```bash
# Initialize Supabase in your project
supabase init

# Start local development
supabase start

# Create migration
supabase migration new create_chat_messages

# Edit the migration file and add:
CREATE TABLE class_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

# Apply migration
supabase db push
```

## Option 2: Use Supabase Dashboard Directly

1. Go to Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a **new query** (not a snippet)
4. Paste this single line:

```sql
CREATE TABLE class_chat_messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), class_id UUID, sender_id UUID, message TEXT, message_type TEXT DEFAULT 'text', file_url TEXT, file_name TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
```

5. Click **Run**

## Option 3: Use Table Editor (Easiest)

1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. Click **"Create a new table"**
4. Name: `class_chat_messages`
5. Add columns manually (no SQL needed)

## Option 4: Use REST API

Create the table via REST API calls from your frontend code.
