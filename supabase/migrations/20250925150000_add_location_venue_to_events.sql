-- Add location and venue columns to events table

-- Add location column
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add venue column  
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS venue TEXT;

-- Add comments to the columns for documentation
COMMENT ON COLUMN public.events.location IS 'Optional location information for the event (e.g., Main Campus, Room 101)';
COMMENT ON COLUMN public.events.venue IS 'Optional venue information for the event (e.g., Library Hall, Computer Lab)';
