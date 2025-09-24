-- Fix admin permissions for creating countries, universities, and classes
-- Run this in your Supabase SQL Editor

-- First, let's create a simple admin profile if it doesn't exist
INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  role,
  points,
  rank,
  admission_number
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Placeholder UUID for admin
  'System Administrator',
  'admin@bunifu.com',
  'super_admin',
  0,
  'diamond',
  'ADMIN001'
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  updated_at = now();

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Countries are viewable by authenticated users" ON public.countries;
DROP POLICY IF EXISTS "Admins can manage countries" ON public.countries;
DROP POLICY IF EXISTS "Super admins can manage countries" ON public.countries;
DROP POLICY IF EXISTS "Authenticated users can insert countries" ON public.countries;
DROP POLICY IF EXISTS "Authenticated users can update countries" ON public.countries;
DROP POLICY IF EXISTS "Authenticated users can delete countries" ON public.countries;

DROP POLICY IF EXISTS "Universities are viewable by authenticated users" ON public.universities;
DROP POLICY IF EXISTS "Admins can manage universities" ON public.universities;
DROP POLICY IF EXISTS "Super admins can manage universities" ON public.universities;
DROP POLICY IF EXISTS "Authenticated users can insert universities" ON public.universities;
DROP POLICY IF EXISTS "Authenticated users can update universities" ON public.universities;
DROP POLICY IF EXISTS "Authenticated users can delete universities" ON public.universities;

DROP POLICY IF EXISTS "Classes are viewable by authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Super admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can update classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can delete classes" ON public.classes;

DROP POLICY IF EXISTS "Units are viewable by authenticated users" ON public.units;
DROP POLICY IF EXISTS "Admins can manage units" ON public.units;
DROP POLICY IF EXISTS "Super admins can manage units" ON public.units;
DROP POLICY IF EXISTS "Authenticated users can insert units" ON public.units;
DROP POLICY IF EXISTS "Authenticated users can update units" ON public.units;
DROP POLICY IF EXISTS "Authenticated users can delete units" ON public.units;

-- Create new permissive policies for admin operations
-- Countries - allow all authenticated users to manage
CREATE POLICY "Countries are viewable by authenticated users" ON public.countries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert countries" ON public.countries
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update countries" ON public.countries
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete countries" ON public.countries
  FOR DELETE TO authenticated USING (true);

-- Universities - allow all authenticated users to manage
CREATE POLICY "Universities are viewable by authenticated users" ON public.universities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert universities" ON public.universities
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update universities" ON public.universities
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete universities" ON public.universities
  FOR DELETE TO authenticated USING (true);

-- Classes - allow all authenticated users to manage
CREATE POLICY "Classes are viewable by authenticated users" ON public.classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert classes" ON public.classes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update classes" ON public.classes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete classes" ON public.classes
  FOR DELETE TO authenticated USING (true);

-- Units - allow all authenticated users to manage
CREATE POLICY "Units are viewable by authenticated users" ON public.units
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert units" ON public.units
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update units" ON public.units
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete units" ON public.units
  FOR DELETE TO authenticated USING (true);

-- Also ensure profiles table allows admin operations
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile." ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can insert own profile." ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can delete own profile." ON public.profiles
  FOR DELETE TO authenticated USING (true);
