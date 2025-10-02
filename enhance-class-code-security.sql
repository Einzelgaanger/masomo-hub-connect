-- Enhance class code security system
-- Add expiration functionality and improve code generation

-- Add new columns to classes table for enhanced security
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS code_expires BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS code_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS code_created_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing classes to have the new timestamp
CREATE OR REPLACE FUNCTION generate_secure_class_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    code_length INTEGER := 12; -- Increased from 6 to 12 characters
BEGIN
    -- Generate a 12-character code with uppercase letters and numbers
    FOR i IN 1..code_length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Ensure uniqueness by checking if code already exists
    WHILE EXISTS (SELECT 1 FROM public.classes WHERE class_code = result) LOOP
        result := '';
        FOR i IN 1..code_length LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if a class code is valid (not expired)
CREATE OR REPLACE FUNCTION is_class_code_valid(code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    class_record RECORD;
BEGIN
    -- Get the class with this code
    SELECT code_expires, code_expires_at 
    INTO class_record
    FROM public.classes 
    WHERE class_code = code;
    
    -- If class doesn't exist, return false
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- If code doesn't expire, it's always valid
    IF NOT class_record.code_expires THEN
        RETURN true;
    END IF;
    
    -- If code expires, check if it's still valid
    IF class_record.code_expires_at IS NULL OR class_record.code_expires_at > NOW() THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to regenerate class code
CREATE OR REPLACE FUNCTION regenerate_class_code(
    p_class_id UUID,
    p_creator_id UUID,
    p_expires BOOLEAN DEFAULT false,
    p_expires_in_hours INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    expires_at TIMESTAMPTZ;
BEGIN
    -- Check if user is the creator of this class
    IF NOT EXISTS (
        SELECT 1 FROM public.classes 
        WHERE id = p_class_id AND creator_id = p_creator_id
    ) THEN
        RAISE EXCEPTION 'Only class creator can regenerate code';
    END IF;
    
    -- Generate new code
    new_code := generate_secure_class_code();
    
    -- Calculate expiration time if needed
    IF p_expires AND p_expires_in_hours IS NOT NULL THEN
        expires_at := NOW() + (p_expires_in_hours || ' hours')::INTERVAL;
    ELSE
        expires_at := NULL;
    END IF;
    
    -- Update the class with new code and expiration settings
    UPDATE public.classes 
    SET 
        class_code = new_code,
        code_expires = p_expires,
        code_expires_at = expires_at,
        code_created_at = NOW()
    WHERE id = p_class_id;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Update existing class codes to be more secure (12 characters)
DO $$
DECLARE
    class_record RECORD;
    new_code TEXT;
BEGIN
    FOR class_record IN SELECT id FROM public.classes LOOP
        new_code := generate_secure_class_code();
        UPDATE public.classes 
        SET class_code = new_code 
        WHERE id = class_record.id;
    END LOOP;
END $$;

-- Create index for better performance on code lookups
CREATE INDEX IF NOT EXISTS idx_classes_code_expires ON public.classes(class_code, code_expires, code_expires_at);

COMMIT;
