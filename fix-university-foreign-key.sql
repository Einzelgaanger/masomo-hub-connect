-- Fix foreign key constraint for university_id in messages table
-- Remove incorrect reference to universities_old and point to correct universities table

-- First, drop the incorrect foreign key constraint
DO $$
BEGIN
    -- Drop the existing foreign key constraint that points to universities_old
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'messages' AND constraint_name = 'messages_university_id_fkey') THEN
        ALTER TABLE public.messages DROP CONSTRAINT messages_university_id_fkey;
        RAISE NOTICE 'Dropped incorrect foreign key constraint pointing to universities_old';
    END IF;
END $$;
                                                       
-- Check what universities table exists and create correct foreign key
DO $$
BEGIN
    -- Check if universities table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'universities' AND table_schema = 'public') THEN
        
        -- Create foreign key constraint pointing to the correct universities table
        ALTER TABLE public.messages ADD CONSTRAINT messages_university_id_fkey 
        FOREIGN KEY (university_id) REFERENCES public.universities(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Created foreign key constraint pointing to public.universities';
        
    ELSE
        -- If universities table doesn't exist, make university_id optional without foreign key
        RAISE NOTICE 'Universities table does not exist, university_id will be optional without foreign key constraint';
    END IF;
END $$;

-- Alternatively, if we want to completely remove the foreign key constraint for now:
-- (Uncomment the lines below if you prefer no foreign key constraint)

/*
-- Just make university_id optional without any foreign key constraint
DO $$
BEGIN
    -- Drop any existing foreign key constraint
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'messages' AND constraint_name LIKE '%university_id%') THEN
        
        -- Get the actual constraint name and drop it
        DECLARE
            constraint_name_var text;
        BEGIN
            SELECT constraint_name INTO constraint_name_var
            FROM information_schema.table_constraints 
            WHERE table_name = 'messages' AND constraint_name LIKE '%university_id%'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE 'ALTER TABLE public.messages DROP CONSTRAINT ' || constraint_name_var;
                RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name_var;
            END IF;
        END;
    END IF;
    
    RAISE NOTICE 'University ID is now optional without foreign key constraint';
END $$;
*/

-- Make sure university_id column allows NULL values
ALTER TABLE public.messages ALTER COLUMN university_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN public.messages.university_id IS 'University ID for campus-based messaging. References universities.id or NULL for global messages.';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== Foreign Key Fix Completed ===';
    RAISE NOTICE 'University ID foreign key constraint has been fixed';
    RAISE NOTICE 'Messages can now be inserted with valid university_id or NULL';
    RAISE NOTICE 'Ukumbi messaging should now work properly!';
END $$;
