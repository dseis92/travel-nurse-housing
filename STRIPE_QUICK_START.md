# Stripe Quick Start - Get Your API Keys

## Step 1: Get Your Publishable Key (5 minutes)

### A. Sign Up for Stripe
1. Go to https://stripe.com
2. Click "Sign up" (top right)
3. Enter your email and password
4. Complete the signup form

### B. Get Your Test Publishable Key
1. After signup, you'll land in the Stripe Dashboard
2. **Make sure you're in TEST MODE** (toggle in top right should say "Test mode")
3. Click **"Developers"** in the top navigation bar
4. Click **"API keys"** in the left sidebar
5. You'll see two keys:
   - **Publishable key** - starts with `pk_test_...` (this one is public, safe to use)
   - **Secret key** - starts with `sk_test_...` (keep this secret!)
6. Click the **copy icon** next to "Publishable key"

### C. Add Key to Your Project
1. Open your project in your code editor
2. Find the file: `.env.local` (in the root folder)
3. Find this line:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY="pk_test_placeholder"
   ```
4. Replace `pk_test_placeholder` with your actual key:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY="pk_test_51abc123xyz..."
   ```
5. Save the file
6. **Restart your dev server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

✅ **Done!** Your publishable key is now configured.

---

## Step 2: Get Webhook Secret (For Later - Not Needed Yet!)

**Important:** You don't need webhooks right now! The payment system works in demo mode without them. However, here's how to get the webhook secret when you're ready:

### When Do You Need Webhooks?

Webhooks are needed for:
- ✅ Real-time payment confirmations from Stripe
- ✅ Handling payment failures and refunds
- ✅ Getting notified when host payouts complete
- ✅ Handling disputes and chargebacks

**For now:** Skip webhooks. Your demo payment system works without them.

### How to Get Webhook Secret (Later)

#### Option A: Testing Locally with Stripe CLI

1. **Install Stripe CLI**:
   ```bash
   # Mac
   brew install stripe/stripe-cli/stripe

   # Windows (with Scoop)
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe

   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```
   This opens your browser to authorize the CLI.

3. **Forward Webhooks to Your Local Server**:
   ```bash
   stripe listen --forward-to localhost:5173/api/webhooks
   ```

4. **Copy the webhook secret** shown in the terminal:
   ```
   > Ready! Your webhook signing secret is whsec_abc123xyz... (^C to quit)
   ```

5. **Add to your backend env** (NOT .env.local):
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_abc123xyz...
   ```

#### Option B: Production Webhooks

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter your webhook URL: `https://yourapp.com/api/webhooks`
4. Select events to listen for:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
   - ✅ `account.updated` (for Connect)
5. Click **"Add endpoint"**
6. Click on the newly created endpoint
7. Click **"Reveal"** next to "Signing secret"
8. Copy the secret (starts with `whsec_...`)

---

## Step 3: Test Payment Flow

### Test Card Numbers

Use these fake card numbers in test mode:

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0025 0000 3155` | 🔐 Requires 3D Secure authentication |
| `4000 0000 0000 9995` | ❌ Insufficient funds |

**Expiration:** Any future date (e.g., `12/25`)
**CVC:** Any 3 digits (e.g., `123`)
**ZIP:** Any 5 digits (e.g., `12345`)

### Testing Steps

1. **Start your app**: `npm run dev`
2. **Sign up as a nurse**
3. **Browse listings and request a booking**
4. **Sign up as a host** (or use a different browser/incognito)
5. **Accept the booking request**
6. **Switch back to nurse account**
7. **Go to Bookings tab** (📅 icon in bottom nav)
8. **Click "Pay Now"** on the accepted booking
9. **Use test card**: `4242 4242 4242 4242`
10. **See payment success!** ✅

---

## Important Notes

### ⚠️ About .env.local

- ✅ `.env.local` is already in `.gitignore` (safe from commits)
- ✅ `VITE_` prefix makes it accessible in frontend
- ✅ Publishable keys are PUBLIC and safe to expose
- ❌ NEVER put secret keys in `.env.local`

### 🔐 Security Rules

| Key Type | Where It Goes | Prefix | Safe to Expose? |
|----------|---------------|--------|-----------------|
| Publishable Key | `.env.local` | `pk_test_` or `pk_live_` | ✅ Yes (public) |
| Secret Key | Backend only | `sk_test_` or `sk_live_` | ❌ NO! (server-side only) |
| Webhook Secret | Backend only | `whsec_` | ❌ NO! (server-side only) |

### 📁 Your Current File Structure

```
travel-nurse-housing/
├── .env.local               ← Your actual keys (not committed)
├── .env.example            ← Template (committed to git)
├── .gitignore              ← Prevents .env.local from being committed
├── STRIPE_SETUP.md         ← Full guide
├── STRIPE_QUICK_START.md   ← This file
└── src/
    └── services/
        └── paymentService.ts  ← Uses VITE_STRIPE_PUBLISHABLE_KEY
```

---

## Troubleshooting

### "No publishable key provided"

**Problem:** You see an error about missing Stripe key.

**Solution:**
1. Check `.env.local` has your key
2. Make sure it starts with `VITE_` prefix
3. Restart dev server (Ctrl+C, then `npm run dev`)
4. Clear browser cache and refresh

### "Invalid API Key"

**Problem:** Stripe says the key is invalid.

**Solution:**
1. Make sure you copied the entire key
2. Check there are no extra spaces or quotes
3. Verify you're using the **Publishable** key (starts with `pk_test_`)
4. Make sure you're in TEST mode on Stripe dashboard

### Key Not Loading

**Problem:** `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY` is undefined.

**Solution:**
1. Restart your dev server
2. Check the key has the `VITE_` prefix
3. Make sure `.env.local` is in the root directory (same level as `package.json`)

---

## What's Next?

### Current Status: ✅ Demo Mode (Working)
- Payment modal displays correctly
- Fee calculation works
- Simulates payment processing
- Updates booking status

### Next Steps to Enable Real Payments:

1. **Add your Stripe test key** ← You're doing this now!
2. **Build a backend** (Supabase Edge Functions or similar)
3. **Implement Stripe Connect** for host payouts
4. **Set up webhooks** for payment confirmations
5. **Switch to live keys** when ready to launch

---

## Quick Reference

### Important URLs

- **Stripe Dashboard**: https://dashboard.stripe.com
- **API Keys**: https://dashboard.stripe.com/test/apikeys
- **Webhooks**: https://dashboard.stripe.com/test/webhooks
- **Test Cards**: https://stripe.com/docs/testing
- **Connect Docs**: https://stripe.com/docs/connect

### Your Configuration File

Location: `/Users/dylanseis/dev/travel-nurse-housing/.env.local`

```bash
# Your file should look like this:
VITE_SUPABASE_URL="https://..."
VITE_SUPABASE_ANON_KEY="eyJ..."
VITE_MAPBOX_TOKEN="pk.eyJ..."
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"  ← Add your key here
```

---

## Need Help?

- **Stripe Support**: https://support.stripe.com
- **Stripe Docs**: https://stripe.com/docs
- **Can't find your keys?**: Make sure you're in TEST mode (toggle in top right of dashboard)

---

**Next Action:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your Publishable key
3. Paste it into `.env.local` replacing `pk_test_placeholder`
4. Restart dev server: `npm run dev`
5. Test with card: `4242 4242 4242 4242`
