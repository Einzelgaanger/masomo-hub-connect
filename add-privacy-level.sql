-- Add privacy_level column to profiles table
-- Default value is 'uni' for existing users

-- Add the column with default value
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'uni' 
CHECK (privacy_level IN ('private', 'uni', 'public'));

-- Update existing users to have 'uni' privacy level
UPDATE profiles 
SET privacy_level = 'uni' 
WHERE privacy_level IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_level ON profiles(privacy_level);

-- Add RLS policy to allow users to update their own privacy level
CREATE POLICY "Users can update their own privacy level" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policy to allow users to view privacy levels for search purposes
-- This will be used in the search queries
CREATE POLICY "Users can view privacy levels for search" ON profiles
  FOR SELECT TO authenticated
  USING (true); -- Allow all authenticated users to see privacy levels for search logic

-- Add comment to document the privacy levels
COMMENT ON COLUMN profiles.privacy_level IS 'Privacy level: private (invisible), uni (university only), public (everyone)';
