-- =====================================================
-- SAFE MIGRATION SCRIPT
-- This version makes NO assumptions about old table structure
-- =====================================================

DO $$
DECLARE
  v_class_id_exists BOOLEAN;
  v_old_class RECORD;
  v_new_class_id UUID;
  v_share_code TEXT;
  v_creator_id UUID;
  v_migrated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SAFE MIGRATION SCRIPT STARTING';
  RAISE NOTICE '========================================';
  
  -- Step 1: Check if profiles has class_id column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'class_id'
  ) INTO v_class_id_exists;
  
  IF NOT v_class_id_exists THEN
    RAISE NOTICE '⚠️  No class_id column found in profiles table.';
    RAISE NOTICE 'ℹ️  This is a FRESH installation - no migration needed!';
    RAISE NOTICE 'ℹ️  Users will create classes from scratch using the new system.';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Found class_id column in profiles. Checking for data...';
  
  -- Step 2: Check if any users have class_id set
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE class_id IS NOT NULL LIMIT 1) THEN
    RAISE NOTICE '⚠️  No users are currently assigned to any classes.';
    RAISE NOTICE 'ℹ️  Nothing to migrate. Users will join classes using the new system.';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Found users with class assignments. Starting migration...';
  
  -- Step 3: Migrate each unique class_id from profiles
  -- We don't care about the old classes table structure anymore
  FOR v_old_class IN 
    SELECT DISTINCT 
      p.class_id as old_class_id,
      COUNT(*) as member_count,
      MIN(p.created_at) as first_joined,
      (SELECT user_id FROM public.profiles 
       WHERE class_id = p.class_id 
       ORDER BY created_at ASC 
       LIMIT 1) as first_user_id
    FROM public.profiles p
    WHERE p.class_id IS NOT NULL
    GROUP BY p.class_id
  LOOP
    v_creator_id := v_old_class.first_user_id;
    
    IF v_creator_id IS NULL THEN
      RAISE NOTICE 'Skipping class % (no users found)', v_old_class.old_class_id;
      CONTINUE;
    END IF;
    
    -- Create new class with generic name
    INSERT INTO public.classes (
      name, 
      description, 
      creator_id, 
      is_searchable
    )
    VALUES (
      'Class ' || (v_migrated_count + 1),
      format('Migrated from old system. %s members. Created: %s', 
             v_old_class.member_count,
             to_char(v_old_class.first_joined, 'YYYY-MM-DD')),
      v_creator_id,
      true
    )
    RETURNING id, share_code INTO v_new_class_id, v_share_code;
    
    v_migrated_count := v_migrated_count + 1;
    
    RAISE NOTICE '✅ Created class: "Class %" (Share Code: %, Members: %)', 
                 v_migrated_count,
                 v_share_code,
                 v_old_class.member_count;
    
    -- Migrate units if they exist
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'units'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'units' 
      AND column_name = 'class_id'
    ) THEN
      -- Create class_units from old units
      INSERT INTO public.class_units (class_id, name, description, unit_order)
      SELECT 
        v_new_class_id,
        COALESCE(u.name, 'Unit ' || ROW_NUMBER() OVER (ORDER BY COALESCE(u.created_at, NOW()))),
        u.description,
        ROW_NUMBER() OVER (ORDER BY COALESCE(u.created_at, NOW())) - 1
      FROM public.units u
      WHERE u.class_id = v_old_class.old_class_id;
      
      
      -- Link old units to new class_units (only if class_unit_id column exists)
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'units' 
        AND column_name = 'class_unit_id'
      ) THEN
        UPDATE public.units u
        SET class_unit_id = cu.id
        FROM public.class_units cu
        WHERE u.class_id = v_old_class.old_class_id
          AND cu.class_id = v_new_class_id
          AND cu.name = u.name;
      END IF;
        
      RAISE NOTICE '   ├─ Migrated units';
    END IF;
    
    -- Migrate all members
    INSERT INTO public.class_members (class_id, user_id, role, joined_at)
    SELECT 
      v_new_class_id,
      p.user_id,
      CASE 
        WHEN p.user_id = v_creator_id THEN 'creator'
        ELSE 'member'
      END,
      COALESCE(p.created_at, NOW())
    FROM public.profiles p
    WHERE p.class_id = v_old_class.old_class_id
    ON CONFLICT (class_id, user_id) DO NOTHING;
    
    RAISE NOTICE '   ├─ Migrated % members', v_old_class.member_count;
    
    -- Update uploads if the column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'uploads' 
      AND column_name = 'class_id'
    ) THEN
      UPDATE public.uploads
      SET class_id = v_new_class_id
      WHERE unit_id IN (
        SELECT id FROM public.units WHERE class_id = v_old_class.old_class_id
      );
      
      RAISE NOTICE '   └─ Linked uploads to new class';
    END IF;
    
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Total classes migrated: %', v_migrated_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Class creators should rename their classes';
  RAISE NOTICE '2. Class creators should update class descriptions';
  RAISE NOTICE '3. Class creators can share their class codes';
  RAISE NOTICE '4. Users should update their profile info';
  RAISE NOTICE '========================================';
  
