-- Add character tracking to profiles table
-- This script adds a character_id column to track which character a user has selected

-- Add character_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS character_id TEXT DEFAULT 'people';

-- Add foreign key constraint (optional - references our CHARACTERS constant)
-- Note: This is a soft reference since we're using constants in the app
-- ALTER TABLE profiles 
-- ADD CONSTRAINT fk_profiles_character_id 
-- FOREIGN KEY (character_id) REFERENCES characters(id);

-- Update existing profiles to have the default character
UPDATE profiles 
SET character_id = 'people' 
WHERE character_id IS NULL;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_character_id ON profiles(character_id);

-- Add a comment to document the column
COMMENT ON COLUMN profiles.character_id IS 'References the character ID from the CHARACTERS constant in the application';

-- Optional: Create a trigger to automatically update character when points change
-- This ensures users automatically get the highest character they qualify for
CREATE OR REPLACE FUNCTION update_character_based_on_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update character based on points (this logic matches our CHARACTERS constant)
  NEW.character_id := CASE
    WHEN NEW.points >= 5000 THEN 'anonymous'
    WHEN NEW.points >= 3000 THEN 'halloween'
    WHEN NEW.points >= 2500 THEN 'zombie'
    WHEN NEW.points >= 2000 THEN 'assasin'
    WHEN NEW.points >= 1500 THEN 'angel'
    WHEN NEW.points >= 1000 THEN 'superhero'
    WHEN NEW.points >= 750 THEN 'pirate'
    WHEN NEW.points >= 500 THEN 'swordsman'
    WHEN NEW.points >= 350 THEN 'leonardo'
    WHEN NEW.points >= 200 THEN 'elf'
    WHEN NEW.points >= 100 THEN 'guard'
    WHEN NEW.points >= 50 THEN 'pinocchio'
    ELSE 'people'
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update character when points change
DROP TRIGGER IF EXISTS trigger_update_character ON profiles;
CREATE TRIGGER trigger_update_character
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.points != OLD.points)
  EXECUTE FUNCTION update_character_based_on_points();

-- Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Success message
SELECT 'Character tracking system added successfully!' as message;
