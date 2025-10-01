# 🚀 Deployment Checklist - New Class System

## ✅ **PRE-DEPLOYMENT CHECKLIST**

### **1. Database Migration** (CRITICAL)
- [ ] Backup your current database
- [ ] Run `rename-old-tables-then-migrate.sql`
- [ ] Run `create-new-class-system.sql`
- [ ] Run `migrate-existing-users-SAFE.sql`
- [ ] Run `fix-class-members-rls-infinite-recursion.sql`
- [ ] Verify migration success (check counts)

### **2. Storage Buckets** (REQUIRED for chat media)
- [ ] Create bucket: `class-images` (Public: Yes)
- [ ] Create bucket: `class-files` (Public: Yes)
- [ ] Add RLS policies (see `setup-storage-buckets.sql`)
- [ ] Test image upload
- [ ] Test file upload

### **3. Admin Setup** (REQUIRED)
- [ ] Login as admin to `/admin/universities`
- [ ] Add at least 3 countries
- [ ] Add at least 5 universities per country
- [ ] Bulk paste courses for each university
- [ ] Verify data in dropdowns

### **4. Test User Flow** (RECOMMENDED)
- [ ] Create test user
- [ ] Update profile with university/course
- [ ] Create a test class
- [ ] Get share code
- [ ] Join class with second account
- [ ] Approve join request
- [ ] Send chat messages
- [ ] Upload image in chat
- [ ] Test all features from COMPREHENSIVE-TESTING-GUIDE.md

### **5. Code Deployment** (REQUIRED)
- [ ] Pull latest code
- [ ] Run `npm install` (if new dependencies)
- [ ] Run `npm run build`
- [ ] Deploy to hosting (Vercel/Netlify/etc.)
- [ ] Verify build successful

### **6. Environment Variables** (CHECK)
- [ ] VITE_SUPABASE_URL set correctly
- [ ] VITE_SUPABASE_ANON_KEY set correctly
- [ ] All env vars in production match

### **7. Supabase Settings** (CHECK)
- [ ] Realtime enabled in project settings
- [ ] RLS enabled on all tables
- [ ] Storage buckets created
- [ ] Auth providers configured

---

## 🔍 **POST-DEPLOYMENT VERIFICATION**

### **Immediate Checks (Within 1 hour):**
- [ ] Can login successfully
- [ ] Can navigate to `/masomo`
- [ ] Can create a class
- [ ] Can join a class
- [ ] Can send chat messages
- [ ] Real-time updates working
- [ ] Images/files upload successfully
- [ ] No console errors

### **24-Hour Checks:**
- [ ] Monitor error logs
- [ ] Check Supabase usage/quotas
- [ ] Verify database performance
- [ ] Test on mobile devices
- [ ] Get user feedback

---

## 🐛 **ROLLBACK PLAN (If Needed)**

### **Database Rollback:**
```sql
-- Restore old tables
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.universities CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;

ALTER TABLE public.classes_old RENAME TO classes;
ALTER TABLE public.universities_old RENAME TO universities;
ALTER TABLE public.countries_old RENAME TO countries;
```

### **Code Rollback:**
- Revert to previous Git commit
- Redeploy old version
- Keep new SQL tables for later

---

## 📊 **SUCCESS METRICS**

### **Week 1 Goals:**
- [ ] 10+ classes created
- [ ] 50+ users updated profiles
- [ ] 100+ chat messages sent
- [ ] 20+ successful join approvals
- [ ] Zero critical bugs

### **Month 1 Goals:**
- [ ] 100+ classes created
- [ ] 500+ users with complete profiles
- [ ] 1000+ chat messages
- [ ] Active usage in multiple universities

---

## 🎯 **LAUNCH SEQUENCE**

### **Day 1: Soft Launch**
1. Deploy to production
2. Test with admin account
3. Create 2-3 test classes
4. Invite beta testers

### **Day 2-3: Beta Testing**
1. Invite 10-20 beta users
2. Monitor for bugs
3. Fix critical issues
4. Gather feedback

### **Day 4-7: Full Launch**
1. Announce to all users
2. Email existing users about new system
3. Create onboarding materials
4. Monitor usage and errors

---

## 📞 **SUPPORT PLAN**

### **Common User Questions:**

**Q: "I can't post on Sifa!"**
A: Update your profile with university and course first.

**Q: "How do I join a class?"**
A: Go to /masomo, click Join Class, enter code or search.

**Q: "My join request is pending"**
A: Wait for class creator to approve. They'll get a notification.

**Q: "I want to leave a class"**
A: Go to class Members tab, click Leave Class.

**Q: "How do I create a class?"**
A: Go to /masomo, click Create Class, add units, get share code!

---

## 🔧 **ADMIN MONITORING**

### **Daily Tasks:**
- [ ] Check `/admin/class-management`
- [ ] Monitor total classes created
- [ ] Check for abandoned classes
- [ ] Review most active classes

### **Weekly Tasks:**
- [ ] Review admin analytics
- [ ] Add new universities/courses as requested
- [ ] Check for inappropriate class names
- [ ] Monitor storage usage

---

## ✅ **DEPLOYMENT COMPLETE WHEN:**

- [ ] All SQL scripts run successfully
- [ ] Storage buckets created
- [ ] Admin data populated
- [ ] Code deployed and live
- [ ] Basic testing passed
- [ ] No critical errors
- [ ] Users can complete full journey
- [ ] Documentation available

---

## 🎉 **YOU'RE READY TO LAUNCH!**

**All systems go! The new class system is:**
- ✅ Fully functional
- ✅ Tested
- ✅ Documented
- ✅ Production-ready

**Good luck with your launch! 🚀**

