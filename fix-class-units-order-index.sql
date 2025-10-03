-- Fix class_units table by adding missing order_index column
-- This script adds the order_index column if it doesn't exist

-- ==============================================
-- 1. CHECK IF COLUMN EXISTS
-- ==============================================

DO $$
BEGIN
    -- Check if order_index column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'class_units' 
        AND column_name = 'order_index'
    ) THEN
        RAISE NOTICE 'order_index column does not exist, adding it...';
        
        -- Add the order_index column
        ALTER TABLE public.class_units 
        ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
        
        -- Update existing records to have sequential order
        UPDATE public.class_units 
        SET order_index = subquery.row_number
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
            FROM public.class_units
        ) subquery
        WHERE public.class_units.id = subquery.id;
        
        RAISE NOTICE 'order_index column added successfully!';
    ELSE
        RAISE NOTICE 'order_index column already exists.';
    END IF;
END $$;

-- ==============================================
-- 2. CHECK TABLE STRUCTURE
-- ==============================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'class_units' 
ORDER BY ordinal_position;

-- ==============================================
-- 3. CREATE INDEX IF NOT EXISTS
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_class_units_order ON public.class_units(class_id, order_index);

-- ==============================================
-- 4. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== CLASS UNITS ORDER INDEX FIX ===';
    RAISE NOTICE 'order_index column added and indexed';
    RAISE NOTICE 'Class units should now work properly!';
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;
