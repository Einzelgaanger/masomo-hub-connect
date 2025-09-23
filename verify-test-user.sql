-- Verify and fix the test user
-- This script checks if the test user exists and fixes any issues

DO $$
DECLARE
    test_user_id uuid;
    test_profile_id uuid;
    class_id_cs_y1_gA uuid;
BEGIN
    -- Get the class_id for 'Computer Science', Year 1, Semester 1, Group A at University of Nairobi
    SELECT c.id INTO class_id_cs_y1_gA
    FROM public.classes c
    JOIN public.universities u ON c.university_id = u.id
    JOIN public.countries co ON u.country_id = co.id
    WHERE c.course_name = 'Computer Science'
      AND c.course_year = 1
      AND c.semester = 1
      AND c.course_group = 'Group A'
      AND u.name = 'University of Nairobi'
      AND co.name = 'Kenya';

    IF class_id_cs_y1_gA IS NULL THEN
        RAISE EXCEPTION 'Required class (Computer Science, Year 1, Group A, UoN, Kenya) not found. Please create it first via admin panel or seed.sql.';
    END IF;

    -- Check if test user exists in auth.users
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'test@bunifu.com';

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Test user not found in auth.users. Creating new user...';
        
        -- Create new auth user
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_token, email_change_token_new, 
            recovery_sent_at, email_change, email_change_sent_at, 
            last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
            is_super_admin, created_at, updated_at, phone, 
            phone_confirmed_at, phone_change, phone_change_token, 
            phone_change_sent_at, email_change_token_current, 
            email_change_confirm_status, banned_until, reauthentication_token, 
            reauthentication_sent_at, is_sso_user, deleted_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'test@bunifu.com',
            crypt('password123', gen_salt('bf')),
            NOW(),
            '', '', NULL, '', NULL, NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Test User"}',
            FALSE, NOW(), NOW(), NULL, NULL, '', '', NULL,
            '', 0, NULL, '', NULL, FALSE, NULL
        )
        RETURNING id INTO test_user_id;
        
        RAISE NOTICE 'New test user created with ID: %', test_user_id;
    ELSE
        RAISE NOTICE 'Test user found with ID: %', test_user_id;
    END IF;

    -- Check if profile exists
    SELECT id INTO test_profile_id
    FROM public.profiles
    WHERE user_id = test_user_id;

    IF test_profile_id IS NULL THEN
        RAISE NOTICE 'Profile not found. Creating new profile...';
        
        INSERT INTO public.profiles (
            id, user_id, full_name, email, admission_number, 
            role, class_id, points, rank, profile_picture_url,
            created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            test_user_id,
            'Test User',
            'test@bunifu.com',
            'TEST001',
            'student',
            class_id_cs_y1_gA,
            100,
            'silver',
            NULL,
            NOW(), NOW()
        )
        RETURNING id INTO test_profile_id;
        
        RAISE NOTICE 'New profile created with ID: %', test_profile_id;
    ELSE
        RAISE NOTICE 'Profile found with ID: %', test_profile_id;
        
        -- Update existing profile to ensure it's correct
        UPDATE public.profiles SET
            full_name = 'Test User',
            email = 'test@bunifu.com',
            admission_number = 'TEST001',
            role = 'student',
            class_id = class_id_cs_y1_gA,
            points = 100,
            rank = 'silver',
            updated_at = NOW()
        WHERE id = test_profile_id;
        
        RAISE NOTICE 'Profile updated successfully';
    END IF;

    RAISE NOTICE 'Test user verification complete!';
    RAISE NOTICE 'Email: test@bunifu.com';
    RAISE NOTICE 'Password: password123';
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE 'Profile ID: %', test_profile_id;
END $$;
