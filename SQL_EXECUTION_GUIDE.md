# 🗄️ SQL Execution Guide - New Class System

## 📋 **Execution Order**

### **Step 1: Run the Main Schema Creation**
```sql
-- File: create-new-class-system.sql
-- This creates all new tables, indexes, RLS policies, and helper functions
```

**Run this file in your Supabase SQL Editor:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire contents of `create-new-class-system.sql`
4. Click "Run"
5. Wait for success message: "✅ New Class System database schema created successfully!"

**What this creates:**
- ✅ Countries, Universities, Courses tables
- ✅ Classes, Class Units, Class Members tables
- ✅ Join Requests, Chatrooms, Messages tables
- ✅ Updated Profiles table with new fields
- ✅ All RLS policies
- ✅ Helper functions and triggers

---

### **Step 2: Run the Migration Script (Optional)**
```sql
-- File: migrate-existing-users-to-new-class-system.sql
-- This migrates existing data from old system to new system
```

**Only run this if you have existing users/classes to migrate!**

1. Open Supabase SQL Editor
2. Copy entire contents of `migrate-existing-users-to-new-class-system.sql`
3. Click "Run"
4. Review migration summary in output

**What this does:**
- ✅ Migrates existing classes to new system
- ✅ Migrates all members with proper roles
- ✅ Migrates units and uploads
- ✅ Creates sample countries and universities
- ✅ Shows migration summary

---

## 🐛 **Troubleshooting**

### **Error: "column creator_id does not exist"**
**Solution:** ✅ Fixed! The trigger now checks if `creator_id` is not null before adding member.

### **Error: "column c.name does not exist"**
**Solution:** ✅ Fixed! Migration now uses `profiles` table as the source of truth, with LEFT JOIN to old classes table.

### **Error: "syntax error at or near RAISE"**
**Solution:** ✅ Fixed! All `RAISE NOTICE` statements are wrapped in `DO $$ ... END $$` blocks.

### **Error: "relation classes already exists"**
**Solution:** The scripts use `CREATE TABLE IF NOT EXISTS`. The migration intelligently detects if you have old data to migrate or if this is a fresh install.

### **Migration Script Shows: "No old class system found"**
**This is normal!** It means you don't have existing data to migrate. The script will skip migration and just create sample data.

---

## ✅ **Verification Queries**

After running both scripts, verify everything worked:

```sql
-- Check countries
SELECT COUNT(*) as country_count FROM public.countries;

-- Check classes created
SELECT COUNT(*) as class_count FROM public.classes;

-- Check class members
SELECT COUNT(*) as member_count FROM public.class_members;

-- Check class units
SELECT COUNT(*) as unit_count FROM public.class_units;

-- View sample class with share code
SELECT id, name, share_code, creator_id, created_at 
FROM public.classes 
LIMIT 5;
```

---

## 🎯 **Expected Results**

After successful execution:

### **From Schema Creation:**
```
✅ New Class System database schema created successfully!
📋 Created tables: countries, universities, courses, classes, class_units, class_members, class_join_requests, class_chatrooms, class_messages, user_hidden_units
🔒 RLS policies enabled on all tables
⚡ Helper functions created for automation
🚀 Ready for Phase 2: Migration of existing data
```

### **From Migration:**
```
==========================================
MIGRATION SUMMARY:
==========================================
Total Classes Created: X
Total Members Enrolled: Y
Total Units Created: Z
==========================================
✅ Migration completed successfully!
⚠️  Users need to update their profiles with country, university, and course information
⚠️  Admins need to add universities and courses via admin panel
==========================================
```

---

## 🚀 **Next Steps**

After successful SQL execution:

1. **✅ Database is ready!**
2. **🔧 Start building admin panel** (Phase 2)
3. **👥 Build user profile editing** (Phase 3)
4. **🎓 Build class creation/joining UI** (Phase 4-5)
5. **💬 Build class chatroom** (Phase 8)

---

## 📞 **Need Help?**

If you encounter any errors:
1. Copy the full error message
2. Note which file you were running
3. Check the troubleshooting section above
4. Share the error for further assistance

---

## 🔄 **Rollback (If Needed)**

If something goes wrong and you need to start over:

```sql
-- WARNING: This will delete ALL new class system data!
-- Only run if you need to completely reset

DROP TABLE IF EXISTS public.user_hidden_units CASCADE;
DROP TABLE IF EXISTS public.class_messages CASCADE;
DROP TABLE IF EXISTS public.class_chatrooms CASCADE;
DROP TABLE IF EXISTS public.class_join_requests CASCADE;
DROP TABLE IF EXISTS public.class_members CASCADE;
DROP TABLE IF EXISTS public.class_units CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.universities CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_class_share_code() CASCADE;
DROP FUNCTION IF EXISTS set_class_share_code() CASCADE;
DROP FUNCTION IF EXISTS create_class_chatroom() CASCADE;
DROP FUNCTION IF EXISTS add_creator_as_member() CASCADE;
DROP FUNCTION IF EXISTS handle_class_creator_leave() CASCADE;
DROP FUNCTION IF EXISTS approve_join_request(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS reject_join_request(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS transfer_class_creator(UUID, UUID, TEXT) CASCADE;

-- Then re-run the schema creation script
```

---

**Good luck! 🎉**

