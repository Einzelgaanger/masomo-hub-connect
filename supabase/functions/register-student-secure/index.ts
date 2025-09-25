import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Secure password generation
function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, fullName, admissionNumber, classId } = await req.json()

    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate secure password
    const generatedPassword = generateSecurePassword(12)

    // Create user account
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: generatedPassword,
      email_confirm: false, // Don't auto-confirm, let them confirm via email
      user_metadata: {
        full_name: fullName,
        admission_number: admissionNumber,
        class_id: classId
      }
    })

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned')
    }

    // Send confirmation email with password
    const siteUrl = Deno.env.get('SITE_URL') || 'https://bunifu.onrender.com'
    const confirmationUrl = `${siteUrl}/application-status?email=${encodeURIComponent(email)}`
    
    const emailSubject = 'Welcome to Bunifu - Your Account is Ready!'
    const emailHtml = `
      <div style="font-family: 'Fredoka', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
        <div style="text-align: center; margin-bottom: 30px; padding: 30px 20px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="margin-bottom: 20px;">
            <img src="https://bunifu.onrender.com/logo.svg" alt="Bunifu Logo" style="width: 80px; height: 80px; margin-bottom: 15px;">
          </div>
          <h1 style="color: #2563eb; margin: 0; font-size: 32px; font-weight: 700; font-family: 'Fredoka', sans-serif;">Bunifu</h1>
          <p style="color: #6b7280; font-size: 18px; margin: 8px 0 0 0; font-weight: 500; font-family: 'Fredoka', sans-serif;">Where learning meets creativity</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 20px; margin-bottom: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.08);">
          <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px; font-weight: 600; font-family: 'Fredoka', sans-serif;">🎓 Welcome to Bunifu!</h2>
          <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
            Hi ${fullName}!<br><br>
            Your account has been created successfully! You can now access the Bunifu platform with the credentials below.
          </p>
          
          <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #374151; margin-bottom: 15px; font-size: 18px; font-weight: 600; font-family: 'Fredoka', sans-serif;">🔐 Your Login Credentials</h3>
            <div style="margin-bottom: 10px;">
              <strong style="color: #374151; font-family: 'Fredoka', sans-serif;">Email:</strong>
              <span style="color: #6b7280; font-family: monospace; margin-left: 8px;">${email}</span>
            </div>
            <div style="margin-bottom: 15px;">
              <strong style="color: #374151; font-family: 'Fredoka', sans-serif;">Password:</strong>
              <span style="color: #6b7280; font-family: monospace; margin-left: 8px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${generatedPassword}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 0; font-style: italic;">
              💡 You can change this password after logging in from the Settings page.
            </p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${siteUrl}/login" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-family: 'Fredoka', sans-serif; transition: all 0.3s ease;">
              🚀 Login to Bunifu
            </a>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
              <strong>⚠️ Important:</strong> Please keep your login credentials secure and do not share them with others.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; background: white; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.08);">
          <p style="color: #6b7280; font-size: 14px; margin: 0; font-family: 'Fredoka', sans-serif;">
            Need help? Contact us at <a href="mailto:support@bunifu.onrender.com" style="color: #3b82f6; text-decoration: none;">support@bunifu.onrender.com</a>
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
            © 2024 Bunifu. All rights reserved.
          </p>
        </div>
      </div>
    `

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
            to: [email],
            subject: emailSubject,
            html: emailHtml,
          }),
        })

        const resendData = await resendResponse.json()
        
        if (!resendResponse.ok) {
          console.error('Resend API error:', resendData)
          throw new Error(`Failed to send email: ${resendData.message || 'Unknown error'}`)
        }

        console.log('Welcome email sent successfully via Resend:', resendData.id)
      } catch (resendError) {
        console.error('Failed to send welcome email via Resend:', resendError)
        // Don't fail the entire process if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Student registered successfully and email sent',
        userId: authData.user.id,
        email: email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in register-student-secure:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
