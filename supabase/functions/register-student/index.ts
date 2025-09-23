import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  console.log('Register student function called');

  try {
    const body = await req.json();
    console.log('Received request body:', body);
    
    const { email, fullName, admissionNumber, profileId } = body;

    if (!email || !fullName || !admissionNumber || !profileId) {
      console.error('Missing required fields:', { email, fullName, admissionNumber, profileId });
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: email, fullName, admissionNumber, profileId',
        received: { email, fullName, admissionNumber, profileId }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Processing registration for:', { email, fullName, admissionNumber, profileId });

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generate a random password
    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const newPassword = generatePassword();

    // Create auth user
    console.log('Creating auth user for:', email);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: newPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error('Auth user creation failed:', authError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create auth user: ' + authError.message,
        details: authError
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Auth user created successfully:', authData.user.id);

    // Update profile to link with auth user
    console.log('Updating profile:', profileId, 'with user_id:', authData.user.id);
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        user_id: authData.user.id
      })
      .eq('id', profileId);

    if (profileError) {
      console.error('Profile update failed:', profileError);
      return new Response(JSON.stringify({ 
        error: 'Failed to update profile: ' + profileError.message,
        details: profileError
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Profile updated successfully');

    // Send welcome email using the existing send-email function
    try {
      console.log('Sending welcome email to:', email);
      const { data: emailData, error: emailError } = await supabaseAdmin.functions.invoke('send-email', {
        body: {
          email: email,
          type: 'welcome',
          name: fullName,
          password: newPassword,
          admissionNumber: admissionNumber
        }
      });

      if (emailError || (emailData && emailData.error)) {
        console.warn('Email sending failed:', emailError || emailData.error);
        // Don't fail the whole operation if email fails, but log it
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Student registered successfully, but email sending failed',
          password: newPassword,
          emailSent: false
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Student registered successfully and email sent',
        password: newPassword,
        emailSent: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (emailError) {
      console.warn('Email sending failed:', emailError);
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Student registered successfully, but email sending failed',
        password: newPassword,
        emailSent: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error: ' + error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
