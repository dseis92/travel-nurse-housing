# Phase 1: Authentication & User Management - Setup Guide

## ✅ What's Been Completed

Phase 1 of the NightShift Housing implementation is complete! Here's what we've built:

### 1. **Dependencies Installed**
- `@googlemaps/js-api-loader` - For Google Maps integration (Phase 3)
- `date-fns` - Date manipulation utilities
- `react-hot-toast` - Toast notifications
- `react-dropzone` - File upload component
- `@tanstack/react-query` - Data fetching (optional)
- `react-hook-form` - Form handling (optional)
- `zod` - Validation (optional)
- `@types/google.maps` - TypeScript types for Google Maps

### 2. **Database Schema** (`supabase-migrations-phase1.sql`)
Created comprehensive SQL migration with:
- **profiles table** - User profiles with role (nurse/host) and verification status
- **verification_documents table** - Document upload tracking
- **Row-Level Security (RLS) policies** - Secure data access
- **Storage buckets** - `avatars` (public) and `verification-docs` (private)
- **Triggers** - Auto-update timestamps
- **Indexes** - Optimized queries

### 3. **Authentication System**
- **authStore.ts** - Zustand state management for auth
- **authService.ts** - Complete auth operations:
  - Sign up with email/password
  - Sign in
  - Sign out
  - Profile management
  - Avatar upload
  - Auto session management

### 4. **UI Components**
- **SignUpForm.tsx** - Beautiful registration form with role selection
- **SignInForm.tsx** - Login form with forgot password link
- **AuthModal.tsx** - Modal wrapper with smooth animations
- **NurseVerification.tsx** - Nurse license verification UI
- **DocumentUpload.tsx** - Drag & drop file upload with progress

### 5. **App Integration**
- Replaced mock role selector with real authentication
- Added loading states
- Integrated toast notifications
- Auth persistence across page refreshes
- Sign out functionality
- Nurse verification in profile tab

---

## 🚀 Required Setup Steps

### Step 1: Run Database Migration

**IMPORTANT:** You must run the SQL migration before the app will work.

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase-migrations-phase1.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

You should see:
```
Success. No rows returned
```

### Step 2: Verify Storage Buckets

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. You should see 2 buckets:
   - `avatars` (public)
   - `verification-docs` (private)

If buckets don't appear, run these SQL commands manually:
```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create verification-docs bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-docs',
  'verification-docs',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Verify Environment Variables

Check that your `.env.local` file has:
```bash
VITE_SUPABASE_URL=https://fhwyvxdhdklntaaztjoz.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_RAPIDAPI_KEY=<your-rapidapi-key>
```

### Step 4: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## 🧪 Testing Authentication

### Test Sign Up Flow

1. **Click "I'm a travel nurse"** on the landing page
2. **Fill out the signup form:**
   - Full Name: Test Nurse
   - Email: test@nurse.com
   - Password: test123
   - Confirm Password: test123
3. **Click "Sign Up"**
4. You should see "Account created successfully!" toast
5. The app should redirect to the main feed

### Test Sign In Flow

1. **Sign out** (click profile icon in bottom nav)
2. **Click "Already have an account? Sign In"**
3. **Enter credentials:**
   - Email: test@nurse.com
   - Password: test123
4. **Click "Sign In"**
5. You should see "Welcome back!" toast

### Test Nurse Verification

1. **Navigate to the "Nurses" tab** (in header)
2. **Scroll to "Verification Required" card**
3. **Drag & drop or click to upload** a nursing license (PDF/JPG/PNG)
4. **Wait for upload** - you should see success message
5. **Status changes to "Verification Pending"**

### Test Profile Persistence

1. **Refresh the page** (F5 or Cmd+R)
2. You should **remain signed in**
3. Profile should load automatically

---

## 📂 New File Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── AuthModal.tsx          ✨ NEW
│   │   ├── SignUpForm.tsx         ✨ NEW
│   │   └── SignInForm.tsx         ✨ NEW
│   └── verification/
│       ├── NurseVerification.tsx  ✨ NEW
│       └── DocumentUpload.tsx     ✨ NEW
├── services/
│   └── authService.ts             ✨ NEW
├── stores/
│   └── authStore.ts               ✨ NEW
└── App.tsx                        🔄 MODIFIED

supabase-migrations-phase1.sql     ✨ NEW
```

---

## 🔐 How Authentication Works

### Flow Diagram

