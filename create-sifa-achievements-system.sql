-- Create Sifa Achievements System
-- This creates tables for students to share achievements with photos/videos

-- Create achievements table for Sifa posts
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievement_media table for photos and videos
CREATE TABLE IF NOT EXISTS achievement_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT, -- For videos
  file_name TEXT,
  file_size INTEGER, -- in bytes
  duration INTEGER, -- for videos, in seconds
  order_index INTEGER NOT NULL DEFAULT 0, -- for ordering multiple media
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievement_likes table
CREATE TABLE IF NOT EXISTS achievement_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(achievement_id, user_id)
);

-- Create achievement_comments table
CREATE TABLE IF NOT EXISTS achievement_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievement_views table for analytics
CREATE TABLE IF NOT EXISTS achievement_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous views
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_created_at ON achievements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievement_media_achievement_id ON achievement_media(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_media_order ON achievement_media(achievement_id, order_index);
CREATE INDEX IF NOT EXISTS idx_achievement_likes_achievement_id ON achievement_likes(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_likes_user_id ON achievement_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_comments_achievement_id ON achievement_comments(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_views_achievement_id ON achievement_views(achievement_id);

-- Enable Row Level Security (RLS)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements table
-- Anyone can view achievements (public feed)
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- Only students can create achievements
CREATE POLICY "Only students can create achievements" ON achievements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'student'
      AND class_id IS NOT NULL
    )
  );

-- Users can update their own achievements
CREATE POLICY "Users can update own achievements" ON achievements
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own achievements
CREATE POLICY "Users can delete own achievements" ON achievements
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for achievement_media table
-- Anyone can view media
CREATE POLICY "Anyone can view achievement media" ON achievement_media
  FOR SELECT USING (true);

-- Only achievement owners can manage media
CREATE POLICY "Achievement owners can manage media" ON achievement_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM achievements 
      WHERE id = achievement_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for achievement_likes table
-- Anyone can view likes
CREATE POLICY "Anyone can view achievement likes" ON achievement_likes
  FOR SELECT USING (true);

-- Authenticated users can like/unlike
CREATE POLICY "Authenticated users can manage likes" ON achievement_likes
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for achievement_comments table
-- Anyone can view comments
CREATE POLICY "Anyone can view achievement comments" ON achievement_comments
  FOR SELECT USING (true);

-- Authenticated users can comment
CREATE POLICY "Authenticated users can create comments" ON achievement_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON achievement_comments
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON achievement_comments
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for achievement_views table
-- Anyone can create views (for analytics)
CREATE POLICY "Anyone can create views" ON achievement_views
  FOR INSERT WITH CHECK (true);

-- Only view own views for privacy
CREATE POLICY "Users can view own views" ON achievement_views
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Create function to get achievement with media and stats
CREATE OR REPLACE FUNCTION get_achievement_with_details(p_achievement_id UUID)
RETURNS TABLE (
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
  comments_count INTEGER,
  views_count INTEGER,
  user_liked BOOLEAN
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
    c.course_name,
    c.course_year,
    c.semester,
    c.course_group,
    co.name as country_name,
    COALESCE(media_stats.media_count, 0)::INTEGER as media_count,
    COALESCE(like_stats.likes_count, 0)::INTEGER as likes_count,
    COALESCE(comment_stats.comments_count, 0)::INTEGER as comments_count,
    COALESCE(view_stats.views_count, 0)::INTEGER as views_count,
    CASE WHEN user_likes.user_id IS NOT NULL THEN true ELSE false END as user_liked
  FROM achievements a
  JOIN profiles p ON a.user_id = p.user_id
  LEFT JOIN classes c ON p.class_id = c.id
  LEFT JOIN universities u ON c.university_id = u.id
  LEFT JOIN countries co ON u.country_id = co.id
  LEFT JOIN (
    SELECT achievement_id, COUNT(*) as media_count
    FROM achievement_media
    GROUP BY achievement_id
  ) media_stats ON a.id = media_stats.achievement_id
  LEFT JOIN (
    SELECT achievement_id, COUNT(*) as likes_count
    FROM achievement_likes
    GROUP BY achievement_id
  ) like_stats ON a.id = like_stats.achievement_id
  LEFT JOIN (
    SELECT achievement_id, COUNT(*) as comments_count
    FROM achievement_comments
    GROUP BY achievement_id
  ) comment_stats ON a.id = comment_stats.achievement_id
  LEFT JOIN (
    SELECT achievement_id, COUNT(*) as views_count
    FROM achievement_views
    GROUP BY achievement_id
  ) view_stats ON a.id = view_stats.achievement_id
  LEFT JOIN (
    SELECT achievement_id, user_id
    FROM achievement_likes
    WHERE user_id = auth.uid()
  ) user_likes ON a.id = user_likes.achievement_id
  WHERE a.id = p_achievement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all achievements with details (for feed)
CREATE OR REPLACE FUNCTION get_all_achievements_with_details(p_limit_count INTEGER DEFAULT 50, p_offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
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
  comments_count INTEGER,
  views_count INTEGER,
  user_liked BOOLEAN
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
    c.course_name,
    c.course_year,
    c.semester,
    c.course_group,
    co.name as country_name,
    COALESCE(media_stats.media_count, 0)::INTEGER as media_count,
    COALESCE(like_stats.likes_count, 0)::INTEGER as likes_count,
    COALESCE(comment_stats.comments_count, 0)::INTEGER as comments_count,
    COALESCE(view_stats.views_count, 0)::INTEGER as views_count,
    CASE WHEN user_likes.user_id IS NOT NULL THEN true ELSE false END as user_liked
  FROM achievements a
  JOIN profiles p ON a.user_id = p.user_id
  LEFT JOIN classes c ON p.class_id = c.id
  LEFT JOIN universities u ON c.university_id = u.id
  LEFT JOIN countries co ON u.country_id = co.id
  LEFT JOIN (
    SELECT achievement_id, COUNT(*) as media_count
    FROM achievement_media
    GROUP BY achievement_id
  ) media_stats ON a.id = media_stats.achievement_id
  LEFT JOIN (
    SELECT achievement_id, COUNT(*) as likes_count
    FROM achievement_likes
    GROUP BY achievement_id
  ) like_stats ON a.id = like_stats.achievement_id
  LEFT JOIN (
    SELECT achievement_id, COUNT(*) as comments_count
    FROM achievement_comments
    GROUP BY achievement_id
  ) comment_stats ON a.id = comment_stats.achievement_id
  LEFT JOIN (
    SELECT achievement_id, COUNT(*) as views_count
    FROM achievement_views
    GROUP BY achievement_id
  ) view_stats ON a.id = view_stats.achievement_id
  LEFT JOIN (
    SELECT achievement_id, user_id
    FROM achievement_likes
    WHERE user_id = auth.uid()
  ) user_likes ON a.id = user_likes.achievement_id
  ORDER BY a.created_at DESC
  LIMIT p_limit_count OFFSET p_offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's achievements
CREATE OR REPLACE FUNCTION get_user_achievements_with_details(p_user_uuid UUID, p_limit_count INTEGER DEFAULT 50, p_offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
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
  comments_count INTEGER,
  views_count INTEGER,
  user_liked BOOLEAN
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
    c.course_name,
    c.course_year,
    c.semester,
    c.course_group,
    co.name as country_name,
    COALESCE(media_stats.media_count, 0)::INTEGER as media_count,
    COALESCE(like_stats.likes_count, 0)::INTEGER as likes_count,
    COALESCE(comment_stats.comments_count, 0)::INTEGER as comments_count,
    COALESCE(view_stats.views_count, 0)::INTEGER as views_count,
    CASE WHEN user_likes.user_id IS NOT NULL THEN true ELSE false END as user_liked
  FROM achievements a
  JOIN profiles p ON a.user_id = p.user_id
  LEFT JOIN classes c ON p.class_id = c.id
  LEFT JOIN universities u ON c.university_id = u.id
  LEFT JOIN countries co ON u.country_id = co.id
  LEFT JOIN (
    SELECT achievement_id, COUNT(*) as media_count
    FROM achievement_media
    GROUP BY achievement_id
  ) media_stats ON a.id = media_stats.achievement_id
  LEFT JOIN (
    SELECT achievement_id, COUNT(*) as likes_count
    FROM achievement_likes
    GROUP BY achievement_id
  ) like_stats ON a.id = like_stats.achievement_id
  LEFT JOIN (
    SELECT achievement_id, COUNT(*) as comments_count
    FROM achievement_comments
    GROUP BY achievement_id
  ) comment_stats ON a.id = comment_stats.achievement_id
  LEFT JOIN (
    SELECT achievement_id, COUNT(*) as views_count
    FROM achievement_views
    GROUP BY achievement_id
  ) view_stats ON a.id = view_stats.achievement_id
  LEFT JOIN (
    SELECT achievement_id, user_id
    FROM achievement_likes
    WHERE user_id = auth.uid()
  ) user_likes ON a.id = user_likes.achievement_id
  WHERE a.user_id = p_user_uuid
  ORDER BY a.created_at DESC
  LIMIT p_limit_count OFFSET p_offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get achievement media
CREATE OR REPLACE FUNCTION get_achievement_media(p_achievement_id UUID)
RETURNS TABLE (
  id UUID,
  achievement_id UUID,
  media_url TEXT,
  media_type TEXT,
  thumbnail_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  duration INTEGER,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    am.id,
    am.achievement_id,
    am.media_url,
    am.media_type,
    am.thumbnail_url,
    am.file_name,
    am.file_size,
    am.duration,
    am.order_index,
    am.created_at
  FROM achievement_media am
  WHERE am.achievement_id = p_achievement_id
  ORDER BY am.order_index ASC, am.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get achievement comments with author info
CREATE OR REPLACE FUNCTION get_achievement_comments(p_achievement_id UUID, p_limit_count INTEGER DEFAULT 50, p_offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  achievement_id UUID,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  author_name TEXT,
  author_picture TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.achievement_id,
    ac.user_id,
    ac.content,
    ac.created_at,
    ac.updated_at,
    p.full_name as author_name,
    p.profile_picture_url as author_picture
  FROM achievement_comments ac
  JOIN profiles p ON ac.user_id = p.user_id
  WHERE ac.achievement_id = p_achievement_id
  ORDER BY ac.created_at ASC
  LIMIT p_limit_count OFFSET p_offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON achievements TO authenticated;
GRANT ALL ON achievement_media TO authenticated;
GRANT ALL ON achievement_likes TO authenticated;
GRANT ALL ON achievement_comments TO authenticated;
GRANT ALL ON achievement_views TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_achievement_with_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_achievements_with_details(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_achievements_with_details(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_achievement_media(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_achievement_comments(UUID, INTEGER, INTEGER) TO authenticated;

-- Grant execute permissions to anon users for viewing
GRANT EXECUTE ON FUNCTION get_achievement_with_details(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_all_achievements_with_details(INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_user_achievements_with_details(UUID, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_achievement_media(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_achievement_comments(UUID, INTEGER, INTEGER) TO anon;



