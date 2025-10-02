-- Simple fix for class_join_requests table
-- Add missing columns if they don't exist

-- Add request_message column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_join_requests' 
                   AND column_name = 'request_message') THEN
        ALTER TABLE public.class_join_requests ADD COLUMN request_message TEXT;
    END IF;
END $$;

-- Add responded_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_join_requests' 
                   AND column_name = 'responded_at') THEN
        ALTER TABLE public.class_join_requests ADD COLUMN responded_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add responder_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_join_requests' 
                   AND column_name = 'responder_id') THEN
        ALTER TABLE public.class_join_requests ADD COLUMN responder_id UUID;
    END IF;
END $$;

-- Add rejection_reason column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_join_requests' 
                   AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.class_join_requests ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

COMMIT;
