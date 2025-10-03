-- Create Profile Pictures Storage Bucket
-- This script sets up the storage bucket for profile pictures with proper permissions

-- ==============================================
-- 1. CREATE STORAGE BUCKET
-- ==============================================

-- Create the profile-pictures storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-pictures',
    'profile-pictures',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 2. CREATE STORAGE POLICIES
-- ==============================================

-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to profile pictures
CREATE POLICY "Profile pictures are publicly readable" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-pictures');

-- ==============================================
-- 3. CREATE HELPER FUNCTION FOR PROFILE PICTURE URL
-- ==============================================

CREATE OR REPLACE FUNCTION public.get_profile_picture_url(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    profile_url TEXT;
BEGIN
    -- Get the profile picture URL from the profiles table
    SELECT profile_picture_url INTO profile_url
    FROM public.profiles
    WHERE user_id = user_id_param;
    
    -- If no profile picture, return a default avatar URL
    IF profile_url IS NULL OR profile_url = '' THEN
        RETURN NULL;
    END IF;
    
    RETURN profile_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 4. CREATE FUNCTION TO CLEAN UP OLD PROFILE PICTURES
-- ==============================================

CREATE OR REPLACE FUNCTION public.cleanup_old_profile_pictures()
RETURNS void AS $$
DECLARE
    old_file RECORD;
BEGIN
    -- Find profile pictures that are no longer referenced in profiles table
    FOR old_file IN
        SELECT name, id
        FROM storage.objects
        WHERE bucket_id = 'profile-pictures'
        AND created_at < NOW() - INTERVAL '30 days'
        AND name NOT IN (
            SELECT profile_picture_url
            FROM public.profiles
            WHERE profile_picture_url IS NOT NULL
        )
    LOOP
        -- Delete the old file
        DELETE FROM storage.objects WHERE id = old_file.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 5. CREATE TRIGGER TO UPDATE PROFILE PICTURE URL
-- ==============================================

CREATE OR REPLACE FUNCTION public.handle_profile_picture_upload()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the profile_picture_url when a new file is uploaded
    IF TG_OP = 'INSERT' AND NEW.bucket_id = 'profile-pictures' THEN
        UPDATE public.profiles
        SET profile_picture_url = storage.get_public_url('profile-pictures', NEW.name)
        WHERE user_id = NEW.owner;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS profile_picture_upload_trigger ON storage.objects;
CREATE TRIGGER profile_picture_upload_trigger
    AFTER INSERT ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_picture_upload();

-- ==============================================
-- 6. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '=== PROFILE PICTURES STORAGE SETUP ===';
    RAISE NOTICE 'Storage bucket: profile-pictures created';
    RAISE NOTICE 'Storage policies: configured for user uploads';
    RAISE NOTICE 'Helper functions: created for URL management';
    RAISE NOTICE 'Cleanup function: created for old files';
    RAISE NOTICE 'Profile pictures are ready to use!';
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$;
