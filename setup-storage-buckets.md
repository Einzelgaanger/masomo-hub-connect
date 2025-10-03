# Storage Buckets Setup Guide

## The Problem
The error `StorageApiError: Bucket not found` occurs because the required storage buckets don't exist in your Supabase project.

## Solution Options

### Option 1: Run the SQL Script (Recommended)
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `create-storage-buckets.sql`
4. **Run the script** to create the buckets with proper RLS policies

### Option 2: Create Buckets Manually
1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New Bucket"**
3. Create bucket named `ukumbi-images`:
   - **Public**: Yes
   - **File size limit**: 10MB
   - **Allowed MIME types**: image/jpeg, image/png, image/gif, image/webp, image/svg+xml
4. Create bucket named `ukumbi-videos`:
   - **Public**: Yes
   - **File size limit**: 100MB
   - **Allowed MIME types**: video/mp4, video/mpeg, video/quicktime, video/webm, video/x-msvideo

### Option 3: Use Existing Buckets
The app now has **automatic fallback logic** that tries these bucket names in order:
- **For videos**: `ukumbi-videos` → `videos` → `media` → `uploads`
- **For images**: `ukumbi-images` → `images` → `media` → `uploads`

If you have any of these buckets already, the app will use them automatically.

## What's Fixed

✅ **Smart bucket fallback** - tries multiple bucket names automatically
✅ **Better error messages** - shows which buckets were tried
✅ **Global video state** - only one video plays at a time
✅ **Auto-pause on scroll** - videos pause when user scrolls
✅ **Resume from position** - videos resume where they left off
✅ **No more multiple videos** - prevents overlapping audio

## Testing
After setting up the buckets, test by:
1. Uploading an image or video
2. Playing a video
3. Scrolling while video is playing (should pause)
4. Clicking another video (should pause the first one)
5. Clicking the same video again (should resume from where it stopped)

