import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { applicationId, action, adminUserId } = await req.json()
    console.log('Received request:', { applicationId, action, adminUserId })

    if (!applicationId || !action || !adminUserId) {
      throw new Error('Missing required parameters: applicationId, action, adminUserId')
    }

    if (action !== 'approve' && action !== 'reject') {
      throw new Error('Action must be either "approve" or "reject"')
    }

    // Get the application details
    const { data: application, error: appError } = await supabaseClient
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      console.error('Application fetch error:', appError)
      throw new Error('Application not found')
    }

    console.log('Found application:', application)

    // Update the application status
    const updateData: any = {
      status: action,
      updated_at: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = adminUserId
    } else {
      updateData.rejected_at = new Date().toISOString()
      updateData.rejected_by = adminUserId
      updateData.rejection_reason = 'Application rejected by admin'
    }

    const { error: updateError } = await supabaseClient
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)

    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error(`Failed to update application: ${updateError.message}`)
    }

    console.log('Application updated successfully')

    // Simple profile creation for approved applications
    if (action === 'approve') {
      try {
        // Get user email from auth.users table
        const { data: authUser } = await supabaseClient.auth.admin.getUserById(application.user_id)
        const userEmail = authUser?.user?.email || ''

        // Insert or update profile
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .upsert({
            user_id: application.user_id,
            full_name: application.full_name,
            email: userEmail,
            admission_number: application.admission_number,
            class_id: application.class_id,
            role: 'student',
            points: 0,
            rank: 'bronze',
            created_from_application: true
          })

        if (profileError) {
          console.error('Profile error (non-blocking):', profileError)
        } else {
          console.log('Profile created/updated successfully')
        }
      } catch (profileError) {
        console.error('Profile creation failed (non-blocking):', profileError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Application ${action}d successfully`,
        application: { ...application, ...updateData }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  
  } catch (error) {
    console.error('Error in approve-application-simple function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})