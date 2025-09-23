-- Reset the test user password using Supabase's built-in method
-- This will ensure the password is properly hashed

DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Find the test user
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'test@bunifu.com';

    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Test user not found. Please run verify-test-user.sql first.';
    END IF;

    -- Update the password using the proper Supabase method
    UPDATE auth.users SET
        encrypted_password = crypt('password123', gen_salt('bf')),
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = test_user_id;

    RAISE NOTICE 'Password reset successfully for user: %', test_user_id;
    RAISE NOTICE 'Email: test@bunifu.com';
    RAISE NOTICE 'Password: password123';
    RAISE NOTICE 'User should now be able to login.';
END $$;
