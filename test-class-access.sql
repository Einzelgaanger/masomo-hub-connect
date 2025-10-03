-- Test class access and permissions
-- This script helps debug class access issues

-- ==============================================
-- 1. CHECK IF CLASS EXISTS
-- ==============================================

SELECT 
    id,
    name,
    description,
    class_code,
    created_at
FROM public.classes 
WHERE id = 'a6297b1a-db66-4cd2-a868-f96072c4b593';

-- ==============================================
-- 2. CHECK USER MEMBERSHIP
-- ==============================================

SELECT 
    cm.class_id,
    cm.user_id,
    cm.role,
    cm.joined_at,
    c.name as class_name
FROM public.class_members cm
JOIN public.classes c ON cm.class_id = c.id
WHERE cm.class_id = 'a6297b1a-db66-4cd2-a868-f96072c4b593'
AND cm.user_id = auth.uid();

-- ==============================================
-- 3. CHECK CLASS UNITS
-- ==============================================

SELECT 
    id,
    class_id,
    name,
    description,
    order_index,
    created_at
FROM public.class_units 
WHERE class_id = 'a6297b1a-db66-4cd2-a868-f96072c4b593'
ORDER BY order_index;

-- ==============================================
-- 4. CHECK RLS POLICIES
-- ==============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('classes', 'class_members', 'class_units')
ORDER BY tablename, policyname;

-- ==============================================
-- 5. TEST SIMPLE QUERY
-- ==============================================

-- Test if we can access the class at all
SELECT COUNT(*) as class_count
FROM public.classes 
WHERE id = 'a6297b1a-db66-4cd2-a868-f96072c4b593';

-- Test if we can access class members
SELECT COUNT(*) as member_count
FROM public.class_members 
WHERE class_id = 'a6297b1a-db66-4cd2-a868-f96072c4b593';

-- Test if we can access class units
SELECT COUNT(*) as units_count
FROM public.class_units 
WHERE class_id = 'a6297b1a-db66-4cd2-a868-f96072c4b593';
