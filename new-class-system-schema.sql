-- New Class-Based System Database Schema
-- This creates the complete new system for community-driven classes

-- ==============================================
-- 1. COUNTRIES, UNIVERSITIES, COURSES MANAGEMENT
-- ==============================================

-- Countries table
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE, -- e.g., 'US', 'KE', 'UK'
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

-- ==============================================
-- 2. UPDATED PROFILES SYSTEM
-- ==============================================

-- Update profiles table to include new fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES public.countries(id),
ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id),
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id),
ADD COLUMN IF NOT EXISTS year TEXT, -- e.g., "1st Year", "2nd Year", "Graduated", "Alumni"
ADD COLUMN IF NOT EXISTS semester TEXT, -- e.g., "Fall", "Spring", "Summer", "5"
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- ==============================================
-- 3. CLASS SYSTEM
-- ==============================================

-- Classes table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    class_code TEXT NOT NULL UNIQUE, -- Unique join code like "ABC123"
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

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

-- ==============================================
-- 4. CLASS CHAT SYSTEM
-- ==============================================

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
-- 5. UPDATED UPLOADS SYSTEM FOR CLASSES
-- ==============================================

-- Update uploads table to work with class system
ALTER TABLE public.uploads 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS class_unit_id UUID REFERENCES public.class_units(id) ON DELETE SET NULL;

-- Update assignments table similarly
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS class_unit_id UUID REFERENCES public.class_units(id) ON DELETE SET NULL;

-- ==============================================
-- 6. INDEXES FOR PERFORMANCE
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
-- 7. ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Countries, universities, courses - readable by all
CREATE POLICY "Anyone can view countries" ON public.countries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view universities" ON public.universities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT TO authenticated USING (true);

-- Classes - readable by members, creatable by authenticated users
CREATE POLICY "Class members can view classes" ON public.classes FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.class_members cm 
        WHERE cm.class_id = classes.id AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "Anyone can create classes" ON public.classes FOR INSERT TO authenticated WITH CHECK (
    creator_id = auth.uid()
);

CREATE POLICY "Class creators can update their classes" ON public.classes FOR UPDATE TO authenticated USING (
    creator_id = auth.uid()
);

CREATE POLICY "Class creators can delete their classes" ON public.classes FOR DELETE TO authenticated USING (
    creator_id = auth.uid()
);

-- Class units - readable by class members, manageable by class creator
CREATE POLICY "Class members can view units" ON public.class_units FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.class_members cm 
        JOIN public.classes c ON cm.class_id = c.id
        WHERE c.id = class_units.class_id AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "Class creators can manage units" ON public.class_units FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.classes c 
        WHERE c.id = class_units.class_id AND c.creator_id = auth.uid()
    )
);

-- Class members - readable by class members
CREATE POLICY "Class members can view members" ON public.class_members FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.class_members cm 
        WHERE cm.class_id = class_members.class_id AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "Class creators can manage members" ON public.class_members FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.classes c 
        WHERE c.id = class_members.class_id AND c.creator_id = auth.uid()
    )
);

-- Join requests - readable by class creator, creatable by anyone
CREATE POLICY "Class creators can view join requests" ON public.class_join_requests FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.classes c 
        WHERE c.id = class_join_requests.class_id AND c.creator_id = auth.uid()
    )
);

CREATE POLICY "Anyone can create join requests" ON public.class_join_requests FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "Class creators can manage join requests" ON public.class_join_requests FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.classes c 
        WHERE c.id = class_join_requests.class_id AND c.creator_id = auth.uid()
    )
);

-- Chat messages - readable by class members, creatable by class members
CREATE POLICY "Class members can view chat messages" ON public.class_chat_messages FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.class_members cm 
        WHERE cm.class_id = class_chat_messages.class_id AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "Class members can send chat messages" ON public.class_chat_messages FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.class_members cm 
        WHERE cm.class_id = class_chat_messages.class_id AND cm.user_id = auth.uid()
    )
);

-- ==============================================
-- 8. FUNCTIONS FOR CLASS MANAGEMENT
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

-- ==============================================
-- 9. INITIAL DATA SETUP
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
-- 10. UPDATE EXISTING TABLES
-- ==============================================

-- Update Sifa achievements to require profile completion
ALTER TABLE public.achievements 
ADD COLUMN IF NOT EXISTS requires_profile_completion BOOLEAN DEFAULT TRUE;

-- Update existing RLS policies for achievements
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
-- 11. TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================================

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

-- Create trigger for profile completion
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON public.profiles;
CREATE TRIGGER trigger_update_profile_completion
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion();

-- ==============================================
-- 12. ADMIN ANALYTICS FUNCTIONS
-- ==============================================

-- Function to get class statistics
CREATE OR REPLACE FUNCTION get_class_statistics()
RETURNS TABLE (
    total_classes BIGINT,
    total_members BIGINT,
    total_join_requests BIGINT,
    pending_requests BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.classes WHERE is_active = TRUE) as total_classes,
        (SELECT COUNT(*) FROM public.class_members) as total_members,
        (SELECT COUNT(*) FROM public.class_join_requests) as total_join_requests,
        (SELECT COUNT(*) FROM public.class_join_requests WHERE status = 'pending') as pending_requests;
END;
$$ LANGUAGE plpgsql;

-- Function to get class details with member counts
CREATE OR REPLACE FUNCTION get_class_details()
RETURNS TABLE (
    class_id UUID,
    class_name TEXT,
    class_code TEXT,
    creator_name TEXT,
    member_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as class_id,
        c.name as class_name,
        c.class_code,
        p.full_name as creator_name,
        (SELECT COUNT(*) FROM public.class_members cm WHERE cm.class_id = c.id) as member_count,
        c.created_at
    FROM public.classes c
    JOIN public.profiles p ON c.creator_id = p.user_id
    WHERE c.is_active = TRUE
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;
