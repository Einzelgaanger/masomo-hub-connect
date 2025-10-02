-- Setup New Class-Based System
-- This script sets up the new system without breaking existing data

-- ==============================================
-- 1. ADD NEW COLUMNS TO EXISTING TABLES
-- ==============================================

-- Add new profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country_id UUID,
ADD COLUMN IF NOT EXISTS university_id UUID,
ADD COLUMN IF NOT EXISTS course_id UUID,
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS semester TEXT,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Add new upload fields
ALTER TABLE public.uploads 
ADD COLUMN IF NOT EXISTS class_id UUID,
ADD COLUMN IF NOT EXISTS class_unit_id UUID,
ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Add new assignment fields
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS class_id UUID,
ADD COLUMN IF NOT EXISTS class_unit_id UUID,
ADD COLUMN IF NOT EXISTS link_url TEXT;

-- ==============================================
-- 2. CREATE NEW TABLES
-- ==============================================

-- Countries table
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Universities table
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, country_id)
);

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, university_id)
);

-- Classes table (new class system)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Add class_code column if it doesn't exist
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS class_code TEXT;

-- Add unique constraint for class_code
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'classes_class_code_key') THEN
        ALTER TABLE public.classes ADD CONSTRAINT classes_class_code_key UNIQUE (class_code);
    END IF;
END $$;

-- Class units table
CREATE TABLE IF NOT EXISTS public.class_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class members table
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, user_id)
);

-- Class join requests table
CREATE TABLE IF NOT EXISTS public.class_join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    UNIQUE(class_id, user_id)
);

