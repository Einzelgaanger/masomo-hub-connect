-- Fix Achievement Counts - Ultra Simple Version
-- This script creates functions to get accurate counts for achievements using only basic columns

-- ==============================================
-- 1. CREATE ULTRA SIMPLE ACHIEVEMENTS WITH COUNTS FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION public.get_all_achievements_with_counts_ultra_simple(user_id_param UUID DEFAULT NULL)
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
        COALESCE(p.full_name, 'Unknown') as author_name,
        COALESCE(p.email, 'unknown@example.com') as author_email,
        COALESCE(p.profile_picture_url, '') as author_picture,
        COALESCE(u.name, 'Unknown University') as university_name,
        COALESCE(c.name, 'Unknown Course') as course_name,
        0 as course_year,
        0 as semester,
        NULL as course_group,
        COALESCE(co.name, 'Unknown Country') as country_name,
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
                FROM public.achievement_likes al
                WHERE al.achievement_id = a.id
                AND al.user_id = user_id_param
            )
        END as user_liked,
        CASE 
            WHEN user_id_param IS NULL THEN FALSE
            ELSE EXISTS(
                SELECT 1
                FROM public.achievement_dislikes ad
                WHERE ad.achievement_id = a.id
                AND ad.user_id = user_id_param
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
-- 2. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== ULTRA SIMPLE ACHIEVEMENT COUNTS FIX ===';
    RAISE NOTICE 'Function created with only basic columns';
    RAISE NOTICE 'get_all_achievements_with_counts_ultra_simple: Get all achievements with counts';
    RAISE NOTICE 'Achievement counts will now be accurate!';
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;
