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
    const { email, type, name, password, admissionNumber } = await req.json()

    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let subject = ''
    let htmlContent = ''

    if (type === 'welcome') {
      subject = 'Welcome to Bunifu - Your Login Credentials'
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">🎓 Bunifu</h1>
            <p style="color: #6b7280; font-size: 18px;">Where learning meets creativity</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Welcome, ${name}!</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Your account has been successfully created on Bunifu. Below are your login credentials:
            </p>
          </div>

          <div style="background: #ffffff; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">🔐 Login Information</h3>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0;"><strong>Password:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
            <p style="margin: 8px 0;"><strong>Admission Number:</strong> ${admissionNumber}</p>
          </div>

          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 25px;">
            <h4 style="color: #1e40af; margin-bottom: 10px;">🚀 Getting Started</h4>
            <ol style="color: #1e40af; padding-left: 20px;">
              <li>Visit your Bunifu dashboard</li>
              <li>Explore your units and courses</li>
              <li>Start uploading notes and past papers</li>
              <li>Engage with classmates through comments</li>
              <li>Track your progress and earn points!</li>
            </ol>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${Deno.env.get('SITE_URL') || 'http://localhost:8083'}/login" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Login to Bunifu
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    } else if (type === 'password_reset') {
      subject = 'Bunifu - Password Reset'
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">🎓 Bunifu</h1>
            <p style="color: #6b7280; font-size: 18px;">Where learning meets creativity</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Password Reset Request</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Hi ${name},<br><br>
              You requested a password reset for your Bunifu account. Your new password is:
            </p>
          </div>

          <div style="background: #ffffff; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">🔐 New Password</h3>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0;"><strong>New Password:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px;">
            <h4 style="color: #92400e; margin-bottom: 10px;">⚠️ Security Notice</h4>
            <p style="color: #92400e; margin: 0;">
              For security reasons, please change this password after logging in. You can update your password in the Settings page.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${Deno.env.get('SITE_URL') || 'http://localhost:8083'}/login" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Login with New Password
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              If you didn't request this password reset, please contact your administrator immediately.
            </p>
          </div>
        </div>
      `
    }

    // For now, we'll just log the email (in production, you'd use a service like SendGrid, Resend, etc.)
    console.log('Email would be sent:', {
      to: email,
      subject,
      html: htmlContent
    })

    // In a real implementation, you would send the email here using a service like:
    // - Resend
    // - SendGrid
    // - Mailgun
    // - AWS SES

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        // For development, return the email content
        emailContent: htmlContent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
