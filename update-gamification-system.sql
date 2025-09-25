-- Update gamification system with new character thresholds and balanced points
-- This script updates the database function to match the new character progression

-- Update the character assignment function to match new thresholds
CREATE OR REPLACE FUNCTION update_character_based_on_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update character based on points (matching new CHARACTERS constant)
  NEW.character_id := CASE
    WHEN NEW.points >= 25000 THEN 'anonymous'
    WHEN NEW.points >= 15000 THEN 'halloween'
    WHEN NEW.points >= 9000 THEN 'zombie'
    WHEN NEW.points >= 6500 THEN 'assasin'
    WHEN NEW.points >= 4500 THEN 'angel'
    WHEN NEW.points >= 3000 THEN 'superhero'
    WHEN NEW.points >= 2000 THEN 'pirate'
    WHEN NEW.points >= 1300 THEN 'swordsman'
    WHEN NEW.points >= 850 THEN 'leonardo'
    WHEN NEW.points >= 500 THEN 'elf'
    WHEN NEW.points >= 250 THEN 'guard'
    WHEN NEW.points >= 100 THEN 'pinocchio'
    ELSE 'people'
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the rank assignment function to match new character progression
CREATE OR REPLACE FUNCTION public.update_user_points(user_uuid UUID, points_change INTEGER)
RETURNS VOID AS $$
DECLARE
  new_points INTEGER;
  new_rank user_rank;
BEGIN
  UPDATE public.profiles 
  SET points = points + points_change
  WHERE user_id = user_uuid
  RETURNING points INTO new_points;
  
  -- Update rank based on points (aligned with character progression)
  IF new_points >= 15000 THEN
    new_rank := 'diamond';
  ELSIF new_points >= 6500 THEN
    new_rank := 'platinum';
  ELSIF new_points >= 2000 THEN
    new_rank := 'gold';
  ELSIF new_points >= 500 THEN
    new_rank := 'silver';
  ELSE
    new_rank := 'bronze';
  END IF;
  
  UPDATE public.profiles 
  SET rank = new_rank
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add comments to document the new system
COMMENT ON FUNCTION update_character_based_on_points() IS 'Updated to match new character progression thresholds: Regular(0), Pinocchio(100), Guardian(250), Elf(500), Leonardo(850), Swordsman(1300), Pirate(2000), Superhero(3000), Angel(4500), Assassin(6500), Zombie(9000), Ghost(15000), Anonymous(25000)';

COMMENT ON FUNCTION public.update_user_points(UUID, INTEGER) IS 'Updated point rewards: Notes(5), Past Papers(7), Comments(2), Likes(1), Daily Visit(2), Assignments(10), Events(4). Ranks aligned with character progression.';
