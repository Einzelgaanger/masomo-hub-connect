# 🔧 Ukumbi Database Setup

## 🚨 **Current Status:**
Ukumbi messages are currently stored in localStorage (temporary solution). To make messages truly shared across the university, you need to create the `messages` table in your database.

## 📋 **Quick Setup Instructions:**

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Copy and paste the contents of `create-ukumbi-messages-table.sql`
5. Click **Run** to execute the SQL

### Option 2: Local Development
If you have Supabase CLI installed:
```bash
# Copy the SQL file to your migrations folder
cp create-ukumbi-messages-table.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_create_ukumbi_messages.sql

# Push to database
supabase db push
```

## 🎯 **What This Will Create:**

### 🗄️ **Tables:**
- **`messages`** - Main chat messages table
- **`message_likes`** - Message reactions/likes

### 🔐 **Security:**
- **RLS Policies** - Proper Row Level Security
- **User Permissions** - Users can only modify their own messages
- **Authentication** - Only authenticated users can access

### ⚡ **Features:**
- **University-wide chat** - Messages visible to all authenticated users
- **Media Support** - Images, videos, files with metadata
- **Reply System** - Message threading support
- **Delivery Status** - Track message delivery states
- **Reactions** - Like/unlike messages
- **Real-time updates** - Live chat functionality

## 🚀 **After Setup:**

1. **Messages will be shared** - All users will see the same messages
2. **Real-time updates** - New messages appear instantly for all users
3. **Persistent storage** - Messages survive page refreshes and browser restarts
4. **University-wide** - All students in your university can chat together

## ⚠️ **Important:**
Execute the SQL script **immediately** to enable proper university-wide chat functionality!

## 🔄 **Current Workaround:**
Until the database is set up, messages are stored in localStorage and shared via polling. This is a temporary solution that works but isn't ideal for production.

---

**Next Steps:**
1. Execute the SQL script
2. Test sending messages
3. Verify messages appear for all users
4. Enjoy university-wide chat! 🎉
