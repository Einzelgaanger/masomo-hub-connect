-- Create Achievement Dislikes Table
-- This script creates the table to track achievement dislikes

-- ==============================================
-- 1. CREATE ACHIEVEMENT DISLIKES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS public.achievement_dislikes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(achievement_id, user_id)
);

-- ==============================================
-- 2. CREATE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_achievement_dislikes_achievement_id ON public.achievement_dislikes(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_dislikes_user_id ON public.achievement_dislikes(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_dislikes_created_at ON public.achievement_dislikes(created_at);

-- ==============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE public.achievement_dislikes ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 4. CREATE RLS POLICIES
-- ==============================================

-- Allow users to view all dislikes
CREATE POLICY "achievement_dislikes_select_all" ON public.achievement_dislikes
FOR SELECT TO authenticated
USING (true);

-- Allow users to insert their own dislikes
CREATE POLICY "achievement_dislikes_insert_own" ON public.achievement_dislikes
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own dislikes
CREATE POLICY "achievement_dislikes_delete_own" ON public.achievement_dislikes
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ==============================================
-- 5. CREATE FUNCTION TO GET DISLIKE COUNTS
-- ==============================================

CREATE OR REPLACE FUNCTION public.get_achievement_dislikes_count(achievement_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.achievement_dislikes
        WHERE achievement_id = achievement_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 6. CREATE FUNCTION TO CHECK USER DISLIKED
-- ==============================================

CREATE OR REPLACE FUNCTION public.check_user_disliked_achievement(achievement_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.achievement_dislikes
        WHERE achievement_id = achievement_id_param
        AND user_id = user_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 7. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== ACHIEVEMENT DISLIKES TABLE SETUP ===';
    RAISE NOTICE 'Table: achievement_dislikes created';
    RAISE NOTICE 'Indexes: created for performance';
    RAISE NOTICE 'RLS policies: configured for user access';
    RAISE NOTICE 'Helper functions: created for counts and checks';
    RAISE NOTICE 'Achievement dislikes are ready to use!';
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;
