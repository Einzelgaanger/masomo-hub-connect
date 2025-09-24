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
    console.log('Function started')
    
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

    console.log('Supabase client created')

    const body = await req.json()
    console.log('Request body:', body)
    
    const { applicationId, action, adminUserId } = body

    if (!applicationId || !action || !adminUserId) {
      throw new Error(`Missing required parameters. Received: applicationId=${applicationId}, action=${action}, adminUserId=${adminUserId}`)
    }

    if (action !== 'approve' && action !== 'reject') {
      throw new Error(`Invalid action: ${action}. Must be 'approve' or 'reject'`)
    }

    console.log('Parameters validated')

    // Get the application details
    const { data: application, error: appError } = await supabaseClient
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError) {
      console.error('Application fetch error:', appError)
      throw new Error(`Application fetch failed: ${appError.message}`)
    }

    if (!application) {
      throw new Error('Application not found')
    }

    console.log('Found application:', application)

    // Update the application status
    const updateData = {
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

    console.log('Updating application with data:', updateData)

    const { error: updateError } = await supabaseClient
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)

    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error(`Failed to update application: ${updateError.message}`)
    }

    console.log('Application updated successfully')

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
    console.error('Error in approve-application-basic function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
