-- Create Class Units Table
-- This table stores the different units/lessons within a class

-- ==============================================
-- 1. CREATE CLASS_UNITS TABLE
-- ==============================================

-- Create the class_units table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.class_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT, -- Rich text content for the unit
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_class_units_class_id ON public.class_units(class_id);
CREATE INDEX IF NOT EXISTS idx_class_units_order ON public.class_units(class_id, order_index);
CREATE INDEX IF NOT EXISTS idx_class_units_published ON public.class_units(is_published);

-- ==============================================
-- 3. DISABLE RLS FOR SIMPLICITY
-- ==============================================

ALTER TABLE public.class_units DISABLE ROW LEVEL SECURITY;

-- ==============================================
-- 4. CREATE HELPER FUNCTIONS
-- ==============================================

-- Function to get units for a class
CREATE OR REPLACE FUNCTION public.get_class_units(p_class_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    content TEXT,
    order_index INTEGER,
    is_published BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cu.id,
        cu.name,
        cu.description,
        cu.content,
        cu.order_index,
        cu.is_published,
        cu.created_at,
        cu.updated_at
    FROM public.class_units cu
    WHERE cu.class_id = p_class_id
    ORDER BY cu.order_index ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new unit
CREATE OR REPLACE FUNCTION public.create_class_unit(
    p_class_id UUID,
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_content TEXT DEFAULT NULL,
    p_order_index INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    unit_id UUID;
BEGIN
    INSERT INTO public.class_units (
        class_id,
        name,
        description,
        content,
        order_index
    ) VALUES (
        p_class_id,
        p_name,
        p_description,
        p_content,
        p_order_index
    ) RETURNING id INTO unit_id;
    
    RETURN unit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update unit order
CREATE OR REPLACE FUNCTION public.update_unit_order(
    p_unit_id UUID,
    p_new_order INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.class_units 
    SET order_index = p_new_order, updated_at = NOW()
    WHERE id = p_unit_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 5. CREATE SAMPLE UNITS FOR EXISTING CLASSES
-- ==============================================

-- Add sample units to existing classes
INSERT INTO public.class_units (class_id, name, description, order_index, is_published)
SELECT 
    c.id,
    'Introduction to ' || c.name,
    'Get started with the basics of ' || c.name,
    1,
    true
FROM public.classes c
WHERE NOT EXISTS (
    SELECT 1 FROM public.class_units cu 
    WHERE cu.class_id = c.id
);

-- Add a second unit to classes that have at least one unit
INSERT INTO public.class_units (class_id, name, description, order_index, is_published)
SELECT 
    c.id,
    'Advanced Concepts',
    'Dive deeper into advanced topics',
    2,
    true
FROM public.classes c
WHERE EXISTS (
    SELECT 1 FROM public.class_units cu 
    WHERE cu.class_id = c.id
)
AND NOT EXISTS (
    SELECT 1 FROM public.class_units cu2 
    WHERE cu2.class_id = c.id AND cu2.order_index = 2
);

-- ==============================================
-- 6. SUCCESS MESSAGE
-- ==============================================

DO $$
DECLARE
    units_created INTEGER;
BEGIN
    SELECT COUNT(*) INTO units_created FROM public.class_units;
    
    RAISE NOTICE '=== CLASS UNITS TABLE CREATED ===';
    RAISE NOTICE 'Table: class_units created successfully';
    RAISE NOTICE 'Indexes created for performance';
    RAISE NOTICE 'Helper functions created';
    RAISE NOTICE 'Sample units created for existing classes';
    RAISE NOTICE 'Total units created: %', units_created;
    RAISE NOTICE 'Enhanced classroom is ready!';
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;