```
App Loads
    ↓
authService.initialize()
    ↓
Check for existing session (Supabase)
    ↓
Session exists?
    ├─ YES → Fetch profile from DB → Set auth state → Show main app
    └─ NO  → Show role selector → User clicks role → Show AuthModal
                ↓
            User signs up/in
                ↓
            Create/fetch profile
                ↓
            Set auth state → Show main app
```

### State Management

The `useAuthStore` manages:
- `user` - Supabase auth user object
- `profile` - User profile from profiles table
- `session` - Current session
- `loading` - Loading state
- `initialized` - Whether auth has been checked

### Session Persistence

Supabase automatically persists sessions in `localStorage`. When the user refreshes:
1. `authService.initialize()` runs
2. Supabase checks `localStorage` for session
3. If valid session exists, user stays logged in
4. Profile is fetched from database
5. App continues where user left off

---

## 🐛 Troubleshooting

### "No user returned from sign up"

**Problem:** Database migration not run or profiles table doesn't exist

**Solution:**
1. Check Supabase Dashboard → Table Editor
2. Verify `profiles` table exists
3. Re-run migration SQL

### "Failed to upload document"

**Problem:** Storage buckets not created or RLS policies missing

**Solution:**
1. Check Supabase Dashboard → Storage
2. Verify buckets exist
3. Check RLS policies on storage.objects table
4. Re-run storage section of migration

### "Session expired" on refresh

**Problem:** Anon key might be incorrect

**Solution:**
1. Go to Supabase Dashboard → Settings → API
2. Copy "anon public" key
3. Update `VITE_SUPABASE_ANON_KEY` in `.env.local`
4. Restart dev server

### Sign up works but profile doesn't load

**Problem:** RLS policies might be too restrictive

**Solution:**
Run this SQL to verify policies:
```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

If it returns nothing, check:
```sql
-- See current policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

---

## 🎯 What's Next?

Phase 1 is complete! Here's what's coming in the next phases:

### **Phase 2: Core Booking & Communication** (Next)
- Real-time messaging with Supabase Realtime
- Booking request → acceptance flow
- Reviews system
- Host dashboard with analytics

### **Phase 3: Discovery & Search Enhancement**
- Google Maps with listing/hospital markers
- Availability calendar
- Saved searches with email alerts

### **Phase 4: Mobile & Engagement**
- Web Push notifications
- PWA enhancements
- Favorites sync

---

## 📊 Database Schema Reference

### Profiles Table
```sql
id              UUID    (FK to auth.users)
role            TEXT    (nurse | host)
name            TEXT
email           TEXT
phone           TEXT
license_status  TEXT    (unverified | pending | verified | rejected)
host_verification_status TEXT
avatar_url      TEXT
bio             TEXT
specialties     TEXT[]
preferred_cities TEXT[]
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### Verification Documents Table
```sql
id              UUID
user_id         UUID    (FK to profiles)
document_type   TEXT    (nursing_license | government_id | etc.)
file_url        TEXT
status          TEXT    (pending | approved | rejected)
reviewed_at     TIMESTAMPTZ
reviewed_by     UUID    (FK to profiles)
notes           TEXT
created_at      TIMESTAMPTZ
```

---

## 🔑 Key Features Implemented

✅ Email/password authentication
✅ Role-based access (nurse/host)
✅ Profile creation on signup
✅ Session persistence
✅ Avatar upload
✅ Nurse license verification
✅ Document upload with drag & drop
✅ Toast notifications
✅ Loading states
✅ Error handling
✅ Row-Level Security
✅ Auto-update timestamps

---

## 🎨 User Experience Highlights

- **Smooth animations** - Modal entrance/exit, loading spinners
- **Neumorphic design** - Maintains existing aesthetic
- **Mobile-first** - Optimized for phone screens
- **Real-time feedback** - Toasts for success/error
- **Form validation** - Password matching, required fields
- **File validation** - Type and size checks
- **Drag & drop** - Intuitive document upload
- **Status indicators** - Verification badges

---

## 💡 Tips

1. **Test with multiple accounts** - Create both nurse and host accounts to see role differences
2. **Check Supabase logs** - Dashboard → Logs to debug issues
3. **Use Supabase Table Editor** - Manually inspect created profiles
4. **Check Storage** - View uploaded files in Dashboard → Storage
5. **Monitor Auth** - Dashboard → Authentication shows all users

---

Need help? Check:
- Supabase Dashboard → Logs
- Browser DevTools Console
- Network tab for failed requests

Ready to move on to Phase 2? Let me know!
