# 🧪 Comprehensive Testing Guide - New Class System

## 📋 **Testing Checklist**

---

## **TEST 1: Admin Setup** ✅

### **Prerequisites:**
- Access to admin account

### **Steps:**
1. Login as admin
2. Navigate to `/admin/universities`
3. **Test Countries:**
   - ✅ Add country: "Kenya" (code: KE)
   - ✅ Add country: "United States" (code: US)
   - ✅ Verify countries appear in list
   - ✅ Try to add duplicate country (should fail)
   - ✅ Delete a country (should cascade)

4. **Test Universities:**
   - ✅ Add university: "University of Nairobi" (Kenya)
   - ✅ Add university: "Harvard University" (US)
   - ✅ Verify dropdown filters by country
   - ✅ Delete a university

5. **Test Courses (Bulk):**
   - ✅ Select "University of Nairobi"
   - ✅ Paste 10 courses (one per line):
     ```
     Computer Science
     Business Administration
     Medicine
     Engineering
     Law
     Economics
     Education
     Psychology
     Biology
     Chemistry
     ```
   - ✅ Click "Add All Courses"
   - ✅ Verify all 10 appear in courses list
   - ✅ Delete a course

6. **Test Analytics:**
   - ✅ Navigate to `/admin/class-management`
   - ✅ Verify Total Classes count
   - ✅ Verify Total Students count
   - ✅ Search for a class
   - ✅ Delete a class

**✅ Expected Result:** Admin can manage all educational data

---

## **TEST 2: Profile Editing** ✅

### **Prerequisites:**
- User account

### **Steps:**
1. Navigate to `/profile/your-id`
2. Click "Edit Profile" button
3. **Test Cascading Dropdowns:**
   - ✅ Select Country: "Kenya"
   - ✅ Verify University dropdown updates
   - ✅ Select University: "University of Nairobi"
   - ✅ Verify Course dropdown updates
   - ✅ Select Course: "Computer Science"

4. **Test Flexible Fields:**
   - ✅ Year: Enter "3" or "3rd Year"
   - ✅ Semester: Enter "Fall" or "1"
   - ✅ Status: Select "Student"

5. **Test Save:**
   - ✅ Click "Save Changes"
   - ✅ Verify success toast
   - ✅ Refresh page
   - ✅ Verify changes persisted

6. **Test Visibility:**
   - ✅ View profile from another account
   - ✅ Verify Academic Information shows
   - ✅ Verify Country, University, Course visible

**✅ Expected Result:** Profile editing works with cascading dropdowns

---

## **TEST 3: Class Creation** ✅

### **Prerequisites:**
- User account with complete profile

### **Steps:**
1. Navigate to `/masomo`
2. Click "Create Class" button (or empty state button)
3. **Test Form:**
   - ✅ Enter name: "CS Year 3 - 2025"
   - ✅ Enter description: "Computer Science Year 3 class"
   - ✅ Add Unit 1: "Data Structures" (desc: "Trees, Graphs, etc.")
   - ✅ Click "Add Unit"
   - ✅ Add Unit 2: "Algorithms"
   - ✅ Add Unit 3: "Web Development"
   - ✅ Click X to remove Unit 3
   - ✅ Verify only 2 units remain

4. **Test Creation:**
   - ✅ Click "Create Class"
   - ✅ Verify success toast with share code
   - ✅ Verify modal closes
   - ✅ Verify class appears in tabs
   - ✅ Copy share code: e.g., "ABC123XY"

5. **Test Class View:**
   - ✅ Verify class header shows
   - ✅ Verify member count: 1
   - ✅ Verify unit count: 2
   - ✅ Verify you have "Manage" button (creator)

**✅ Expected Result:** Class created with share code

---

## **TEST 4: Class Joining** ✅

### **Prerequisites:**
- Second user account
- Share code from TEST 3

