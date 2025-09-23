-- Temporarily disable RLS to test if it's causing the login issue
-- This is for debugging purposes only

-- Disable RLS on profiles table temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on other tables that might be accessed during login
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries DISABLE ROW LEVEL SECURITY;

-- Note: This is temporary for debugging. Re-enable RLS after fixing the issue.