-- Class chat messages table
CREATE TABLE IF NOT EXISTS public.class_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'file')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    reply_to_id UUID REFERENCES public.class_chat_messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. ADD FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Add foreign key constraints for profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_profiles_country') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_country FOREIGN KEY (country_id) REFERENCES public.countries(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_profiles_university') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_university FOREIGN KEY (university_id) REFERENCES public.universities(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_profiles_course') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_course FOREIGN KEY (course_id) REFERENCES public.courses(id);
    END IF;
END $$;

-- Add foreign key constraints for uploads
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_uploads_class') THEN
        ALTER TABLE public.uploads ADD CONSTRAINT fk_uploads_class FOREIGN KEY (class_id) REFERENCES public.classes(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_uploads_class_unit') THEN
        ALTER TABLE public.uploads ADD CONSTRAINT fk_uploads_class_unit FOREIGN KEY (class_unit_id) REFERENCES public.class_units(id);
    END IF;
END $$;

-- Add foreign key constraints for assignments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_assignments_class') THEN
        ALTER TABLE public.assignments ADD CONSTRAINT fk_assignments_class FOREIGN KEY (class_id) REFERENCES public.classes(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_assignments_class_unit') THEN
        ALTER TABLE public.assignments ADD CONSTRAINT fk_assignments_class_unit FOREIGN KEY (class_unit_id) REFERENCES public.class_units(id);
    END IF;
END $$;

-- ==============================================
-- 4. CREATE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_classes_creator ON public.classes(creator_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON public.classes(class_code);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user ON public.class_members(user_id);
CREATE INDEX IF NOT EXISTS idx_class_join_requests_class ON public.class_join_requests(class_id);
CREATE INDEX IF NOT EXISTS idx_class_join_requests_user ON public.class_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_class ON public.class_chat_messages(class_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_messages_sender ON public.class_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_uploads_class ON public.uploads(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country_id);
CREATE INDEX IF NOT EXISTS idx_profiles_university ON public.profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_profiles_course ON public.profiles(course_id);

-- ==============================================
-- 5. CREATE FUNCTIONS
-- ==============================================

-- Function to generate unique class code
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Generate 6-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if code already exists
        SELECT COUNT(*) INTO exists_count FROM public.classes WHERE class_code = code;
        
        IF exists_count = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to approve join request
CREATE OR REPLACE FUNCTION approve_class_join_request(
    p_request_id UUID,
    p_processed_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- Get the join request
    SELECT * INTO request_record FROM public.class_join_requests WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if the processor is the class creator
    IF NOT EXISTS (
        SELECT 1 FROM public.classes 
        WHERE id = request_record.class_id AND creator_id = p_processed_by
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Update the request status
    UPDATE public.class_join_requests 
    SET status = 'approved', 
        processed_at = NOW(), 
        processed_by = p_processed_by
    WHERE id = p_request_id;
    
    -- Add user to class members
    INSERT INTO public.class_members (class_id, user_id, role)
    VALUES (request_record.class_id, request_record.user_id, 'member')
    ON CONFLICT (class_id, user_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to reject join request
CREATE OR REPLACE FUNCTION reject_class_join_request(
    p_request_id UUID,
    p_processed_by UUID,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- Get the join request
    SELECT * INTO request_record FROM public.class_join_requests WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if the processor is the class creator
    IF NOT EXISTS (
        SELECT 1 FROM public.classes 
        WHERE id = request_record.class_id AND creator_id = p_processed_by
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Update the request status
    UPDATE public.class_join_requests 
    SET status = 'rejected', 
        processed_at = NOW(), 
        processed_by = p_processed_by,
        rejection_reason = p_rejection_reason
    WHERE id = p_request_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to transfer class creator role
CREATE OR REPLACE FUNCTION transfer_class_creator_role(
    p_class_id UUID,
    p_current_creator_id UUID,
    p_new_creator_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    new_creator_id UUID;
BEGIN
    -- Verify current creator
    IF NOT EXISTS (
        SELECT 1 FROM public.classes 
        WHERE id = p_class_id AND creator_id = p_current_creator_id
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Find new creator by email
    SELECT id INTO new_creator_id FROM auth.users WHERE email = p_new_creator_email;
    
    IF new_creator_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if new creator is already a member
    IF NOT EXISTS (
        SELECT 1 FROM public.class_members 
        WHERE class_id = p_class_id AND user_id = new_creator_id
    ) THEN
        -- Add them as a member first
        INSERT INTO public.class_members (class_id, user_id, role)
        VALUES (p_class_id, new_creator_id, 'member');
    END IF;
    
    -- Update class creator
    UPDATE public.classes SET creator_id = new_creator_id WHERE id = p_class_id;
    
    -- Update member roles
    UPDATE public.class_members SET role = 'member' WHERE class_id = p_class_id AND user_id = p_current_creator_id;
    UPDATE public.class_members SET role = 'creator' WHERE class_id = p_class_id AND user_id = new_creator_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile completion status
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if all required fields are filled
    NEW.profile_completed := (
        NEW.full_name IS NOT NULL AND 
        NEW.email IS NOT NULL AND 
        NEW.country_id IS NOT NULL AND 
        NEW.university_id IS NOT NULL AND 
        NEW.course_id IS NOT NULL AND 
        NEW.year IS NOT NULL
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 6. CREATE TRIGGERS
-- ==============================================

-- Create trigger for profile completion
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON public.profiles;
CREATE TRIGGER trigger_update_profile_completion
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion();

-- ==============================================
-- 7. INSERT INITIAL DATA
-- ==============================================

-- Insert some basic countries
INSERT INTO public.countries (name, code) VALUES 
('United States', 'US'),
('Kenya', 'KE'),
('United Kingdom', 'UK'),
('Canada', 'CA'),
('Australia', 'AU'),
('Germany', 'DE'),
('France', 'FR'),
('India', 'IN'),
('South Africa', 'ZA'),
('Nigeria', 'NG')
ON CONFLICT (name) DO NOTHING;

-- Insert some basic universities
INSERT INTO public.universities (name, country_id, website) VALUES 
('Harvard University', (SELECT id FROM public.countries WHERE name = 'United States'), 'https://harvard.edu'),
('University of Nairobi', (SELECT id FROM public.countries WHERE name = 'Kenya'), 'https://uonbi.ac.ke'),
('Oxford University', (SELECT id FROM public.countries WHERE name = 'United Kingdom'), 'https://ox.ac.uk'),
('University of Toronto', (SELECT id FROM public.countries WHERE name = 'Canada'), 'https://utoronto.ca'),
('University of Melbourne', (SELECT id FROM public.countries WHERE name = 'Australia'), 'https://unimelb.edu.au')
ON CONFLICT (name, country_id) DO NOTHING;

-- Insert some basic courses for Harvard
INSERT INTO public.courses (name, university_id) VALUES 
('Computer Science', (SELECT id FROM public.universities WHERE name = 'Harvard University')),
('Business Administration', (SELECT id FROM public.universities WHERE name = 'Harvard University')),
('Medicine', (SELECT id FROM public.universities WHERE name = 'Harvard University')),
('Law', (SELECT id FROM public.universities WHERE name = 'Harvard University')),
('Engineering', (SELECT id FROM public.universities WHERE name = 'Harvard University'))
ON CONFLICT (name, university_id) DO NOTHING;

-- ==============================================
-- 8. CREATE RLS POLICIES
-- ==============================================

-- Countries, universities, courses - readable by all
DROP POLICY IF EXISTS "Anyone can view countries" ON public.countries;
CREATE POLICY "Anyone can view countries" ON public.countries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view universities" ON public.universities;
CREATE POLICY "Anyone can view universities" ON public.universities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT TO authenticated USING (true);

-- Classes - readable by members, creatable by authenticated users
DROP POLICY IF EXISTS "Class members can view classes" ON public.classes;
CREATE POLICY "Class members can view classes" ON public.classes FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.class_members cm 
        WHERE cm.class_id = classes.id AND cm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Anyone can create classes" ON public.classes;
CREATE POLICY "Anyone can create classes" ON public.classes FOR INSERT TO authenticated WITH CHECK (
    creator_id = auth.uid()
);

DROP POLICY IF EXISTS "Class creators can update their classes" ON public.classes;
CREATE POLICY "Class creators can update their classes" ON public.classes FOR UPDATE TO authenticated USING (
    creator_id = auth.uid()
);

DROP POLICY IF EXISTS "Class creators can delete their classes" ON public.classes;
CREATE POLICY "Class creators can delete their classes" ON public.classes FOR DELETE TO authenticated USING (
    creator_id = auth.uid()
);

-- Class units - readable by class members, manageable by class creator
DROP POLICY IF EXISTS "Class members can view units" ON public.class_units;
CREATE POLICY "Class members can view units" ON public.class_units FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.class_members cm 
        JOIN public.classes c ON cm.class_id = c.id
        WHERE c.id = class_units.class_id AND cm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Class creators can manage units" ON public.class_units;
CREATE POLICY "Class creators can manage units" ON public.class_units FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.classes c 
        WHERE c.id = class_units.class_id AND c.creator_id = auth.uid()
    )
);

-- Class members - readable by class members
DROP POLICY IF EXISTS "Class members can view members" ON public.class_members;
CREATE POLICY "Class members can view members" ON public.class_members FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.class_members cm 
        WHERE cm.class_id = class_members.class_id AND cm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Class creators can manage members" ON public.class_members;
CREATE POLICY "Class creators can manage members" ON public.class_members FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.classes c 
        WHERE c.id = class_members.class_id AND c.creator_id = auth.uid()
    )
);

-- Join requests - readable by class creator, creatable by anyone
DROP POLICY IF EXISTS "Class creators can view join requests" ON public.class_join_requests;
CREATE POLICY "Class creators can view join requests" ON public.class_join_requests FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.classes c 
        WHERE c.id = class_join_requests.class_id AND c.creator_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Anyone can create join requests" ON public.class_join_requests;
CREATE POLICY "Anyone can create join requests" ON public.class_join_requests FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
);

DROP POLICY IF EXISTS "Class creators can manage join requests" ON public.class_join_requests;
CREATE POLICY "Class creators can manage join requests" ON public.class_join_requests FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.classes c 
        WHERE c.id = class_join_requests.class_id AND c.creator_id = auth.uid()
    )
);

-- Chat messages - readable by class members, creatable by class members
DROP POLICY IF EXISTS "Class members can view chat messages" ON public.class_chat_messages;
CREATE POLICY "Class members can view chat messages" ON public.class_chat_messages FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.class_members cm 
        WHERE cm.class_id = class_chat_messages.class_id AND cm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Class members can send chat messages" ON public.class_chat_messages;
CREATE POLICY "Class members can send chat messages" ON public.class_chat_messages FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.class_members cm 
        WHERE cm.class_id = class_chat_messages.class_id AND cm.user_id = auth.uid()
    )
);

-- ==============================================
-- 9. UPDATE EXISTING POLICIES
-- ==============================================

-- Update Sifa achievements to require profile completion
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
CREATE POLICY "Users with completed profiles can view achievements" ON public.achievements 
FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.profile_completed = TRUE
    )
);

-- Update job postings to allow anyone to post
DROP POLICY IF EXISTS "Only students can post jobs" ON public.job_postings;
CREATE POLICY "Anyone can post jobs" ON public.job_postings 
FOR INSERT TO authenticated WITH CHECK (true);

-- ==============================================
-- 10. VERIFY SETUP
-- ==============================================

-- Show what was created
SELECT 'Setup completed successfully!' as status;
SELECT 'Countries created:' as info, COUNT(*) as count FROM public.countries;
SELECT 'Universities created:' as info, COUNT(*) as count FROM public.universities;
SELECT 'Courses created:' as info, COUNT(*) as count FROM public.courses;
SELECT 'Classes table ready:' as info, COUNT(*) as count FROM public.classes;
