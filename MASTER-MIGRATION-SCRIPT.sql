-- =====================================================
-- MASTER MIGRATION SCRIPT - NEW CLASS SYSTEM
-- Run this ENTIRE script in one go!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STARTING MASTER MIGRATION';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- STEP 1: RENAME OLD TABLES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 1/4: Renaming old tables...';
END $$;

-- Rename old tables to preserve data
ALTER TABLE IF EXISTS public.classes RENAME TO classes_old;
ALTER TABLE IF EXISTS public.universities RENAME TO universities_old;
ALTER TABLE IF EXISTS public.countries RENAME TO countries_old;

DO $$
BEGIN
  RAISE NOTICE '✅ Old tables renamed to *_old';
END $$;

-- =====================================================
-- STEP 2: CREATE NEW TABLES & STRUCTURES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 2/4: Creating new tables...';
END $$;

-- Countries Table
CREATE TABLE IF NOT EXISTS public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_countries_name ON public.countries(name);

-- Universities Table
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  description TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, country_id)
);

CREATE INDEX IF NOT EXISTS idx_universities_country ON public.universities(country_id);
CREATE INDEX IF NOT EXISTS idx_universities_name ON public.universities(name);

-- Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, university_id)
);

CREATE INDEX IF NOT EXISTS idx_courses_university ON public.courses(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_name ON public.courses(name);

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES public.countries(id),
ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id),
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id),
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS semester TEXT,
ADD COLUMN IF NOT EXISTS student_status TEXT DEFAULT 'student' CHECK (student_status IN ('student', 'graduated', 'alumni'));

CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country_id);
CREATE INDEX IF NOT EXISTS idx_profiles_university ON public.profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_profiles_course ON public.profiles(course_id);
CREATE INDEX IF NOT EXISTS idx_profiles_student_status ON public.profiles(student_status);

-- Classes Table (NEW)
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE,
  is_searchable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_creator ON public.classes(creator_id);
CREATE INDEX IF NOT EXISTS idx_classes_share_code ON public.classes(share_code);
CREATE INDEX IF NOT EXISTS idx_classes_searchable ON public.classes(is_searchable);
CREATE INDEX IF NOT EXISTS idx_classes_name ON public.classes(name);

-- Class Units Table
CREATE TABLE IF NOT EXISTS public.class_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_units_class ON public.class_units(class_id);
CREATE INDEX IF NOT EXISTS idx_class_units_order ON public.class_units(class_id, unit_order);

-- Class Members Table
CREATE TABLE IF NOT EXISTS public.class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_class_members_class ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user ON public.class_members(user_id);
CREATE INDEX IF NOT EXISTS idx_class_members_role ON public.class_members(class_id, role);
CREATE INDEX IF NOT EXISTS idx_class_members_joined ON public.class_members(class_id, joined_at);

-- Class Join Requests Table
CREATE TABLE IF NOT EXISTS public.class_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  UNIQUE(class_id, user_id, status)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_class ON public.class_join_requests(class_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON public.class_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON public.class_join_requests(class_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_pending ON public.class_join_requests(class_id) WHERE status = 'pending';

-- Class Chatrooms Table
CREATE TABLE IF NOT EXISTS public.class_chatrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_chatrooms_class ON public.class_chatrooms(class_id);

-- Class Messages Table
CREATE TABLE IF NOT EXISTS public.class_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatroom_id UUID NOT NULL REFERENCES public.class_chatrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  media_url TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_messages_chatroom ON public.class_messages(chatroom_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_class_messages_user ON public.class_messages(user_id);

-- User Hidden Units Table
CREATE TABLE IF NOT EXISTS public.user_hidden_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.class_units(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, unit_id)
);

CREATE INDEX IF NOT EXISTS idx_user_hidden_units_user ON public.user_hidden_units(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hidden_units_unit ON public.user_hidden_units(unit_id);

-- Add new column to units table
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS class_unit_id UUID REFERENCES public.class_units(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_units_class_unit ON public.units(class_unit_id);

-- Add new column to uploads table
ALTER TABLE public.uploads
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_uploads_class ON public.uploads(class_id);

DO $$
BEGIN
  RAISE NOTICE '✅ New tables and columns created';
END $$;

-- Continue in next message...

