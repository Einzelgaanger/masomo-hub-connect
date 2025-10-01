-- =====================================================
-- STEP 1: RENAME OLD TABLES
-- This ensures the new schema can be created cleanly
-- =====================================================

-- Rename old classes table to classes_old
ALTER TABLE IF EXISTS public.classes RENAME TO classes_old;

-- Rename old universities table to universities_old (if it exists)
ALTER TABLE IF EXISTS public.universities RENAME TO universities_old;

-- Rename old countries table to countries_old (if it exists)
ALTER TABLE IF EXISTS public.countries RENAME TO countries_old;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Old tables renamed to *_old';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next: Run create-new-class-system.sql';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- NOW RUN: create-new-class-system.sql
-- THEN RUN: The migration script below
-- =====================================================

