-- Fix university_id constraint in messages table
-- Make university_id optional to handle users without university

-- Remove NOT NULL constraint from university_id column
ALTER TABLE public.messages ALTER COLUMN university_id DROP NOT NULL;

-- Add a foreign key constraint to universities table for data integrity
DO $$
BEGIN
    -- Add foreign key constraint for university_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'messages' AND constraint_name = 'messages_university_id_fkey') THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_university_id_fkey 
        FOREIGN KEY (university_id) REFERENCES public.universities(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add an index for better performance on university_id queries
CREATE INDEX IF NOT EXISTS idx_messages_university_id ON public.messages(university_id);

-- Add comment to explain the change
COMMENT ON COLUMN public.messages.university_id IS 'University ID for campus-based messaging. NULL for users without university.';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'University ID constraint updated successfully!';
    RAISE NOTICE 'Messages can now be sent by users without university (university_id can be NULL)';
    RAISE NOTICE 'Foreign key constraint added for data integrity';
END $$;
