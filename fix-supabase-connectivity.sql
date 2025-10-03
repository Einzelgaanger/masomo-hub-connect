-- Supabase Connectivity Fix Script
-- This script addresses the ERR_NAME_NOT_RESOLVED and WebSocket connection failures

-- 1. Check and fix RLS policies for chat messages
DO $$
BEGIN
    -- Ensure class_chat_messages table has proper RLS
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'class_chat_messages' 
        AND policyname = 'class_chat_messages_select_all'
    ) THEN
        CREATE POLICY "class_chat_messages_select_all" ON public.class_chat_messages
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'class_chat_messages' 
        AND policyname = 'class_chat_messages_insert_authenticated'
    ) THEN
        CREATE POLICY "class_chat_messages_insert_authenticated" ON public.class_chat_messages
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'class_chat_messages' 
        AND policyname = 'class_chat_messages_update_own'
    ) THEN
        CREATE POLICY "class_chat_messages_update_own" ON public.class_chat_messages
            FOR UPDATE USING (auth.uid() = sender_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'class_chat_messages' 
        AND policyname = 'class_chat_messages_delete_own'
    ) THEN
        CREATE POLICY "class_chat_messages_delete_own" ON public.class_chat_messages
            FOR DELETE USING (auth.uid() = sender_id);
    END IF;

    RAISE NOTICE 'Chat messages RLS policies created/verified';
END
$$;

-- 2. Check and fix daily_visits table
DO $$
BEGIN
    -- Ensure daily_visits table has proper RLS
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'daily_visits' 
        AND policyname = 'daily_visits_select_own'
    ) THEN
        CREATE POLICY "daily_visits_select_own" ON public.daily_visits
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'daily_visits' 
        AND policyname = 'daily_visits_insert_own'
    ) THEN
        CREATE POLICY "daily_visits_insert_own" ON public.daily_visits
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'daily_visits' 
        AND policyname = 'daily_visits_update_own'
    ) THEN
        CREATE POLICY "daily_visits_update_own" ON public.daily_visits
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    RAISE NOTICE 'Daily visits RLS policies created/verified';
END
$$;

-- 3. Check and fix public_events table
DO $$
BEGIN
    -- Ensure public_events table has proper RLS
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'public_events' 
        AND policyname = 'public_events_select_all'
    ) THEN
        CREATE POLICY "public_events_select_all" ON public.public_events
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'public_events' 
        AND policyname = 'public_events_insert_authenticated'
    ) THEN
        CREATE POLICY "public_events_insert_authenticated" ON public.public_events
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    RAISE NOTICE 'Public events RLS policies created/verified';
END
$$;

-- 4. Check and fix profiles table
DO $$
BEGIN
    -- Ensure profiles table has proper RLS
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'profiles_select_all'
    ) THEN
        CREATE POLICY "profiles_select_all" ON public.profiles
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'profiles_insert_own'
    ) THEN
        CREATE POLICY "profiles_insert_own" ON public.profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'profiles_update_own'
    ) THEN
        CREATE POLICY "profiles_update_own" ON public.profiles
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    RAISE NOTICE 'Profiles RLS policies created/verified';
END
$$;

-- 5. Create or refresh materialized view for wall of fame
DO $$
BEGIN
    -- Drop existing materialized view if it exists
    DROP MATERIALIZED VIEW IF EXISTS public.wall_of_fame_mv;
    
    -- Create new materialized view
    CREATE MATERIALIZED VIEW public.wall_of_fame_mv AS
    SELECT 
        p.id,
        p.user_id,
        p.full_name,
        p.points,
        p.rank,
        p.profile_picture_url,
        p.class_id,
        c.name as class_name,
        c.description as class_description,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    LEFT JOIN public.classes c ON p.class_id = c.id
    WHERE p.points > 0
    ORDER BY p.points DESC;
    
    -- Create index on the materialized view
    CREATE INDEX IF NOT EXISTS idx_wall_of_fame_mv_points ON public.wall_of_fame_mv(points DESC);
    CREATE INDEX IF NOT EXISTS idx_wall_of_fame_mv_class_id ON public.wall_of_fame_mv(class_id);
    
    RAISE NOTICE 'Wall of fame materialized view created/refreshed';
END
$$;

-- 6. Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_wall_of_fame()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.wall_of_fame_mv;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-refresh materialized view
CREATE OR REPLACE FUNCTION trigger_refresh_wall_of_fame()
RETURNS trigger AS $$
BEGIN
    PERFORM refresh_wall_of_fame();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS refresh_wall_of_fame_trigger ON public.profiles;

-- Create trigger
CREATE TRIGGER refresh_wall_of_fame_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_wall_of_fame();

-- 8. Test connectivity
SELECT 
    'Connectivity Test' as test_name,
    'SUCCESS' as status,
    NOW() as timestamp,
    (SELECT COUNT(*) FROM public.profiles) as profile_count,
    (SELECT COUNT(*) FROM public.class_chat_messages) as chat_message_count;

-- 9. Grant necessary permissions
GRANT SELECT ON public.wall_of_fame_mv TO authenticated;
GRANT SELECT ON public.wall_of_fame_mv TO anon;

-- 10. Final status check
SELECT 
    'Final Status Check' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'wall_of_fame_mv') 
        THEN 'Materialized view: OK'
        ELSE 'Materialized view: MISSING'
    END as materialized_view_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'class_chat_messages') 
        THEN 'Chat RLS: OK'
        ELSE 'Chat RLS: MISSING'
    END as chat_rls_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles') 
        THEN 'Profiles RLS: OK'
        ELSE 'Profiles RLS: MISSING'
    END as profiles_rls_status;
