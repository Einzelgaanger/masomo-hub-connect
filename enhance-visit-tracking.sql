-- Enhance visit tracking for better analytics
-- This script adds better visit tracking capabilities

-- Add columns to daily_visits for more detailed tracking
ALTER TABLE public.daily_visits 
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS page_path TEXT DEFAULT '/',
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS visit_duration INTEGER DEFAULT 0; -- in seconds

-- Create index for better performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_daily_visits_visit_date_user_id ON public.daily_visits(visit_date, user_id);
CREATE INDEX IF NOT EXISTS idx_daily_visits_created_at ON public.daily_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_visits_session_id ON public.daily_visits(session_id);

-- Create a function to track page visits with more details
CREATE OR REPLACE FUNCTION track_page_visit(
  p_user_id UUID,
  p_page_path TEXT DEFAULT '/',
  p_session_id TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.daily_visits (
    user_id,
    visit_date,
    page_path,
    session_id,
    user_agent,
    referrer,
    created_at
  ) VALUES (
    p_user_id,
    CURRENT_DATE,
    p_page_path,
    p_session_id,
    p_user_agent,
    p_referrer,
    NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Silently ignore errors (e.g., if RLS prevents insertion)
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get analytics data for different time periods
CREATE OR REPLACE FUNCTION get_analytics_data(
  p_period TEXT DEFAULT '24h'
) RETURNS TABLE(
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  unique_users BIGINT,
  total_visits BIGINT,
  avg_session_duration NUMERIC
) AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
BEGIN
  end_time := NOW();
  
  CASE p_period
    WHEN '2h' THEN
      start_time := end_time - INTERVAL '2 hours';
    WHEN '24h' THEN
      start_time := end_time - INTERVAL '24 hours';
    WHEN '7d' THEN
      start_time := end_time - INTERVAL '7 days';
    WHEN '30d' THEN
      start_time := end_time - INTERVAL '30 days';
    ELSE
      start_time := end_time - INTERVAL '24 hours';
  END CASE;

  RETURN QUERY
  SELECT 
    start_time as period_start,
    end_time as period_end,
    COUNT(DISTINCT dv.user_id) as unique_users,
    COUNT(*) as total_visits,
    COALESCE(AVG(dv.visit_duration), 0) as avg_session_duration
  FROM public.daily_visits dv
  WHERE dv.created_at >= start_time 
    AND dv.created_at <= end_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get hourly analytics data
CREATE OR REPLACE FUNCTION get_hourly_analytics(
  p_hours INTEGER DEFAULT 24
) RETURNS TABLE(
  hour_start TIMESTAMPTZ,
  visits_count BIGINT,
  unique_users_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', dv.created_at) as hour_start,
    COUNT(*) as visits_count,
    COUNT(DISTINCT dv.user_id) as unique_users_count
  FROM public.daily_visits dv
  WHERE dv.created_at >= NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY date_trunc('hour', dv.created_at)
  ORDER BY hour_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get daily analytics data
CREATE OR REPLACE FUNCTION get_daily_analytics(
  p_days INTEGER DEFAULT 30
) RETURNS TABLE(
  day_date DATE,
  visits_count BIGINT,
  unique_users_count BIGINT,
  avg_session_duration NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dv.visit_date as day_date,
    COUNT(*) as visits_count,
    COUNT(DISTINCT dv.user_id) as unique_users_count,
    COALESCE(AVG(dv.visit_duration), 0) as avg_session_duration
  FROM public.daily_visits dv
  WHERE dv.visit_date >= CURRENT_DATE - p_days
  GROUP BY dv.visit_date
  ORDER BY day_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for the new functions
DROP POLICY IF EXISTS "Admin can access all visits" ON public.daily_visits;
CREATE POLICY "Admin can access all visits" ON public.daily_visits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Grant execute permissions on the new functions to authenticated users
GRANT EXECUTE ON FUNCTION track_page_visit(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_data(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_hourly_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_analytics(INTEGER) TO authenticated;
