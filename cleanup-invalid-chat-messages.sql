-- Clean up class_chat_messages with invalid sender_id values
-- Remove messages that reference non-existent users

-- Delete messages with null or invalid sender_id
DELETE FROM public.class_chat_messages 
WHERE sender_id IS NULL 
   OR sender_id NOT IN (SELECT user_id FROM public.profiles);

COMMIT;