END $$;

-- =====================================================
-- CREATE SAMPLE DATA (Countries & Universities)
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CREATING SAMPLE DATA';
  RAISE NOTICE '========================================';
END $$;

-- Insert sample countries
INSERT INTO public.countries (name, code) VALUES
  ('Kenya', 'KE'),
  ('United States', 'US'),
  ('United Kingdom', 'GB'),
  ('Canada', 'CA'),
  ('Australia', 'AU'),
  ('South Africa', 'ZA'),
  ('Nigeria', 'NG'),
  ('Ghana', 'GH'),
  ('India', 'IN'),
  ('China', 'CN')
ON CONFLICT (name) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE '✅ Created sample countries';
END $$;

-- Insert sample universities for Kenya
DO $$
DECLARE
  v_kenya_id UUID;
  v_us_id UUID;
  v_uk_id UUID;
BEGIN
  SELECT id INTO v_kenya_id FROM public.countries WHERE code = 'KE';
  SELECT id INTO v_us_id FROM public.countries WHERE code = 'US';
  SELECT id INTO v_uk_id FROM public.countries WHERE code = 'GB';
  
  -- Kenyan Universities
  INSERT INTO public.universities (name, country_id, description) VALUES
    ('University of Nairobi', v_kenya_id, 'Premier university in Kenya'),
    ('Kenyatta University', v_kenya_id, 'Leading teacher training university'),
    ('Moi University', v_kenya_id, 'Public university in Eldoret'),
    ('Jomo Kenyatta University of Agriculture and Technology', v_kenya_id, 'JKUAT - Technology focused'),
    ('Strathmore University', v_kenya_id, 'Private university in Nairobi'),
    ('United States International University', v_kenya_id, 'USIU-Africa'),
    ('Egerton University', v_kenya_id, 'Agricultural university'),
    ('Technical University of Kenya', v_kenya_id, 'TUK - Engineering focus'),
    ('Multimedia University of Kenya', v_kenya_id, 'Technology and multimedia'),
    ('Daystar University', v_kenya_id, 'Christian liberal arts university')
  ON CONFLICT (name, country_id) DO NOTHING;
  
  -- US Universities (Sample)
  INSERT INTO public.universities (name, country_id, description) VALUES
    ('Harvard University', v_us_id, 'Ivy League research university'),
    ('Stanford University', v_us_id, 'Private research university in California'),
    ('MIT', v_us_id, 'Massachusetts Institute of Technology'),
    ('Yale University', v_us_id, 'Ivy League university in Connecticut')
  ON CONFLICT (name, country_id) DO NOTHING;
  
  -- UK Universities (Sample)
  INSERT INTO public.universities (name, country_id, description) VALUES
    ('University of Oxford', v_uk_id, 'Oldest university in the English-speaking world'),
    ('University of Cambridge', v_uk_id, 'Collegiate research university'),
    ('Imperial College London', v_uk_id, 'Science, engineering, medicine and business'),
    ('London School of Economics', v_uk_id, 'LSE - Social sciences specialist')
  ON CONFLICT (name, country_id) DO NOTHING;
  
  RAISE NOTICE '✅ Created sample universities';
END $$;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

DO $$
DECLARE
  v_country_count INTEGER;
  v_university_count INTEGER;
  v_class_count INTEGER;
  v_member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_country_count FROM public.countries;
  SELECT COUNT(*) INTO v_university_count FROM public.universities;
  SELECT COUNT(*) INTO v_class_count FROM public.classes;
  SELECT COUNT(*) INTO v_member_count FROM public.class_members;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL DATABASE STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Countries: %', v_country_count;
  RAISE NOTICE 'Universities: %', v_university_count;
  RAISE NOTICE 'Classes: %', v_class_count;
  RAISE NOTICE 'Class Members: %', v_member_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
END $$;

