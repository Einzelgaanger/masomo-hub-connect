// Test Chat in Browser Console
// Copy and paste this into your browser console

console.log('Testing chat functionality...');

// Test 1: Check if table exists
const testTableExists = async () => {
  try {
    const { data, error } = await supabase
      .from('class_chat_messages')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Table does not exist:', error.message);
      return false;
    }
    
    console.log('✅ Table exists and is accessible');
    return true;
  } catch (error) {
    console.log('❌ Table test failed:', error);
    return false;
  }
};

// Test 2: Try to send a test message
const testSendMessage = async () => {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    
    if (!user) {
      console.log('❌ No authenticated user');
      return false;
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // Get a class ID (try to find any class)
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('id')
      .limit(1);
    
    if (classError || !classes || classes.length === 0) {
      console.log('❌ No classes found:', classError?.message);
      return false;
    }
    
    const classId = classes[0].id;
    console.log('✅ Found class:', classId);
    
    // Try to send a message
    const { data, error } = await supabase
      .from('class_chat_messages')
      .insert({
        class_id: classId,
        sender_id: user.id,
        message: 'Test message from browser console',
        message_type: 'text'
      })
      .select();
    
    if (error) {
      console.log('❌ Failed to send message:', error);
      return false;
    }
    
    console.log('✅ Message sent successfully:', data);
    return true;
  } catch (error) {
    console.log('❌ Send message test failed:', error);
    return false;
  }
};

// Test 3: Check realtime subscription
const testRealtimeSubscription = async () => {
  try {
    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .limit(1);
    
    if (!classes || classes.length === 0) {
      console.log('❌ No classes found for realtime test');
      return false;
    }
    
    const classId = classes[0].id;
    console.log('Testing realtime subscription for class:', classId);
    
    const channel = supabase
      .channel(`test-chat-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_chat_messages',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          console.log('✅ Realtime message received:', payload);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription working');
        }
      });
    
    // Clean up after 5 seconds
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log('🧹 Cleaned up realtime subscription');
    }, 5000);
    
    return true;
  } catch (error) {
    console.log('❌ Realtime test failed:', error);
    return false;
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting chat tests...');
  
  const tableExists = await testTableExists();
  if (!tableExists) {
    console.log('❌ Chat table does not exist. Please create it manually in Supabase dashboard.');
    console.log('📋 Manual steps:');
    console.log('1. Go to Supabase Dashboard > Table Editor');
    console.log('2. Create new table: class_chat_messages');
    console.log('3. Add columns: id (uuid), class_id (uuid), sender_id (uuid), message (text), created_at (timestamptz)');
    console.log('4. Enable RLS and create policy: "Allow all operations"');
    return;
  }
  
  const sendWorks = await testSendMessage();
  if (!sendWorks) {
    console.log('❌ Cannot send messages. Check RLS policies.');
    return;
  }
  
  const realtimeWorks = await testRealtimeSubscription();
  if (!realtimeWorks) {
    console.log('❌ Realtime subscription not working. Check WebSocket connection.');
    return;
  }
  
  console.log('✅ All chat tests passed! Chat should be working.');
};

// Run the tests
runAllTests();
