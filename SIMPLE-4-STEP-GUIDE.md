# 📋 Simple 4-Step Migration Guide

## 🎯 **The Problem**
You have old `classes`, `universities`, and `countries` tables that conflict with the new system.

## ✅ **The Solution**
Run 4 scripts in order:

---

## **Step 1️⃣: Rename Old Tables**
📄 **File:** `rename-old-tables-then-migrate.sql`

```
Old tables → Renamed to *_old
├─ classes → classes_old
├─ universities → universities_old  
└─ countries → countries_old
```

**Action:** Copy entire file → Paste in Supabase SQL Editor → Run

---

## **Step 2️⃣: Create New Structure**
📄 **File:** `create-new-class-system.sql`

```
Creates NEW tables:
├─ countries (new structure)
├─ universities (new structure)
├─ courses (new!)
├─ classes (new community-driven structure)
├─ class_members (new!)
├─ class_join_requests (new!)
├─ class_chatrooms (new!)
└─ class_messages (new!)
```

**Action:** Copy entire file → Paste in Supabase SQL Editor → Run

---

## **Step 3️⃣: Migrate Your Data**
📄 **File:** `migrate-existing-users-SAFE.sql`

```
Migrates:
├─ Existing users → New class_members
├─ Old units → New class_units
├─ Creates sample countries & universities
└─ Generates share codes for all classes
```

**Action:** Copy entire file → Paste in Supabase SQL Editor → Run

---

## **Step 4️⃣: Verify It Worked**
📄 **File:** Just run this query:

```sql
SELECT 
  'countries' as table_name, 
  COUNT(*) as count 
FROM public.countries
UNION ALL
SELECT 'universities', COUNT(*) FROM public.universities
UNION ALL
SELECT 'classes', COUNT(*) FROM public.classes
UNION ALL
SELECT 'class_members', COUNT(*) FROM public.class_members;
```

**Expected Results:**
- countries: 10
- universities: 18+
- classes: (however many you had)
- class_members: (however many users you had in classes)

---

## 🎉 **That's It!**

After these 4 steps:
- ✅ Your old data is preserved in `*_old` tables
- ✅ New class system is ready to use
- ✅ Users are migrated to their classes
- ✅ Sample data is created
- ✅ Ready for Phase 2 (Admin Panel UI)!

---

## 🐛 **If Something Goes Wrong**

You can rollback by running:
```sql
-- Restore old tables
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.universities CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;

ALTER TABLE public.classes_old RENAME TO classes;
ALTER TABLE public.universities_old RENAME TO universities;
ALTER TABLE public.countries_old RENAME TO countries;
```

Then start over from Step 1.

---

**Ready? Start with Step 1!** 🚀

