// Test Chat Functionality
// Run this in the browser console to test chat messages

console.log('Testing chat functionality...');

// Test 1: Check if user is authenticated
const testAuth = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    console.log('✅ User authenticated:', user?.id);
    return user;
  } catch (error) {
    console.error('❌ Auth error:', error);
    return null;
  }
};

// Test 2: Check if class_chat_messages table exists
const testTableExists = async () => {
  try {
    const { data, error } = await supabase
      .from('class_chat_messages')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ class_chat_messages table exists');
    return true;
  } catch (error) {
    console.error('❌ Table error:', error);
    return false;
  }
};

// Test 3: Check if user is member of any class
const testClassMembership = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('class_members')
      .select('class_id, classes(name)')
      .eq('user_id', userId);
    
    if (error) throw error;
    console.log('✅ Class memberships:', data);
    return data;
  } catch (error) {
    console.error('❌ Class membership error:', error);
    return [];
  }
};

// Test 4: Try to send a test message
const testSendMessage = async (userId, classId) => {
  try {
    const { data, error } = await supabase
      .from('class_chat_messages')
      .insert({
        class_id: classId,
        sender_id: userId,
        message: 'Test message from console',
        message_type: 'text'
      })
      .select();
    
    if (error) throw error;
    console.log('✅ Test message sent:', data);
    return data;
  } catch (error) {
    console.error('❌ Send message error:', error);
    return null;
  }
};

// Test 5: Check realtime subscription
const testRealtimeSubscription = (classId) => {
  console.log('Setting up realtime test for class:', classId);
  
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
    });
  
  return channel;
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting chat functionality tests...');
  
  // Test 1: Auth
  const user = await testAuth();
  if (!user) return;
  
  // Test 2: Table exists
  const tableExists = await testTableExists();
  if (!tableExists) return;
  
  // Test 3: Class membership
  const memberships = await testClassMembership(user.id);
  if (memberships.length === 0) {
    console.log('⚠️ User is not a member of any class');
    return;
  }
  
  const classId = memberships[0].class_id;
  console.log('Using class:', classId);
  
  // Test 4: Send message
  const messageResult = await testSendMessage(user.id, classId);
  if (!messageResult) return;
  
  // Test 5: Realtime subscription
  const channel = testRealtimeSubscription(classId);
  
  // Clean up after 5 seconds
  setTimeout(() => {
    supabase.removeChannel(channel);
    console.log('🧹 Cleaned up test subscription');
  }, 5000);
  
  console.log('✅ All tests completed!');
};

// Run the tests
runAllTests();
