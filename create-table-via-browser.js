// Create Chat Table via Browser Console
// This script will guide you through creating the table manually

console.log('🔧 Chat Table Creation Guide');
console.log('============================');

console.log('Since SQL scripts are giving snippet errors, follow these manual steps:');
console.log('');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to "Table Editor"');
console.log('3. Click "Create a new table"');
console.log('4. Set table name: class_chat_messages');
console.log('');
console.log('5. Add these columns:');
console.log('   - id (uuid, Primary Key, Default: gen_random_uuid())');
console.log('   - class_id (uuid, Not Null)');
console.log('   - sender_id (uuid, Not Null)');
console.log('   - message (text, Not Null)');
console.log('   - message_type (text, Default: "text")');
console.log('   - file_url (text, Nullable)');
console.log('   - file_name (text, Nullable)');
console.log('   - created_at (timestamptz, Default: now())');
console.log('');
console.log('6. Save the table');
console.log('7. Go to "Authentication" > "Policies"');
console.log('8. Find "class_chat_messages" table');
console.log('9. Click "Enable RLS"');
console.log('10. Create new policy: "Allow all operations" for authenticated users');
console.log('');
console.log('After creating the table, refresh this page and try sending a message!');

// Test if table exists
const testTable = async () => {
  try {
    const { data, error } = await supabase
      .from('class_chat_messages')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Table does not exist yet:', error.message);
      console.log('Please follow the steps above to create the table.');
      return false;
    }
    
    console.log('✅ Table exists and is accessible!');
    console.log('Chat should now work properly.');
    return true;
  } catch (error) {
    console.log('❌ Error testing table:', error);
    return false;
  }
};

// Run the test
testTable();
