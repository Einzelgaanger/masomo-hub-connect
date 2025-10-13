# 📋 Complete Mobile App Build Plan

## 🎯 Goal
Build a FULL-FEATURED cross-platform app (Web + iOS + Android) with ALL functionality from the web version.

---

## 📁 Files to Create/Edit

### ✅ COMPLETED
1. ✅ `app/(tabs)/dashboard.tsx` - Full dashboard with real data (450+ lines)

---

## 🔧 PHASE 1: Core Screens (Main Tabs)

### 2. `app/(tabs)/masomo.tsx` - Learning Management
**Current**: 150 lines (basic)
**Target**: 600+ lines (full features)

**Features to Add**:
- ✅ Fetch classes from Supabase
- ✅ Search functionality with debounce
- ✅ Filter by year/semester/course
- ✅ Class cards with course info
- ✅ Navigation to class details
- ✅ Loading states
- ✅ Empty states
- ✅ Pull to refresh

---

### 3. `app/(tabs)/ukumbi.tsx` - Chat Rooms
**Current**: 120 lines (basic)
**Target**: 700+ lines (full features)

**Features to Add**:
- ✅ Fetch chat rooms from Supabase
- ✅ Real-time message updates (Supabase Realtime)
- ✅ Unread message count
- ✅ Online member count
- ✅ Last message preview
- ✅ Navigate to chat room
- ✅ Create new room (admin)
- ✅ Join/leave rooms

---

### 4. `app/(tabs)/inbox.tsx` - Direct Messages
**Current**: 130 lines (basic)
**Target**: 500+ lines (full features)

**Features to Add**:
- ✅ Fetch conversations from Supabase
- ✅ Real-time message updates
- ✅ Unread indicators
- ✅ Last message preview
- ✅ Timestamps (relative)
- ✅ Navigate to conversation
- ✅ Search users
- ✅ Start new conversation

---

### 5. `app/(tabs)/more.tsx` - Settings & Navigation
**Current**: 180 lines (basic)
**Target**: 400+ lines (full features)

**Features to Add**:
- ✅ User profile display
- ✅ Navigation to all features
- ✅ Settings menu
- ✅ Theme toggle (light/dark)
- ✅ Language selection
- ✅ Notification settings
- ✅ Privacy settings
- ✅ Sign out confirmation

---

## 🔧 PHASE 2: Detail Screens

### 6. `app/class/[id].tsx` - Class Details (NEW FILE)
**Target**: 500+ lines

**Features**:
- ✅ Class information
- ✅ Tabs: Notes, Past Papers, Assignments, Events
- ✅ File upload
- ✅ File download
- ✅ Like/unlike files
- ✅ Comment on files
- ✅ Mark assignments complete

---

### 7. `app/chat/[id].tsx` - Chat Room Screen (NEW FILE)
**Target**: 600+ lines

**Features**:
- ✅ Real-time messaging
- ✅ Message input
- ✅ Send messages
- ✅ File attachments
- ✅ Emoji picker
- ✅ Message timestamps
- ✅ Scroll to bottom
- ✅ Load more messages

---

### 8. `app/conversation/[id].tsx` - Direct Message Screen (NEW FILE)
**Target**: 550+ lines

**Features**:
- ✅ Real-time 1-on-1 chat
- ✅ Message input
- ✅ Send messages
- ✅ Read receipts
- ✅ Typing indicators
- ✅ Media sharing
- ✅ Message history

---

### 9. `app/profile/[id].tsx` - User Profile (NEW FILE)
**Target**: 400+ lines

**Features**:
- ✅ User information
- ✅ Points and rank
- ✅ Character display
- ✅ Recent uploads
- ✅ Achievements
- ✅ Follow/unfollow
- ✅ Send message button

---

## 🔧 PHASE 3: Additional Features

### 10. `app/events/index.tsx` - Events List (NEW FILE)
**Target**: 350+ lines

**Features**:
- ✅ Upcoming events
- ✅ Past events
- ✅ Event details
- ✅ RSVP functionality
- ✅ Calendar view
- ✅ Filter by type

---

### 11. `app/events/[id].tsx` - Event Details (NEW FILE)
**Target**: 300+ lines

**Features**:
- ✅ Event information
- ✅ Date, time, venue
- ✅ Description
- ✅ Attendees list
- ✅ RSVP button
- ✅ Share event

---

### 12. `app/jobs/index.tsx` - Jobs List (NEW FILE)
**Target**: 400+ lines

**Features**:
- ✅ Job listings
- ✅ Search jobs
- ✅ Filter by location/type
- ✅ Job cards
- ✅ Apply button
- ✅ Save jobs

---

### 13. `app/jobs/[id].tsx` - Job Details (NEW FILE)
**Target**: 350+ lines

**Features**:
- ✅ Job description
- ✅ Requirements
- ✅ Company info
- ✅ Salary range
- ✅ Apply button
- ✅ Share job

---

### 14. `app/achievements/index.tsx` - Achievements (Sifa) (NEW FILE)
**Target**: 500+ lines

**Features**:
- ✅ Achievement feed
- ✅ Create achievement
- ✅ Upload media
- ✅ Like/unlike
- ✅ Comment
- ✅ Share achievement
- ✅ Filter by user

---

### 15. `app/alumni/index.tsx` - Alumni Network (NEW FILE)
**Target**: 350+ lines

**Features**:
- ✅ Alumni directory
- ✅ Search alumni
- ✅ Filter by year/course
- ✅ Connect with alumni
- ✅ Alumni events
- ✅ Success stories

---

