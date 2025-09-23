# 🚀 Bunifu - Complete Setup Guide

This guide will help you set up the complete Bunifu platform with database, email functionality, and all features working.

## 📋 Prerequisites

- Node.js (v18 or higher)
- Supabase account
- Modern web browser

## 🔧 Step 1: Database Setup

### 1.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `masomo-hub`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users

### 1.2 Run Database Migrations
1. In your Supabase project dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/20250922165632_8cd135fd-0d07-4715-b949-c1dcd1648f62.sql`
3. Click **Run** to execute the migration
4. Wait for completion (should take 1-2 minutes)

### 1.3 Seed Initial Data
1. In the **SQL Editor**, copy and paste the contents of `supabase/seed.sql`
2. Click **Run** to populate the database with sample data
3. This creates sample countries, universities, classes, and student profiles

## 📧 Step 2: Email System Setup

### 2.1 Deploy Edge Function
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Deploy the email function: `supabase functions deploy send-email`

### 2.2 Configure Environment Variables
1. In Supabase Dashboard, go to **Settings → Edge Functions**
2. Add these environment variables:
   - `SITE_URL`: `http://localhost:8083` (for development)
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### 2.3 Email Service Configuration (Optional)
For production, you'll want to integrate with a real email service:

#### Option A: Resend (Recommended)
1. Sign up at [Resend](https://resend.com)
2. Get your API key
3. Update the Edge Function to use Resend API

#### Option B: SendGrid
1. Sign up at [SendGrid](https://sendgrid.com)
2. Get your API key
3. Update the Edge Function to use SendGrid API

## 🔐 Step 3: Authentication Setup

### 3.1 Configure Auth Settings
1. In Supabase Dashboard, go to **Authentication → Settings**
2. Configure the following:
   - **Site URL**: `http://localhost:8083` (for development)
   - **Redirect URLs**: Add `http://localhost:8083/**`
   - **Email Templates**: Customize if needed

### 3.2 Enable Email Confirmation
1. In **Authentication → Settings**
2. Enable **Enable email confirmations**
3. Set **Confirm email change** to true

## 🚀 Step 4: Run the Application

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:8083`

## 🎯 Step 5: Test the Platform

### 5.1 Admin Access
1. Go to `http://localhost:8083/admin/login`
2. Enter password: `admin123`
3. You'll have access to:
   - Class Management
   - Student Management
   - Content Management

### 5.2 Student Registration Flow
1. Go to `http://localhost:8083/login`
2. Click "Find My Account"
3. Use these sample credentials:
   - **Country**: `Kenya`
   - **University**: `University of Nairobi`
   - **Admission Number**: `ADM001`
4. Confirm your details
5. Check console for email content (in development)
6. Login with the generated credentials

### 5.3 Sample Data Available
The seeded database includes:
- **Countries**: Kenya, Uganda, Tanzania, Nigeria, Ghana, etc.
- **Universities**: University of Nairobi, Makerere University, etc.
- **Classes**: Computer Science, IT, Business Administration
- **Students**: John Doe (ADM001), Jane Smith (ADM002), etc.
- **Lecturers**: Dr. Peter Kimani, Prof. Mary Wanjiku

## 🔧 Step 6: Production Deployment

### 6.1 Build for Production
```bash
npm run build
```

### 6.2 Deploy to Vercel/Netlify
1. Connect your repository to Vercel or Netlify
2. Set environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
3. Deploy

### 6.3 Update Supabase Settings
1. Update **Site URL** in Supabase Auth settings
2. Update **Redirect URLs** with your production domain
3. Configure production email service

## 🎮 Step 7: Platform Features

### Admin Features
- ✅ **Type countries/universities** (no database selection needed)
- ✅ **Create classes** with custom units
- ✅ **Add students** individually or in bulk
- ✅ **Manage content** and announcements
- ✅ **No settings/info tabs** (admin doesn't need them)

### Student Features
- ✅ **Unique registration** with university lookup
- ✅ **Email confirmation** and password generation
- ✅ **Class-specific content** access
- ✅ **Gamification** with points and ranks
- ✅ **Social features** (likes, comments, file sharing)
- ✅ **Assignment tracking** and event calendar
- ✅ **Forgot password** functionality

### Technical Features
- ✅ **Two separate interfaces** (admin vs student)
- ✅ **Email system** with HTML templates
- ✅ **File upload/download** with Supabase storage
- ✅ **Real-time updates** and notifications
- ✅ **Role-based access** control
- ✅ **Database seeding** with sample data

## 🆘 Troubleshooting

### Common Issues

#### 1. Email Not Sending
- Check Edge Function logs in Supabase Dashboard
- Verify environment variables are set
- For production, integrate with real email service

#### 2. Student Lookup Failing
- Ensure database is seeded with sample data
- Check that admission numbers match exactly
- Verify country/university names match seeded data

#### 3. Admin Access Denied
- Clear browser cache and localStorage
- Use password: `admin123`
- Check that admin session is set

#### 4. File Upload Issues
- Verify Supabase storage bucket exists
- Check storage policies are set correctly
- Ensure user has proper permissions

### Getting Help
- Check Supabase Dashboard logs
- Review browser console for errors
- Verify all environment variables are set
- Ensure database migrations completed successfully

## 🎉 Success!

Your Bunifu platform is now fully functional with:
- ✅ Complete admin interface
- ✅ Student registration and authentication
- ✅ Email system for password management
- ✅ Database with sample data
- ✅ File upload and social features
- ✅ Gamification system
- ✅ Two separate interfaces working independently

**Admin Access**: `http://localhost:8083/admin/login` (password: `admin123`)
**Student Registration**: `http://localhost:8083/login`

Happy learning! 🎓✨
