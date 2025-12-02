# Quick Start - Phase 1 Authentication

## 🚨 DO THIS FIRST

Before running your app, complete these 3 steps:

### 1. Run Database Migration (REQUIRED)

```bash
# Open Supabase Dashboard
# Go to SQL Editor → New Query
# Copy/paste contents of: supabase-migrations-phase1.sql
# Click RUN
```

### 2. Verify Storage Buckets

Check Supabase Dashboard → Storage for:
- ✅ `avatars` (public)
- ✅ `verification-docs` (private)

### 3. Start Your App

```bash
npm run dev
```

---

## ✅ Quick Test

1. **Visit** `http://localhost:5173`
2. **Click** "I'm a travel nurse"
3. **Sign up** with any email/password
4. **See** the main app with your authenticated session

---

## 📁 What Was Created

### New Files
- `src/stores/authStore.ts` - Auth state
- `src/services/authService.ts` - Auth operations
- `src/components/auth/SignUpForm.tsx` - Registration
- `src/components/auth/SignInForm.tsx` - Login
- `src/components/auth/AuthModal.tsx` - Modal wrapper
- `src/components/verification/NurseVerification.tsx` - Verification UI
- `src/components/verification/DocumentUpload.tsx` - File upload
- `supabase-migrations-phase1.sql` - Database schema

### Modified Files
- `src/App.tsx` - Integrated authentication

---

## 🎯 What You Can Do Now

✅ Sign up as nurse or host
✅ Sign in with email/password
✅ Upload nursing license for verification
✅ Upload profile avatar
✅ Sessions persist on refresh
✅ Sign out

---

## 🐛 Issues?

See `PHASE-1-SETUP-GUIDE.md` for detailed troubleshooting.

Most common issue: **Forgot to run the SQL migration**
→ Go to Supabase Dashboard → SQL Editor → Run `supabase-migrations-phase1.sql`
