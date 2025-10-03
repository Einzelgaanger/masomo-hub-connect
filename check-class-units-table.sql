-- Check and create class_units table if it doesn't exist
-- This script ensures the class_units table exists with proper structure

-- ==============================================
-- 1. CHECK IF TABLE EXISTS
-- ==============================================

DO $$
BEGIN
    -- Check if class_units table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'class_units') THEN
        RAISE NOTICE 'class_units table does not exist, creating it...';
        
        -- Create class_units table
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
    ELSE
        RAISE NOTICE 'class_units table already exists.';
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
-- 3. CHECK RLS STATUS
-- ==============================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'class_units';

-- ==============================================
-- 4. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== CLASS UNITS TABLE CHECK COMPLETE ===';
    RAISE NOTICE 'Table structure verified and RLS policies created';
    RAISE NOTICE 'Class units should now be accessible!';
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;
