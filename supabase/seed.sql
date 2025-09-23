-- Bunifu Database Seeding Script
-- This script sets up initial data for the platform

-- Insert sample countries
INSERT INTO countries (name) VALUES 
  ('Kenya'),
  ('Uganda'), 
  ('Tanzania'),
  ('Nigeria'),
  ('Ghana'),
  ('South Africa'),
  ('Ethiopia'),
  ('Rwanda')
ON CONFLICT DO NOTHING;

-- Insert sample universities
INSERT INTO universities (country_id, name) 
SELECT c.id, univ.name
FROM countries c
CROSS JOIN (VALUES 
  ('University of Nairobi'),
  ('Kenyatta University'),
  ('Jomo Kenyatta University of Agriculture and Technology'),
  ('Makerere University'),
  ('Kampala International University'),
  ('University of Dar es Salaam'),
  ('Sokoine University of Agriculture'),
  ('University of Lagos'),
  ('Ahmadu Bello University'),
  ('University of Ghana'),
  ('Kwame Nkrumah University of Science and Technology'),
  ('University of Cape Town'),
  ('University of the Witwatersrand'),
  ('Addis Ababa University'),
  ('University of Rwanda')
) AS univ(name)
WHERE c.name = 'Kenya' AND univ.name IN (
  'University of Nairobi', 'Kenyatta University', 'Jomo Kenyatta University of Agriculture and Technology'
)
ON CONFLICT DO NOTHING;

INSERT INTO universities (country_id, name) 
SELECT c.id, univ.name
FROM countries c
CROSS JOIN (VALUES 
  ('Makerere University'),
  ('Kampala International University')
) AS univ(name)
WHERE c.name = 'Uganda'
ON CONFLICT DO NOTHING;

INSERT INTO universities (country_id, name) 
SELECT c.id, univ.name
FROM countries c
CROSS JOIN (VALUES 
  ('University of Dar es Salaam'),
  ('Sokoine University of Agriculture')
) AS univ(name)
WHERE c.name = 'Tanzania'
ON CONFLICT DO NOTHING;

-- Insert sample classes
INSERT INTO classes (university_id, course_name, course_year, semester, course_group)
SELECT u.id, course_info.course_name, course_info.course_year, course_info.semester, course_info.course_group
FROM universities u
CROSS JOIN (VALUES 
  ('Computer Science', 1, 1, 'Group A'),
  ('Computer Science', 1, 1, 'Group B'),
  ('Computer Science', 2, 1, 'Group A'),
  ('Information Technology', 1, 1, 'Group A'),
  ('Business Administration', 1, 1, 'Group A'),
  ('Engineering', 1, 1, 'Group A')
) AS course_info(course_name, course_year, semester, course_group)
WHERE u.name = 'University of Nairobi'
ON CONFLICT DO NOTHING;

-- Insert sample units for Computer Science Year 1
INSERT INTO units (class_id, name, description)
SELECT c.id, unit_info.name, unit_info.description
FROM classes c
CROSS JOIN (VALUES 
  ('Introduction to Programming', 'Basic programming concepts using Python and Java'),
  ('Data Structures and Algorithms', 'Fundamental data structures and algorithmic problem solving'),
  ('Database Systems', 'Introduction to database design and SQL'),
  ('Computer Networks', 'Network protocols and internet technologies'),
  ('Software Engineering', 'Software development methodologies and practices'),
  ('Web Development', 'HTML, CSS, JavaScript and modern web frameworks'),
  ('Operating Systems', 'System software and process management'),
  ('Mathematics for Computing', 'Discrete mathematics and calculus for computer science')
) AS unit_info(name, description)
WHERE c.course_name = 'Computer Science' AND c.course_year = 1 AND c.semester = 1 AND c.course_group = 'Group A'
ON CONFLICT DO NOTHING;

-- Insert sample units for Information Technology Year 1
INSERT INTO units (class_id, name, description)
SELECT c.id, unit_info.name, unit_info.description
FROM classes c
CROSS JOIN (VALUES 
  ('Programming Fundamentals', 'Introduction to programming using various languages'),
  ('Database Management', 'Database design and management systems'),
  ('Network Administration', 'Network setup and administration'),
  ('System Analysis and Design', 'Systems development lifecycle and methodologies'),
  ('IT Project Management', 'Project planning and management in IT'),
  ('Cybersecurity Fundamentals', 'Introduction to information security')
) AS unit_info(name, description)
WHERE c.course_name = 'Information Technology' AND c.course_year = 1 AND c.semester = 1
ON CONFLICT DO NOTHING;

-- Note: Student and lecturer profiles will be created automatically when users register
-- through the application's registration flow. The profiles table requires a valid user_id
-- from the auth.users table, which is created during the registration process.

-- Sample student data for testing registration lookup:
-- Country: Kenya, University: University of Nairobi, Admission: ADM001, Name: John Doe, Email: john.doe@student.nairobi.ac.ke
-- Country: Kenya, University: University of Nairobi, Admission: ADM002, Name: Jane Smith, Email: jane.smith@student.nairobi.ac.ke
-- Country: Kenya, University: University of Nairobi, Admission: ADM003, Name: Mike Johnson, Email: mike.johnson@student.nairobi.ac.ke

-- Sample lecturer data for testing:
-- Country: Kenya, University: University of Nairobi, Admission: LEC001, Name: Dr. Peter Kimani, Email: peter.kimani@nairobi.ac.ke
-- Country: Kenya, University: University of Nairobi, Admission: LEC002, Name: Prof. Mary Wanjiku, Email: mary.wanjiku@nairobi.ac.ke

-- Note: Announcements will be created by admins through the application interface
-- The announcements table requires a valid created_by user_id from the auth.users table

-- Note: Assignments will be created by lecturers through the application interface
-- The assignments table requires a valid created_by user_id from the auth.users table

-- Note: Events will be created by lecturers through the application interface
-- The events table requires a valid created_by user_id from the auth.users table

-- Note: Sample notes and uploads will be created by users through the application interface
-- The uploads table requires a valid uploaded_by user_id from the auth.users table
-- which is created during the registration process.

-- Create storage bucket for uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can view uploads" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'uploads');

CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update the profiles table to set proper timestamps
UPDATE profiles SET created_at = NOW() WHERE created_at IS NULL;
UPDATE profiles SET updated_at = NOW() WHERE updated_at IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_admission_number ON profiles(admission_number);
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON profiles(class_id);
CREATE INDEX IF NOT EXISTS idx_uploads_unit_id ON uploads(unit_id);
CREATE INDEX IF NOT EXISTS idx_assignments_unit_id ON assignments(unit_id);
CREATE INDEX IF NOT EXISTS idx_events_unit_id ON events(unit_id);

COMMIT;
