-- Fix class_members table duplicate issues
-- Remove any duplicate entries and ensure proper constraints

-- First, let's remove any duplicate class_members entries
-- Keep only the first occurrence of each class_id + user_id combination
WITH duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY class_id, user_id ORDER BY id) as rn
    FROM public.class_members
)
DELETE FROM public.class_members 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Ensure the unique constraint exists (it should, but let's be sure)
DO $$
BEGIN
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'class_members_class_id_user_id_key'
        AND table_name = 'class_members'
    ) THEN
        ALTER TABLE public.class_members 
        ADD CONSTRAINT class_members_class_id_user_id_key 
        UNIQUE (class_id, user_id);
    END IF;
END $$;

-- Also clean up any class_members entries that reference non-existent classes
DELETE FROM public.class_members 
WHERE class_id NOT IN (SELECT id FROM public.classes);

-- Clean up any class_members entries that reference non-existent users
DELETE FROM public.class_members 
WHERE user_id NOT IN (SELECT user_id FROM public.profiles);

COMMIT;
