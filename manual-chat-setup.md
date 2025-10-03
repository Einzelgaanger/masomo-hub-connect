# Manual Chat Setup Guide

If SQL scripts are giving snippet errors, follow these manual steps:

## Step 1: Create Table Manually

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor**
3. Click **"Create a new table"**
4. Set table name: `class_chat_messages`
5. Add these columns:

| Column Name | Type | Default Value | Nullable |
|-------------|------|---------------|----------|
| id | uuid | gen_random_uuid() | No (Primary Key) |
| class_id | uuid | - | No |
| sender_id | uuid | - | No |
| message | text | - | No |
| message_type | text | 'text' | Yes |
| file_url | text | - | Yes |
| file_name | text | - | Yes |
| created_at | timestamptz | now() | Yes |

## Step 2: Enable RLS

1. Go to **Authentication** > **Policies**
2. Find `class_chat_messages` table
3. Click **"Enable RLS"**

## Step 3: Create Policy

1. Click **"New Policy"** for `class_chat_messages`
2. Policy name: `Allow all operations`
3. Policy type: `For all operations`
4. Target roles: `authenticated`
5. Policy definition: `true`

## Step 4: Test

Go to your chat page and try sending a message. It should work now!

## Alternative: Use Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db reset
supabase db push
```

This will apply all migrations and should fix the snippet issues.
