-- Fix Achievement Counts - Simple Version
-- This script creates functions to get accurate counts for achievements using only existing columns

-- ==============================================
-- 1. CREATE SIMPLE ACHIEVEMENT COUNTS FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION public.get_achievement_counts_simple(achievement_id_param UUID)
RETURNS TABLE(
    likes_count INTEGER,
    dislikes_count INTEGER,
    comments_count INTEGER,
    views_count INTEGER,
    media_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.achievement_likes
            WHERE achievement_id = achievement_id_param
        ), 0) as likes_count,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.achievement_dislikes
            WHERE achievement_id = achievement_id_param
        ), 0) as dislikes_count,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.achievement_comments
            WHERE achievement_id = achievement_id_param
        ), 0) as comments_count,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.achievement_views
            WHERE achievement_id = achievement_id_param
        ), 0) as views_count,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.achievement_media
            WHERE achievement_id = achievement_id_param
        ), 0) as media_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 2. CREATE SIMPLE ACHIEVEMENTS WITH COUNTS FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION public.get_all_achievements_with_counts_simple(user_id_param UUID DEFAULT NULL)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    author_name TEXT,
    author_email TEXT,
    author_picture TEXT,
    university_name TEXT,
    course_name TEXT,
    course_year INTEGER,
    semester INTEGER,
    course_group TEXT,
    country_name TEXT,
    media_count INTEGER,
    likes_count INTEGER,
    dislikes_count INTEGER,
    comments_count INTEGER,
    views_count INTEGER,
    user_liked BOOLEAN,
    user_disliked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        a.title,
        a.description,
        a.created_at,
        a.updated_at,
        p.full_name as author_name,
        p.email as author_email,
        p.profile_picture_url as author_picture,
        u.name as university_name,
        c.name as course_name,
        p.year as course_year,
        p.semester,
        NULL as course_group,
        co.name as country_name,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.achievement_media
            WHERE achievement_id = a.id
        ), 0) as media_count,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.achievement_likes
            WHERE achievement_id = a.id
        ), 0) as likes_count,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.achievement_dislikes
            WHERE achievement_id = a.id
        ), 0) as dislikes_count,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.achievement_comments
            WHERE achievement_id = a.id
        ), 0) as comments_count,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.achievement_views
            WHERE achievement_id = a.id
        ), 0) as views_count,
        CASE 
            WHEN user_id_param IS NULL THEN FALSE
            ELSE EXISTS(
                SELECT 1
                FROM public.achievement_likes
                WHERE achievement_id = a.id
                AND user_id = user_id_param
            )
        END as user_liked,
        CASE 
            WHEN user_id_param IS NULL THEN FALSE
            ELSE EXISTS(
                SELECT 1
                FROM public.achievement_dislikes
                WHERE achievement_id = a.id
                AND user_id = user_id_param
            )
        END as user_disliked
    FROM public.achievements a
    LEFT JOIN public.profiles p ON a.user_id = p.user_id
    LEFT JOIN public.universities u ON p.university_id = u.id
    LEFT JOIN public.courses c ON p.course_id = c.id
    LEFT JOIN public.countries co ON u.country_id = co.id
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 3. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== SIMPLE ACHIEVEMENT COUNTS FIX ===';
    RAISE NOTICE 'Functions created with only existing columns';
    RAISE NOTICE 'get_achievement_counts_simple: Get counts for single achievement';
    RAISE NOTICE 'get_all_achievements_with_counts_simple: Get all achievements with counts';
    RAISE NOTICE 'Achievement counts will now be accurate!';
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;