### **Steps (As User 2):**
1. Navigate to `/masomo`
2. Click "Join Class"
3. **Test Search:**
   - ✅ Type "CS Year" in search
   - ✅ Wait for results (auto-search)
   - ✅ Click on found class
   - ✅ Verify preview appears

4. **OR Test Code Entry:**
   - ✅ Enter name: "John Doe"
   - ✅ Enter code: "ABC123XY"
   - ✅ Click "Preview Class"

5. **Test Preview:**
   - ✅ Verify class name shows
   - ✅ Verify description shows
   - ✅ Verify units list shows:
     - Data Structures
     - Algorithms

6. **Test Join Request:**
   - ✅ Click "Request to Join"
   - ✅ Verify success toast
   - ✅ Verify modal closes
   - ✅ Try to request again (should prevent duplicate)

**✅ Expected Result:** Join request created

---

## **TEST 5: Membership Approval** ✅

### **Prerequisites:**
- Pending join request from TEST 4

### **Steps (As User 1 - Creator):**
1. Go to `/masomo`
2. Select your class tab
3. Click "Requests" tab
4. **Test Pending Requests:**
   - ✅ Verify request shows:
     - Name: "John Doe"
     - Email: user2@example.com
     - Request date/time
   - ✅ Verify red badge shows "1"

5. **Test Approval:**
   - ✅ Click "Approve"
   - ✅ Verify success toast
   - ✅ Verify request disappears
   - ✅ Verify red badge gone
   - ✅ Go to "Members" tab
   - ✅ Verify User 2 now appears

6. **Test Rejection (Create another request first):**
   - ✅ Have User 3 request to join
   - ✅ Click "Reject" on User 3
   - ✅ Enter reason: "Class is full"
   - ✅ Click "Confirm Reject"
   - ✅ Verify success toast
   - ✅ Verify request disappears

**✅ Expected Result:** Approval/rejection workflow works

---

## **TEST 6: Class Chatroom** 💬

### **Prerequisites:**
- User 1 and User 2 both in same class

### **Steps:**
1. **As User 1:**
   - ✅ Go to class "Chatroom" tab
   - ✅ Type message: "Welcome everyone!"
   - ✅ Press Enter (or click Send)
   - ✅ Verify message appears on right (blue)
   - ✅ Verify your avatar shows

2. **As User 2 (in separate browser/incognito):**
   - ✅ Go to `/masomo`
   - ✅ Select the class
   - ✅ Go to "Chatroom" tab
   - ✅ Verify User 1's message appears (left, gray)
   - ✅ Type reply: "Thanks! Happy to be here"
   - ✅ Send message

3. **As User 1:**
   - ✅ Verify User 2's message appears instantly (real-time!)

4. **Test Image Upload:**
   - ✅ Click image icon
   - ✅ Upload an image
   - ✅ Verify image appears in chat
   - ✅ Click image to view full screen
   - ✅ Other user sees image

5. **Test File Upload:**
   - ✅ Click paperclip icon
   - ✅ Upload a PDF
   - ✅ Verify file shows with download link
   - ✅ Click to download

**✅ Expected Result:** Real-time chat with media works

---

## **TEST 7: Multi-Class Management** 🎓

### **Steps:**
1. **As User 1:**
   - ✅ Create second class: "Web Dev 2025"
   - ✅ Verify both classes show in tabs
   - ✅ Click between tabs
   - ✅ Verify content switches correctly
   - ✅ Send message in Class 1
   - ✅ Switch to Class 2
   - ✅ Send message in Class 2
   - ✅ Verify messages don't mix

2. **Test Member Management:**
   - ✅ Go to "Members" tab in Class 1
   - ✅ Verify 2 members (User 1, User 2)
   - ✅ Click "Remove" on User 2
   - ✅ Confirm removal
   - ✅ Verify User 2 removed

3. **As User 2:**
   - ✅ Go to `/masomo`
   - ✅ Verify Class 1 no longer in tabs
   - ✅ Verify can still see own messages/uploads (not deleted)

