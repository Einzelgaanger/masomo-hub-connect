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

  console.log('Approve application function called');

  try {
    const body = await req.json();
    console.log('Received request body:', body);
    
    const { applicationId, action, adminUserId } = body;

    if (!applicationId || !action || !adminUserId) {
      console.error('Missing required fields:', { applicationId, action, adminUserId });
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: applicationId, action, adminUserId'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (action !== 'approve' && action !== 'reject') {
      return new Response(JSON.stringify({ 
        error: 'Invalid action. Must be "approve" or "reject"'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

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

    // Get the application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        user_id,
        class_id,
        full_name,
        email,
        admission_number,
        status
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error('Application not found:', appError);
      return new Response(JSON.stringify({ 
        error: 'Application not found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (application.status !== 'pending') {
      return new Response(JSON.stringify({ 
        error: 'Application is not pending'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (action === 'approve') {
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
      console.log('Creating auth user for:', application.email);
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: application.email,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: application.full_name
        }
      });

      if (authError) {
        console.error('Auth user creation failed:', authError);
        return new Response(JSON.stringify({ 
          error: 'Failed to create auth user: ' + authError.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Create profile for the approved student
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          full_name: application.full_name,
          email: application.email,
          admission_number: application.admission_number,
          class_id: application.class_id,
          role: 'student',
          points: 0,
          rank: 'bronze'
        });

      if (profileError) {
        console.error('Profile creation failed:', profileError);
        return new Response(JSON.stringify({ 
          error: 'Failed to create profile: ' + profileError.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Update application status
      const { error: updateError } = await supabaseAdmin
        .from('applications')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: adminUserId
        })
        .eq('id', applicationId);

      if (updateError) {
        console.error('Application update failed:', updateError);
        return new Response(JSON.stringify({ 
          error: 'Failed to update application: ' + updateError.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Send welcome email
      try {
        const { data: emailData, error: emailError } = await supabaseAdmin.functions.invoke('send-email', {
          body: {
            email: application.email,
            type: 'welcome',
            name: application.full_name,
            password: newPassword,
            admissionNumber: application.admission_number
          }
        });

        if (emailError || (emailData && emailData.error)) {
          console.warn('Email sending failed:', emailError || emailData.error);
        }
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Application approved successfully',
        password: newPassword
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (action === 'reject') {
      // Update application status to rejected
      const { error: updateError } = await supabaseAdmin
        .from('applications')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: adminUserId
        })
        .eq('id', applicationId);

      if (updateError) {
        console.error('Application update failed:', updateError);
        return new Response(JSON.stringify({ 
          error: 'Failed to update application: ' + updateError.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Application rejected successfully'
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
