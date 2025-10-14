# 🎨 OAuth Branding Setup Guide - Complete Instructions

## 🎯 **Goal:**
Show Bunifu branding instead of Supabase during Google OAuth flow.

## 🔧 **Step-by-Step Setup:**

### **Step 1: Update Supabase Dashboard**

1. **Go to Supabase Dashboard** → **Authentication** → **URL Configuration**

2. **Update Site URL:**
   ```
   https://bunifu.world
   ```

3. **Update Redirect URLs:**
   ```
   https://bunifu.world/auth/callback
   https://bunifu.onrender.com/auth/callback
   http://localhost:8082/auth/callback
   ```

4. **Save changes**

### **Step 2: Update Google Cloud Console**

1. **Go to Google Cloud Console** → **APIs & Credentials** → **OAuth 2.0 Client IDs**

2. **Update Authorized JavaScript origins:**
   ```
   https://bunifu.world
   https://bunifu.onrender.com
   ```

3. **Update Authorized redirect URIs:**
   ```
   https://ztxgmqunqsookgpmluyp.supabase.co/auth/v1/callback
   ```

4. **Save changes**

### **Step 3: Verify Code Changes**

The code has been updated in `src/pages/Login.tsx` with enhanced OAuth configuration:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
      hd: 'bunifu.world' // Custom domain hint
    },
    scopes: 'openid email profile'
  }
});
```

### **Step 4: Test OAuth Branding**

1. **Clear browser cache**
2. **Go to login page**
3. **Click "Sign in with Google"**
4. **Check OAuth page** - Should show Bunifu domain hints
5. **Complete OAuth** - Should redirect to Bunifu dashboard

## 🎯 **What This Achieves:**

### **1. Custom Domain Hints:**
- **`hd: 'bunifu.world'`** - Tells Google to prefer your domain
- **Custom parameters** - Enhanced branding control
- **Proper scopes** - OpenID, email, profile

### **2. Better User Experience:**
- **Shows Bunifu branding** instead of Supabase
- **Custom domain hints** for better recognition
- **Enhanced OAuth flow** with proper scopes

### **3. Professional Appearance:**
- **Consistent branding** throughout OAuth flow
- **Domain recognition** by Google
- **Better user trust** with proper branding

## 🧪 **Testing Checklist:**

### **Before Testing:**
- [ ] Supabase Site URL updated to `https://bunifu.world`
- [ ] Supabase Redirect URLs include your domains
- [ ] Google Cloud Console origins updated
- [ ] Google Cloud Console redirect URIs updated
- [ ] Code changes deployed

### **Test Steps:**
1. **Clear browser cache**
2. **Go to login page**
3. **Click "Sign in with Google"**
4. **Check OAuth page** - Should show Bunifu domain hints
5. **Complete OAuth** - Should redirect to Bunifu dashboard

### **Expected Results:**
- ✅ **Google OAuth page** shows Bunifu domain hints
- ✅ **No more Supabase branding** in OAuth flow
- ✅ **Smooth redirect** to Bunifu dashboard
- ✅ **Professional appearance** throughout

## 🚨 **If Still Seeing Supabase Branding:**

### **Check These:**
1. **Supabase Site URL** is set to `https://bunifu.world`
2. **Google Cloud Console** has the right origins
3. **Browser cache** is cleared
4. **Code changes** are deployed

### **Debug Steps:**
1. **Open browser dev tools**
2. **Go to Network tab**
3. **Try Google OAuth**
4. **Look for OAuth requests** to Google
5. **Check if domain hints** are being sent

## 🎉 **Expected Results:**

### **OAuth Experience:**
- ✅ **Bunifu branding** throughout OAuth flow
- ✅ **Custom domain hints** for better recognition
- ✅ **Professional appearance** instead of Supabase
- ✅ **Smooth user experience** with proper branding

### **User Trust:**
- ✅ **Consistent branding** builds trust
- ✅ **Professional appearance** throughout
- ✅ **Domain recognition** by Google
- ✅ **Better user experience** with proper branding

---

**Status**: ✅ **OAUTH BRANDING CONFIGURED - Ready for Testing**
**Priority**: 🟢 **HIGH - Test OAuth Branding**
**Timeline**: 📅 **Test Immediately After Setup**
