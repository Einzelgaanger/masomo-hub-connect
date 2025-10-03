-- Create Class Members Table
-- This table tracks which users are members of which classes

-- ==============================================
-- 1. CREATE CLASS_MEMBERS TABLE
-- ==============================================

-- Create the class_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, user_id)
);

-- ==============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user_id ON public.class_members(user_id);
CREATE INDEX IF NOT EXISTS idx_class_members_role ON public.class_members(role);

-- ==============================================
-- 3. DISABLE RLS FOR SIMPLICITY
-- ==============================================

ALTER TABLE public.class_members DISABLE ROW LEVEL SECURITY;

-- ==============================================
-- 4. CREATE HELPER FUNCTIONS
-- ==============================================

-- Function to add a member to a class
CREATE OR REPLACE FUNCTION public.add_class_member(
    p_class_id UUID,
    p_user_id UUID,
    p_role TEXT DEFAULT 'member'
)
RETURNS UUID AS $$
DECLARE
    member_id UUID;
BEGIN
    INSERT INTO public.class_members (class_id, user_id, role)
    VALUES (p_class_id, p_user_id, p_role)
    ON CONFLICT (class_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        joined_at = NOW()
    RETURNING id INTO member_id;
    
    RETURN member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get class members
CREATE OR REPLACE FUNCTION public.get_class_members(p_class_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    role TEXT,
    joined_at TIMESTAMP WITH TIME ZONE,
    full_name TEXT,
    email TEXT,
    profile_picture_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.user_id,
        cm.role,
        cm.joined_at,
        p.full_name,
        p.email,
        p.profile_picture_url
    FROM public.class_members cm
    JOIN public.profiles p ON cm.user_id = p.user_id
    WHERE cm.class_id = p_class_id
    ORDER BY cm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is member of class
CREATE OR REPLACE FUNCTION public.is_class_member(p_class_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.class_members 
        WHERE class_id = p_class_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 5. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== CLASS MEMBERS TABLE CREATED ===';
    RAISE NOTICE 'Table: class_members created successfully';
    RAISE NOTICE 'Indexes created for performance';
    RAISE NOTICE 'Helper functions created';
    RAISE NOTICE 'Join requests can now add members to classes';
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;
