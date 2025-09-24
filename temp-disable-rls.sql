-- Temporarily disable RLS for admin operations
-- Run this in your Supabase SQL Editor

-- Disable RLS on critical tables for admin operations
ALTER TABLE public.countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Note: This is a temporary fix for admin operations
-- In production, you should use service role key instead
