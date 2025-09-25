# Google OAuth Setup Instructions

## 🔧 **Fix for Google OAuth Redirect Issue**

The issue you're experiencing is that Google OAuth is not properly handling the callback after authentication. Here's how to fix it:

### **1. Update Supabase Auth Settings**

Go to your **Supabase Dashboard** → **Authentication** → **URL Configuration** and add these URLs:

#### **Site URL:**
```
https://bunifu.onrender.com
```

#### **Redirect URLs:**
```
https://bunifu.onrender.com/auth/callback
http://localhost:8082/auth/callback
http://localhost:3000/auth/callback
```

### **2. Update Google Cloud Console**

Go to your **Google Cloud Console** → **APIs & Credentials** → **OAuth 2.0 Client IDs** and add these redirect URIs:

```
https://ztxgmqunqsookgpmluyp.supabase.co/auth/v1/callback
```

### **3. What I Fixed in the Code**

#### **A. Created AuthCallback Component:**
- **File:** `src/pages/AuthCallback.tsx`
- **Purpose:** Properly handles OAuth callback and redirects users based on their status
- **Logic:** 
  - ✅ Checks if user has existing profile → redirects to dashboard
  - ✅ Checks if user has pending application → redirects to status page
  - ✅ Checks if user has rejected application → allows re-application
  - ✅ New users → redirects to class selection

#### **B. Updated OAuth Redirect:**
- **File:** `src/pages/Login.tsx`
- **Changed:** `redirectTo: '/class-selection'` → `redirectTo: '/auth/callback'`
- **Reason:** Proper callback handling before routing

#### **C. Enhanced ClassSelection:**
- **File:** `src/pages/ClassSelection.tsx`
- **Added:** `checkUserProfile()` function
- **Purpose:** Prevents already-registered users from re-applying

#### **D. Added Route:**
- **File:** `src/App.tsx`
- **Added:** `<Route path="/auth/callback" element={<AuthCallback />} />`

### **4. How It Works Now**

#### **New User Flow:**
1. **User clicks "Sign in with Google"**
2. **Google OAuth redirects to:** `https://bunifu.onrender.com/auth/callback`
3. **AuthCallback component:**
   - ✅ Checks user status
   - ✅ Redirects to appropriate page based on status
4. **New users go to:** `/class-selection`
5. **Existing users go to:** `/dashboard`
6. **Pending users go to:** `/application-status`

#### **Existing User Flow:**
1. **User clicks "Sign in with Google"**
2. **AuthCallback detects existing profile**
3. **Direct redirect to:** `/dashboard`

### **5. Testing the Fix**

#### **Test Steps:**
1. **Clear browser cache/cookies**
2. **Try Google OAuth login**
3. **Should redirect to:** `/auth/callback` (briefly)
4. **Then redirect to appropriate page based on status**

#### **Expected Results:**
- ✅ **New users:** Go to class selection page
- ✅ **Existing users:** Go directly to dashboard
- ✅ **Pending users:** Go to application status page
- ✅ **No more "tokenized" redirects to login page**

### **6. If Still Having Issues**

#### **Check These:**
1. **Supabase redirect URLs** are correctly set
2. **Google Cloud Console** has the right callback URL
3. **Browser cache** is cleared
4. **Network tab** shows successful OAuth callback

#### **Debug Steps:**
1. **Open browser dev tools**
2. **Go to Network tab**
3. **Try Google OAuth**
4. **Look for:** `/auth/callback` request
5. **Check response** for any errors

### **7. Environment Variables**

Make sure these are set in your deployment:

```bash
SUPABASE_URL=https://ztxgmqunqsookgpmluyp.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SITE_URL=https://bunifu.onrender.com
```

## 🚀 **The Fix Should Work Now!**

The OAuth flow is now properly handled with:
- ✅ **Proper callback routing**
- ✅ **User status detection**
- ✅ **Smart redirects based on user state**
- ✅ **No more login page loops**

Try it now and let me know if the Google OAuth works correctly! 🎉