4. **Test Leave Class:**
   - ✅ Join Class 1 again (via code)
   - ✅ Get approved
   - ✅ Go to "Members" tab
   - ✅ Click "Leave Class"
   - ✅ Confirm leave
   - ✅ Verify class removed from tabs
   - ✅ Verify uploads still exist in database

**✅ Expected Result:** Multi-class and membership management works

---

## **TEST 8: Units System** 📚

### **Steps:**
1. Go to any class
2. Click "Units" tab
3. **Test Unit Display:**
   - ✅ Verify all units show
   - ✅ Verify unit names and descriptions
   - ✅ Verify counts (uploads/assignments)

4. **Test Hide/Unhide:**
   - ✅ Click "Hide" on a unit
   - ✅ Verify success toast
   - ✅ Verify unit becomes faded (50% opacity)
   - ✅ Click "Restore"
   - ✅ Verify unit returns to normal

5. **As Another Member:**
   - ✅ Go to same class Units tab
   - ✅ Verify hidden unit still visible to them
   - ✅ (Unit hiding is personal)

**✅ Expected Result:** Unit display and personal hiding works

---

## **TEST 9: Sifa Profile Validation** 🏆

### **Steps:**
1. **With Incomplete Profile:**
   - ✅ Go to `/sifa`
   - ✅ Verify floating button is grayed out (50% opacity)
   - ✅ Click button
   - ✅ Verify toast: "Complete Your Profile"
   - ✅ Button should not open modal

2. **Complete Profile:**
   - ✅ Go to profile
   - ✅ Edit profile
   - ✅ Add University and Course
   - ✅ Save

3. **Try Sifa Again:**
   - ✅ Go to `/sifa`
   - ✅ Verify button is bright gold (full opacity)
   - ✅ Click button
   - ✅ Verify modal opens
   - ✅ Can post achievement!

**✅ Expected Result:** Profile validation enforced

---

## **TEST 10: Class Discovery** 🔍

### **Steps:**
1. Navigate to `/masomo`
2. Click "Join Class"
3. **Test Global Search:**
   - ✅ Type "Computer" in search box
   - ✅ Verify classes matching "Computer" appear
   - ✅ Click on a result
   - ✅ Verify preview loads automatically
   - ✅ Verify can request to join

4. **Test Code Entry:**
   - ✅ Clear search
   - ✅ Enter code directly: "ABC123XY"
   - ✅ Click "Preview Class"
   - ✅ Verify works same as search

**✅ Expected Result:** Both search and code entry work

---

## **TEST 11: Edge Cases & Errors** ⚠️

### **Test Error Handling:**
1. **Invalid Code:**
   - ✅ Enter fake code: "XXXXXXXX"
   - ✅ Verify "Not Found" error

2. **Duplicate Request:**
   - ✅ Request to join class twice
   - ✅ Verify second attempt blocked

3. **Already Member:**
   - ✅ Try to join class you're in
   - ✅ Verify "Already a Member" message

4. **Empty Forms:**
   - ✅ Try to create class with no name
   - ✅ Verify error toast
   - ✅ Try to create with no units
   - ✅ Verify error toast

5. **Network Issues:**
   - ✅ Disconnect internet
   - ✅ Try to send chat message
   - ✅ Verify error handling
   - ✅ Reconnect
   - ✅ Verify real-time resumes

**✅ Expected Result:** All errors handled gracefully

---

## **TEST 12: Mobile Responsiveness** 📱

### **Test on Mobile/Small Screen:**
1. **Masomo Page:**
   - ✅ Class tabs scroll horizontally
   - ✅ Tabs don't break layout
   - ✅ '+' button accessible
   - ✅ Class header responsive
   - ✅ Tabs stack nicely

2. **Chatroom:**
   - ✅ Messages readable on mobile
   - ✅ Input area always visible
   - ✅ Keyboard doesn't cover input
   - ✅ Image uploads work
   - ✅ File uploads work

