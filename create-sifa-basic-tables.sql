-- Create basic Sifa tables (minimal version)
-- Run this first to create the basic tables

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

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
DROP POLICY IF EXISTS "Only students can create achievements" ON achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can delete own achievements" ON achievements;

DROP POLICY IF EXISTS "Anyone can view achievement media" ON achievement_media;
DROP POLICY IF EXISTS "Achievement owners can manage media" ON achievement_media;

DROP POLICY IF EXISTS "Anyone can view achievement likes" ON achievement_likes;
DROP POLICY IF EXISTS "Authenticated users can manage likes" ON achievement_likes;

DROP POLICY IF EXISTS "Anyone can view achievement comments" ON achievement_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON achievement_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON achievement_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON achievement_comments;

DROP POLICY IF EXISTS "Anyone can create views" ON achievement_views;
DROP POLICY IF EXISTS "Users can view own views" ON achievement_views;

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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON achievements TO authenticated;
GRANT ALL ON achievement_media TO authenticated;
GRANT ALL ON achievement_likes TO authenticated;
GRANT ALL ON achievement_comments TO authenticated;
GRANT ALL ON achievement_views TO authenticated;
