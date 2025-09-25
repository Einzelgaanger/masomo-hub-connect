# SQL Execution Order for University Isolation Fix

## ⚠️ IMPORTANT: Run these scripts in the exact order below!

### Step 1: Create Alumni System Tables
**Run this first:** `create-alumni-system-fixed.sql`
- Creates all alumni tables (alumni_profiles, alumni_events, etc.)
- Sets up RLS policies
- Creates indexes
- Creates graduate_class function

### Step 2: Fix University Isolation Issues  
**Run this second:** `fix-university-isolation-errors.sql`
- Fixes any remaining RLS policy issues
- Updates inbox university isolation
- Ensures complete multi-tenant isolation

## 🚨 Why This Order Matters:

1. **Tables Must Exist First**: The fix script references tables that need to be created first
2. **RLS Policies**: Some policies in the creation script might have issues that the fix script resolves
3. **Dependencies**: The inbox fix depends on the alumni system being properly set up

## ✅ Expected Results:

After running both scripts:
- ✅ Alumni system fully functional with university isolation
- ✅ Inbox messaging isolated by university  
- ✅ No SQL errors
- ✅ Complete multi-tenant architecture

## 🔧 If You Get Errors:

1. **"relation does not exist"** → Run Step 1 first
2. **"policy already exists"** → The fix script handles this with DROP POLICY IF EXISTS
3. **"column does not exist"** → Make sure you ran Step 1 completely

## 📝 Notes:

- Both scripts use `IF NOT EXISTS` and `DROP POLICY IF EXISTS` to be safe
- You can run them multiple times without issues
- The scripts are designed to be idempotent