3. **Modals:**
   - ✅ Create Class modal scrolls (max-h-90vh)
   - ✅ Join Class modal fits screen
   - ✅ Edit Profile modal scrolls
   - ✅ All buttons accessible

4. **Admin Panels:**
   - ✅ Tables/lists responsive
   - ✅ Forms stack on mobile
   - ✅ Buttons accessible
   - ✅ Cards stack vertically

**✅ Expected Result:** Everything works on mobile

---

## **TEST 13: Performance** ⚡

### **Load Testing:**
1. **Many Classes:**
   - ✅ Create 5+ classes
   - ✅ Verify tabs scroll smoothly
   - ✅ Verify switching is fast
   - ✅ Verify no lag

2. **Many Messages:**
   - ✅ Send 50+ messages in chatroom
   - ✅ Verify scroll works
   - ✅ Verify real-time still works
   - ✅ Verify no performance degradation

3. **Many Units:**
   - ✅ Create class with 10+ units
   - ✅ Verify all display
   - ✅ Verify hide/unhide works

**✅ Expected Result:** System performs well under load

---

## **TEST 14: Security** 🔒

### **Test RLS Policies:**
1. **Class Visibility:**
   - ✅ Non-member can't see class content
   - ✅ Search only shows searchable classes
   - ✅ Share code required to view

2. **Chatroom Access:**
   - ✅ Only members can see messages
   - ✅ Only members can send messages
   - ✅ Non-members blocked

3. **Member Management:**
   - ✅ Only creator can approve/reject
   - ✅ Only creator can remove members
   - ✅ Members can only leave (not delete class)

4. **Admin Controls:**
   - ✅ Only admins access `/admin/*` routes
   - ✅ Regular users redirected

**✅ Expected Result:** All security policies enforced

---

## 🎯 **FINAL VERIFICATION**

### **Complete User Journey (End-to-End):**

**Day 1 - Setup:**
1. ✅ Admin adds countries/universities/courses
2. ✅ User 1 updates profile
3. ✅ User 1 creates "Data Science 2025" class
4. ✅ Adds 3 units
5. ✅ Gets share code

**Day 2 - Growth:**
6. ✅ User 2 searches for class
7. ✅ Requests to join
8. ✅ User 1 approves
9. ✅ User 3 joins via code
10. ✅ User 1 approves
11. ✅ All 3 users chat in real-time

**Day 3 - Usage:**
12. ✅ Users share images in chat
13. ✅ Users upload study materials
14. ✅ User 4 requests to join
15. ✅ User 1 rejects with reason
16. ✅ User 2 leaves class
17. ✅ User 1 sees updated member count

**Day 4 - Scaling:**
18. ✅ Users join multiple classes
19. ✅ Switch between class tabs
20. ✅ Each chatroom separate
21. ✅ Hide unwanted units
22. ✅ Admin views analytics

---

## 📊 **TEST RESULTS FORMAT**

For each test, record:
```
Test #: [Test Name]
Date: [Date]
Tester: [Your Name]
Result: ✅ PASS / ❌ FAIL
Notes: [Any issues found]
```

---

## 🐛 **COMMON ISSUES & FIXES**

### **Issue: "infinite recursion detected"**
**Fix:** Run `fix-class-members-rls-infinite-recursion.sql`

### **Issue: "column does not exist"**
**Fix:** Run SQL scripts in correct order (see SIMPLE-4-STEP-GUIDE.md)

### **Issue: "Real-time not working"**
**Fix:** Check Supabase Realtime is enabled in project settings

### **Issue: "Images not uploading"**
**Fix:** Create storage buckets: `class-images`, `class-files`

---

## ✅ **TESTING COMPLETE WHEN:**

- [ ] All 14 test scenarios pass
- [ ] No critical bugs found
- [ ] Mobile responsive verified
- [ ] Performance acceptable
- [ ] Security policies working
- [ ] Error handling functional
- [ ] User feedback clear
- [ ] Real-time messaging works

---

**Happy Testing! 🧪**

