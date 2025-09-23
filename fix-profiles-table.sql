-- Fix profiles table to allow NULL user_id values
-- This allows admin to create student profiles before they register

-- Allow NULL user_id in profiles table
ALTER TABLE profiles ALTER COLUMN user_id DROP NOT NULL;

-- Update the existing profiles that have NULL user_id to have a proper ID
UPDATE profiles 
SET id = COALESCE(id, gen_random_uuid())
WHERE id IS NULL;

-- Make sure id column has a default value
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add a comment to explain the new workflow
COMMENT ON COLUMN profiles.user_id IS 'Links to auth.users.id when student registers, NULL until then';
COMMENT ON TABLE profiles IS 'Student profiles created by admin. user_id is linked when student registers with their admission number.';
