# Deploy Approve Application Edge Function

## Manual Deployment Instructions

Since the Supabase CLI is not installed locally, you need to deploy the Edge Function manually through the Supabase Dashboard:

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **Edge Functions** in the left sidebar

### Step 2: Create New Function
1. Click **"Create a new function"**
2. Name it: `approve-application`
3. Copy the contents from `supabase/functions/approve-application/index.ts`

### Step 3: Deploy
1. Paste the code into the editor
2. Click **"Deploy"**

### Alternative: Use Supabase CLI (if you install it)
```bash
# Install Supabase CLI first
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy approve-application
```

## What the Function Does

The `approve-application` Edge Function:
- Updates application status (approve/reject)
- Creates a profile for approved students
- Links students to their class
- Handles proper error responses

## Testing

After deployment, the admin should be able to:
1. See pending applications in the Applications mini-tab
2. Click "Approve" or "Reject" buttons
3. Applications will be processed successfully
4. Approved students will get access to the dashboard
