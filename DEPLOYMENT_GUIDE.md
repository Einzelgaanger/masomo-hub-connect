# 🚀 Production Deployment Guide

## Step 1: Deploy Edge Functions

### Deploy the register-student function:
```bash
supabase functions deploy register-student
```

### Deploy the send-email function (if not already deployed):
```bash
supabase functions deploy send-email
```

## Step 2: Set Up Email Service

### Option A: Using Resend (Recommended)
1. Go to [Resend.com](https://resend.com) and create an account
2. Get your API key from the dashboard
3. In your Supabase project, go to **Settings > Edge Functions > Secrets**
4. Add this secret:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key

### Option B: Using SendGrid
1. Go to [SendGrid.com](https://sendgrid.com) and create an account
2. Get your API key
3. In Supabase, add this secret:
   - **Name**: `SENDGRID_API_KEY`
   - **Value**: Your SendGrid API key

## Step 3: Set Environment Variables

In your Supabase project **Settings > Edge Functions > Secrets**, add:

1. **SITE_URL**: Your production domain (e.g., `https://yourdomain.com`)
2. **RESEND_API_KEY**: Your email service API key
3. **SUPABASE_URL**: Your Supabase project URL
4. **SUPABASE_SERVICE_ROLE_KEY**: Your service role key (from Settings > API)

## Step 4: Test the Email Function

### Test the send-email function:
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "template": "welcome",
    "context": {
      "fullName": "Test User",
      "password": "test123",
      "loginUrl": "https://yourdomain.com/login",
      "admissionNumber": "ADM001"
    }
  }'
```

## Step 5: Test the Full Flow

1. Go to your production site
2. Try the student registration flow:
   - Enter: Kenya, University of Nairobi, ADM001
   - Click "Confirm Account"
   - Check your email for the password

## Troubleshooting

### If emails don't send:
1. Check the Edge Function logs in Supabase dashboard
2. Verify your email service API key is correct
3. Check if your domain is verified with the email service
4. Test the send-email function directly

### If Edge Function fails:
1. Check the function logs
2. Verify all environment variables are set
3. Make sure the service role key has proper permissions

## Production Checklist

- [ ] Edge functions deployed
- [ ] Email service API key configured
- [ ] Environment variables set
- [ ] Email function tested
- [ ] Full registration flow tested
- [ ] Domain verified with email service (if required)

## Email Templates

The system uses these email templates:

### Welcome Template:
- **Subject**: "Bunifu - Your Account Credentials"
- **Content**: Includes full name, password, login URL, and admission number

### Password Reset Template:
- **Subject**: "Password Reset for Bunifu"
- **Content**: Includes reset link

You can customize these templates in the `send-email` function.