## 🔧 PHASE 4: Components

### 16. `src/components/FileUpload.tsx` (NEW FILE)
**Target**: 200+ lines

**Features**:
- ✅ Pick from gallery
- ✅ Take photo
- ✅ Upload to Supabase Storage
- ✅ Progress indicator
- ✅ File type validation
- ✅ Size limit check

---

### 17. `src/components/MessageInput.tsx` (NEW FILE)
**Target**: 150+ lines

**Features**:
- ✅ Text input
- ✅ Send button
- ✅ Emoji picker
- ✅ Attach file
- ✅ Character count
- ✅ Auto-resize

---

### 18. `src/components/SearchBar.tsx` (NEW FILE)
**Target**: 100+ lines

**Features**:
- ✅ Search input
- ✅ Debounced search
- ✅ Clear button
- ✅ Loading indicator
- ✅ Search suggestions

---

### 19. `src/components/FilePreview.tsx` (NEW FILE)
**Target**: 150+ lines

**Features**:
- ✅ Image preview
- ✅ PDF preview
- ✅ Video preview
- ✅ Download button
- ✅ Share button
- ✅ Full screen view

---

### 20. `src/components/CommentSection.tsx` (NEW FILE)
**Target**: 250+ lines

**Features**:
- ✅ Comment list
- ✅ Add comment
- ✅ Delete comment
- ✅ Like comment
- ✅ Reply to comment
- ✅ Load more

---

## 🔧 PHASE 5: Utilities & Hooks

### 21. `src/hooks/useRealtime.tsx` (NEW FILE)
**Target**: 100+ lines

**Features**:
- ✅ Subscribe to table changes
- ✅ Real-time updates
- ✅ Cleanup on unmount
- ✅ Error handling

---

### 22. `src/hooks/useUpload.tsx` (NEW FILE)
**Target**: 150+ lines

**Features**:
- ✅ Upload file to Supabase
- ✅ Progress tracking
- ✅ Cancel upload
- ✅ Error handling
- ✅ Success callback

---

### 23. `src/utils/notifications.ts` (NEW FILE)
**Target**: 100+ lines

**Features**:
- ✅ Request permissions
- ✅ Schedule notification
- ✅ Handle notification tap
- ✅ Badge count

---

### 24. `src/utils/camera.ts` (NEW FILE)
**Target**: 80+ lines

**Features**:
- ✅ Request camera permission
- ✅ Take photo
- ✅ Pick from gallery
- ✅ Compress image

---

## 🔧 PHASE 6: Authentication Screens

### 25. `app/(auth)/login.tsx` - ENHANCE
**Current**: 150 lines
**Target**: 250+ lines

**Add**:
- ✅ Remember me
- ✅ Biometric login option
- ✅ Better error messages
- ✅ Loading states
- ✅ Forgot password link

---

### 26. `app/(auth)/register.tsx` - ENHANCE
**Current**: 180 lines
**Target**: 350+ lines

**Add**:
- ✅ Form validation
- ✅ Password strength meter
- ✅ Terms & conditions
- ✅ Profile picture upload
- ✅ University selection dropdown

---

### 27. `app/(auth)/forgot-password.tsx` (NEW FILE)
**Target**: 200+ lines

**Features**:
- ✅ Email input
- ✅ Send reset link
- ✅ Success message
- ✅ Resend option

---

## 📊 SUMMARY

### Total Files to Create/Edit: 27

#### By Category:
- **Main Tabs**: 5 files (1 done, 4 to edit)
- **Detail Screens**: 4 files (all new)
- **Feature Screens**: 6 files (all new)
- **Components**: 5 files (all new)
- **Utilities/Hooks**: 4 files (all new)
- **Auth Screens**: 3 files (2 edit, 1 new)

#### By Status:
- ✅ **Completed**: 1 file (dashboard)
- 🔧 **To Edit**: 6 files
- ✨ **To Create**: 20 files

#### Lines of Code:
- **Current**: ~1,000 lines
- **Target**: ~10,000+ lines
- **Increase**: 10x more code!

---

## ⏱️ Estimated Time

### Per File Average: 5-10 minutes
- Simple components: 5 min
- Complex screens: 10 min
- Total: ~3-4 hours for complete build

### Breakdown:
- **Phase 1** (Main Tabs): 30 min
- **Phase 2** (Detail Screens): 40 min
- **Phase 3** (Features): 60 min
- **Phase 4** (Components): 40 min
- **Phase 5** (Utilities): 30 min
- **Phase 6** (Auth): 20 min

**Total**: ~3.5 hours

---

## 🎯 Build Order (Recommended)

### Priority 1 (Core Features - Do First):
1. ✅ Dashboard (DONE)
2. Masomo (classes)
3. Class details
4. Ukumbi (chat rooms)
5. Chat room screen
6. Inbox (messages)
7. Conversation screen

### Priority 2 (Important Features):
8. More/Settings
9. Profile screen
10. File upload component
11. Message input component
12. Search bar component

### Priority 3 (Additional Features):
13. Events list
14. Event details
15. Jobs list
16. Job details
17. Achievements
18. Alumni

### Priority 4 (Enhancements):
19. Enhanced login
20. Enhanced register
21. Forgot password
22. File preview
23. Comment section
24. Realtime hook
25. Upload hook
26. Notifications
27. Camera utils

---

## 🚀 Ready to Build!

**Next Step**: Start with Priority 1, file by file.

**Estimated Completion**: All 27 files in ~3-4 hours

**Result**: Production-ready app with ALL features!

---

**Status**: Plan complete. Ready to execute! 🎯
