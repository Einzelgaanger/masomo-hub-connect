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
    const { applicationId, decision, adminUserId, rejectionReason } = await req.json()

    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the application details
    const { data: application, error: appError } = await supabaseClient
      .from('applications')
      .select(`
        *,
        classes!inner(
          course_name,
          course_year,
          semester,
          course_group,
          universities!inner(
            name,
            countries!inner(name)
          )
        )
      `)
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      throw new Error('Application not found')
    }

    // Update application status
    const updateData: any = {
      status: decision,
      updated_at: new Date().toISOString()
    }

    if (decision === 'approved') {
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = adminUserId
    } else if (decision === 'rejected') {
      updateData.rejected_at = new Date().toISOString()
      updateData.rejected_by = adminUserId
      updateData.rejection_reason = rejectionReason || 'Application rejected'
    }

    const { error: updateError } = await supabaseClient
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)

    if (updateError) {
      throw new Error(`Failed to update application: ${updateError.message}`)
    }

    // Get user email for notification
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(application.user_id)
    
    if (userError || !userData.user) {
      throw new Error('User not found')
    }

    const userEmail = userData.user.email!
    const userName = application.full_name

    // Send notification email
    const siteUrl = Deno.env.get('SITE_URL') || 'https://bunifu.onrender.com'
    let emailSubject = ''
    let emailHtml = ''

    if (decision === 'approved') {
      emailSubject = '🎉 Application Approved - Welcome to Bunifu!'
      emailHtml = `
        <div style="font-family: 'Fredoka', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
          <div style="text-align: center; margin-bottom: 30px; padding: 30px 20px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <div style="margin-bottom: 20px;">
              <img src="https://bunifu.onrender.com/logo.svg" alt="Bunifu Logo" style="width: 80px; height: 80px; margin-bottom: 15px;">
            </div>
            <h1 style="color: #2563eb; margin: 0; font-size: 32px; font-weight: 700; font-family: 'Fredoka', sans-serif;">Bunifu</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 8px 0 0 0; font-weight: 500; font-family: 'Fredoka', sans-serif;">Where learning meets creativity</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 20px; margin-bottom: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <span style="font-size: 40px;">✅</span>
              </div>
              <h2 style="color: #059669; margin: 0; font-size: 28px; font-weight: 700; font-family: 'Fredoka', sans-serif;">Application Approved!</h2>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
              Hi ${userName}!<br><br>
              Great news! Your application to join <strong>${application.classes.course_name}</strong> has been approved by your administrator.
            </p>
            
            <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #065f46; margin-bottom: 15px; font-size: 18px; font-weight: 600; font-family: 'Fredoka', sans-serif;">📚 Your Class Details</h3>
              <div style="color: #065f46; font-size: 14px;">
                <p style="margin: 5px 0;"><strong>Course:</strong> ${application.classes.course_name}</p>
                <p style="margin: 5px 0;"><strong>Year:</strong> ${application.classes.course_year}</p>
                <p style="margin: 5px 0;"><strong>Semester:</strong> ${application.classes.semester}</p>
                <p style="margin: 5px 0;"><strong>Group:</strong> ${application.classes.course_group}</p>
                <p style="margin: 5px 0;"><strong>University:</strong> ${application.classes.universities.name}</p>
                <p style="margin: 5px 0;"><strong>Country:</strong> ${application.classes.universities.countries.name}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${siteUrl}/login" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-family: 'Fredoka', sans-serif; transition: all 0.3s ease;">
                🚀 Access Your Dashboard
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
              You can now log in with your email and password to access all the learning materials, assignments, and collaborate with your classmates!
            </p>
          </div>
        </div>
      `
    } else {
      emailSubject = 'Application Status Update - Bunifu'
      emailHtml = `
        <div style="font-family: 'Fredoka', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);">
          <div style="text-align: center; margin-bottom: 30px; padding: 30px 20px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <div style="margin-bottom: 20px;">
              <img src="https://bunifu.onrender.com/logo.svg" alt="Bunifu Logo" style="width: 80px; height: 80px; margin-bottom: 15px;">
            </div>
            <h1 style="color: #2563eb; margin: 0; font-size: 32px; font-weight: 700; font-family: 'Fredoka', sans-serif;">Bunifu</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 8px 0 0 0; font-weight: 500; font-family: 'Fredoka', sans-serif;">Where learning meets creativity</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 20px; margin-bottom: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <span style="font-size: 40px;">❌</span>
              </div>
              <h2 style="color: #dc2626; margin: 0; font-size: 28px; font-weight: 700; font-family: 'Fredoka', sans-serif;">Application Not Approved</h2>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
              Hi ${userName},<br><br>
              Thank you for your interest in joining Bunifu. Unfortunately, your application was not approved at this time.
            </p>
            
            ${rejectionReason ? `
            <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #991b1b; margin-bottom: 10px; font-size: 16px; font-weight: 600; font-family: 'Fredoka', sans-serif;">Reason:</h3>
              <p style="color: #991b1b; margin: 0; font-size: 14px;">${rejectionReason}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${siteUrl}/" 
                 style="display: inline-block; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-family: 'Fredoka', sans-serif; transition: all 0.3s ease;">
                🏠 Return to Homepage
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
              If you believe this is an error, please contact your administrator or try applying again with correct information.
            </p>
          </div>
        </div>
      `
    }

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Bunifu <noreply@bunifu.onrender.com>',
            to: [userEmail],
            subject: emailSubject,
            html: emailHtml,
          }),
        })

        const resendData = await resendResponse.json()
        
        if (!resendResponse.ok) {
          console.error('Resend API error:', resendData)
        } else {
          console.log('Application notification email sent successfully:', resendData.id)
        }
      } catch (resendError) {
        console.error('Failed to send notification email:', resendError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Application ${decision} successfully`,
        applicationId: applicationId,
        emailSent: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in approve-application-secure:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error)?.message || 'An unexpected error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
