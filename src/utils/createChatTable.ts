// Create Chat Table Utility
// This can be run from the frontend to create the chat table

import { supabase } from '@/integrations/supabase/client';

export const createChatTable = async () => {
  try {
    console.log('Creating class_chat_messages table...');
    
    // Try to create the table using a simple query
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.class_chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          class_id UUID NOT NULL,
          sender_id UUID NOT NULL,
          message TEXT NOT NULL,
          message_type TEXT DEFAULT 'text',
          file_url TEXT,
          file_name TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error) {
      console.error('Error creating table:', error);
      return false;
    }
    
    console.log('Table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating table:', error);
    return false;
  }
};

// Alternative: Test if table exists
export const testChatTable = async () => {
  try {
    const { data, error } = await supabase
      .from('class_chat_messages')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('Table does not exist:', error.message);
      return false;
    }
    
    console.log('Table exists and is accessible');
    return true;
  } catch (error) {
    console.log('Table test failed:', error);
    return false;
  }
};

// Run this in browser console to test
export const runChatTableTest = async () => {
  console.log('Testing chat table...');
  
  const exists = await testChatTable();
  if (!exists) {
    console.log('Table does not exist, attempting to create...');
    const created = await createChatTable();
    if (created) {
      console.log('Table created successfully!');
    } else {
      console.log('Failed to create table. Please create manually.');
    }
  } else {
    console.log('Table exists and is working!');
  }
};
