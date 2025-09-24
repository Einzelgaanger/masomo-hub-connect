// Test script to check upload visibility
// Run this in your browser console while logged in

async function testUploadVisibility() {
  console.log('🔍 Testing upload visibility...');
  
  try {
    // Import supabase client (adjust path as needed)
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    
    const supabase = createClient(
      'https://ztxgmqunqsookgpmluyp.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0eGdtcXVucXNvb2tncG1sdXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMTAzODQsImV4cCI6MjA3Mjg4NjM4NH0.DK2oySyoBu29Z-uNsrmhX9VtuADqtjwg2OxBj1jXYas'
    );

    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ User error:', userError);
      return;
    }
    
    console.log('✅ Current user:', user.email);

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ User profile:', profile);
      console.log('📚 Class ID:', profile.class_id);
    }

    // Check uploads
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (uploadsError) {
      console.error('❌ Uploads error:', uploadsError);
      console.log('💡 This suggests RLS policies are blocking access');
    } else {
      console.log('✅ Found uploads:', uploads.length);
      console.log('📄 Uploads:', uploads);
    }

    // Check classes
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*');
    
    if (classesError) {
      console.error('❌ Classes error:', classesError);
    } else {
      console.log('✅ Available classes:', classes.length);
      console.log('🏫 Classes:', classes);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUploadVisibility();
