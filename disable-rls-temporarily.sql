-- Temporarily disable RLS for admin operations
-- This allows the admin interface to work without permission issues
-- Run this in your Supabase SQL Editor

-- Temporarily disable RLS on key tables for admin operations
ALTER TABLE public.countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_visits DISABLE ROW LEVEL SECURITY;

-- Note: This disables security temporarily for development
-- In production, you would want to re-enable RLS with proper policies
