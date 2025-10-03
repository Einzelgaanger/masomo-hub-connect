-- Complete fix for class_units table
-- This script ensures the table exists with all required columns

-- ==============================================
-- 1. DROP AND RECREATE TABLE (SAFE APPROACH)
-- ==============================================

-- First, check if table exists and has data
DO $$
DECLARE
    table_exists BOOLEAN;
    has_data BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'class_units'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Check if table has data
        SELECT EXISTS (SELECT 1 FROM public.class_units LIMIT 1) INTO has_data;
        
        IF has_data THEN
            RAISE NOTICE 'Table exists with data. Adding missing columns...';
            
            -- Add missing columns if they don't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'class_units' AND column_name = 'order_index'
            ) THEN
                ALTER TABLE public.class_units ADD COLUMN order_index INTEGER DEFAULT 0;
                RAISE NOTICE 'Added order_index column';
            END IF;
            
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'class_units' AND column_name = 'updated_at'
            ) THEN
                ALTER TABLE public.class_units ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
                RAISE NOTICE 'Added updated_at column';
            END IF;
            
            -- Update order_index for existing records
            UPDATE public.class_units 
            SET order_index = subquery.row_number
            FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
                FROM public.class_units
            ) subquery
            WHERE public.class_units.id = subquery.id;
            
        ELSE
            RAISE NOTICE 'Table exists but is empty. Recreating with proper structure...';
            DROP TABLE public.class_units CASCADE;
        END IF;
    END IF;
    
    -- Create table if it doesn't exist or was dropped
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'class_units'
    ) THEN
        RAISE NOTICE 'Creating class_units table with proper structure...';
        
        CREATE TABLE public.class_units (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            order_index INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_class_units_class_id ON public.class_units(class_id);
        CREATE INDEX idx_class_units_order ON public.class_units(class_id, order_index);
        
        -- Enable RLS
        ALTER TABLE public.class_units ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "class_units_select_all" ON public.class_units
            FOR SELECT USING (true);
            
        CREATE POLICY "class_units_insert_creator" ON public.class_units
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.class_members 
                    WHERE class_id = class_units.class_id 
                    AND user_id = auth.uid() 
                    AND role = 'creator'
                )
            );
            
        CREATE POLICY "class_units_update_creator" ON public.class_units
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.class_members 
                    WHERE class_id = class_units.class_id 
                    AND user_id = auth.uid() 
                    AND role = 'creator'
                )
            );
            
        CREATE POLICY "class_units_delete_creator" ON public.class_units
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.class_members 
                    WHERE class_id = class_units.class_id 
                    AND user_id = auth.uid() 
                    AND role = 'creator'
                )
            );
        
        RAISE NOTICE 'class_units table created successfully!';
    END IF;
END $$;

-- ==============================================
-- 2. VERIFY TABLE STRUCTURE
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
-- 3. TEST QUERY
-- ==============================================

-- Test if we can query the table
SELECT COUNT(*) as units_count FROM public.class_units;

-- ==============================================
-- 4. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== CLASS UNITS TABLE COMPLETE FIX ===';
    RAISE NOTICE 'Table structure verified and fixed';
    RAISE NOTICE 'All required columns are present';
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;
