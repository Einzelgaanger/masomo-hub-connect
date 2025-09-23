-- Create a test user with email and password for testing
-- This will create both an auth user and a profile

DO $$
DECLARE
    class_id_cs_y1_gA uuid;
    test_user_id uuid;
    test_profile_id uuid;
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

    -- Create auth user (only required columns, excluding generated ones)
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
        '00000000-0000-0000-0000-000000000000', -- instance_id
        gen_random_uuid(), -- id
        'authenticated', -- aud
        'authenticated', -- role
        'test@bunifu.com', -- email
        crypt('password123', gen_salt('bf')), -- encrypted_password (password123)
        NOW(), -- email_confirmed_at
        '', -- recovery_token
        '', -- email_change_token_new
        NULL, -- recovery_sent_at
        '', -- email_change
        NULL, -- email_change_sent_at
        NOW(), -- last_sign_in_at
        '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
        '{"full_name":"Test User"}', -- raw_user_meta_data
        FALSE, -- is_super_admin
        NOW(), -- created_at
        NOW(), -- updated_at
        NULL, -- phone
        NULL, -- phone_confirmed_at
        '', -- phone_change
        '', -- phone_change_token
        NULL, -- phone_change_sent_at
        '', -- email_change_token_current
        0, -- email_change_confirm_status
        NULL, -- banned_until
        '', -- reauthentication_token
        NULL, -- reauthentication_sent_at
        FALSE, -- is_sso_user
        NULL -- deleted_at
    )
    RETURNING id INTO test_user_id;

    -- Create or update profile
    INSERT INTO public.profiles (
        id, user_id, full_name, email, admission_number, 
        role, class_id, points, rank, profile_picture_url,
        created_at, updated_at
    ) VALUES (
        gen_random_uuid(), -- id
        test_user_id, -- user_id
        'Test User', -- full_name
        'test@bunifu.com', -- email
        'TEST001', -- admission_number
        'student', -- role
        class_id_cs_y1_gA, -- class_id
        100, -- points
        'silver', -- rank
        NULL, -- profile_picture_url
        NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        admission_number = EXCLUDED.admission_number,
        role = EXCLUDED.role,
        class_id = EXCLUDED.class_id,
        points = EXCLUDED.points,
        rank = EXCLUDED.rank,
        updated_at = NOW()
    RETURNING id INTO test_profile_id;

    RAISE NOTICE 'Test user created successfully!';
    RAISE NOTICE 'Email: test@bunifu.com';
    RAISE NOTICE 'Password: password123';
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE 'Profile ID: %', test_profile_id;
END $$;
