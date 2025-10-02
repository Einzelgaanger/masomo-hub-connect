-- Clean up orphaned class_members records
-- Remove any class_members that reference non-existent classes

-- Delete class_members that reference classes that don't exist
DELETE FROM public.class_members 
WHERE class_id NOT IN (SELECT id FROM public.classes);

-- Delete class_join_requests that reference classes that don't exist
DELETE FROM public.class_join_requests 
WHERE class_id NOT IN (SELECT id FROM public.classes);

-- Delete class_units that reference classes that don't exist
DELETE FROM public.class_units 
WHERE class_id NOT IN (SELECT id FROM public.classes);

-- Delete class_chat_messages that reference classes that don't exist
DELETE FROM public.class_chat_messages 
WHERE class_id NOT IN (SELECT id FROM public.classes);

COMMIT;
