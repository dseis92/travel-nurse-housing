# Stripe Integration Setup Guide

## Quick Start (Development)

### 1. Get Your Stripe Test Keys

1. Sign up at https://stripe.com
2. Go to https://dashboard.stripe.com/test/apikeys
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)

### 2. Add Keys to Your Project

Create a `.env` file in the project root:

```bash
# Frontend (public)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Backend (keep secret - DO NOT commit!)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

**Important:** Add `.env` to your `.gitignore` to keep secrets safe!

### 3. Enable Stripe Connect

1. Go to https://dashboard.stripe.com/test/connect/accounts/overview
2. Click "Get Started" on Stripe Connect
3. Choose **Express** account type (recommended)
4. Complete the setup questionnaire

---

## Architecture Overview

### Your Platform Uses: **Stripe Connect (Express)**

```
Nurse → Pays $1000 → Your Platform
                      ↓ (takes 10% = $100)
                      ↓ (sends 90% = $900)
                      → Host's Stripe Account
```

### Payment Flow

1. **Nurse Books** → Creates booking request
2. **Host Accepts** → Booking status: "accepted"
3. **Nurse Pays** → Your platform collects $1000
4. **Automatic Split**:
   - Platform keeps: $100 (10%)
   - Host receives: $900 (90%)
5. **Host Payout** → Stripe automatically pays host (2-7 days)

---

## Implementation Steps

### Phase 1: Basic Payments (Current Demo Mode)

✅ **Already Complete!**
- Payment modal UI
- Fee calculation
- Mock payment processing

### Phase 2: Real Stripe Payments (Next Step)

You need to implement:

#### A. Create Backend Payment Endpoint

Create a serverless function (Supabase Edge Function or similar):

```typescript
// Backend only - never expose secret key to frontend!
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createPaymentIntent(bookingId: string) {
  // Get booking details
  const booking = await getBooking(bookingId)

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: booking.total_price * 100, // Stripe uses cents
    currency: 'usd',
    metadata: {
      booking_id: bookingId,
      nurse_id: booking.nurse_id,
      host_id: booking.host_id,
    },
    // Add application fee for platform (10%)
    application_fee_amount: Math.round(booking.total_price * 0.10 * 100),
    // Transfer to connected host account
    transfer_data: {
      destination: booking.host_stripe_account_id,
    },
  })

  return { clientSecret: paymentIntent.client_secret }
}
```

#### B. Update Frontend to Use Real Stripe

In `src/components/payment/PaymentModal.tsx`:

```typescript
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe } from '../../services/paymentService'

// Wrap modal with Stripe provider
<Elements stripe={getStripe()}>
  <PaymentModalContent {...props} />
</Elements>

// Inside modal:
const stripe = useStripe()
const elements = useElements()

const handlePayment = async () => {
  // Call your backend to create payment intent
  const { clientSecret } = await fetch('/api/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ bookingId }),
  }).then(r => r.json())

  // Confirm payment with card details
  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: elements.getElement(CardElement),
    },
  })

  if (result.error) {
    toast.error(result.error.message)
  } else {
    // Payment successful!
    onSuccess()
  }
}
```

### Phase 3: Stripe Connect for Hosts

#### A. Host Onboarding Flow

When host signs up or first creates a listing:

1. **Create Connected Account**:
```typescript
// Backend
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: host.email,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
})

// Save account.id to your database
await supabase
  .from('profiles')
  .update({ stripe_account_id: account.id })
  .eq('id', host.id)
```

2. **Create Onboarding Link**:
```typescript
const accountLink = await stripe.accountLinks.create({
  account: host.stripe_account_id,
  refresh_url: 'https://yourapp.com/host/payouts',
  return_url: 'https://yourapp.com/host/payouts/complete',
  type: 'account_onboarding',
})

// Redirect host to accountLink.url
```

3. **Host completes Stripe onboarding** (tax info, bank account, identity verification)

4. **Save completion status** in your database

#### B. Update PayoutSettings Component

In `src/components/host/PayoutSettings.tsx`:

```typescript
const loadPayoutInfo = async () => {
  // Check if host has Stripe account
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', profile.id)
    .single()

  setStripeConnected(!!profile.stripe_onboarding_complete)

  if (profile.stripe_account_id) {
    // Get real payout data from Stripe
    const balance = await fetchHostBalance(profile.stripe_account_id)
    setPendingPayouts(balance.pending)
  }
}

const handleConnectStripe = async () => {
  // Call backend to create account link
  const { url } = await fetch('/api/create-stripe-onboarding').then(r => r.json())
  window.location.href = url
}
```

---

## Testing with Stripe Test Mode

### Test Card Numbers

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

Use any future expiration date and any 3-digit CVC.

### Test Connect Accounts

In test mode, you can create test connected accounts without real bank accounts.

### Stripe CLI for Webhooks

Install Stripe CLI to test webhooks locally:
```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks
```

---

## Production Checklist

Before going live:

- [ ] Switch from test keys to live keys
- [ ] Enable Stripe Connect in live mode
- [ ] Set up webhook endpoints (for payment confirmations)
- [ ] Add proper error handling and retry logic
- [ ] Implement refund handling
- [ ] Set up email notifications for payments
- [ ] Configure payout schedule (daily, weekly, monthly)
- [ ] Review Stripe fee structure (2.9% + $0.30 per transaction)
- [ ] Set up fraud detection (Stripe Radar)
- [ ] Complete Stripe account verification
- [ ] Add terms of service and privacy policy links

---

## Cost Breakdown

### Stripe Fees (per transaction):
- **2.9% + $0.30** - Standard credit card processing
- **0.25%** - Additional for Stripe Connect (marketplace)
- **Total**: ~3.15% + $0.30

### Example Transaction:
```
Nurse pays:        $1,000.00
Stripe fee:        -$31.80 (3.15% + $0.30)
Net received:      $968.20
Platform keeps:    $96.82 (10% of net)
Host receives:     $871.38 (90% of net)
```

**Note**: You can choose to absorb Stripe fees or pass them to users.

---

## Helpful Resources

- **Stripe Connect Docs**: https://stripe.com/docs/connect
- **Express Accounts**: https://stripe.com/docs/connect/express-accounts
- **Payment Intents**: https://stripe.com/docs/payments/payment-intents
- **Testing**: https://stripe.com/docs/testing
- **Webhooks**: https://stripe.com/docs/webhooks

---

## Support

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Support: https://support.stripe.com
- Community: https://stripe.com/community

---

## Security Reminders

⚠️ **NEVER expose your secret key!**
- Secret keys should only exist on your backend
- Use environment variables
- Add `.env` to `.gitignore`
- Rotate keys if accidentally exposed

✅ **Good**: `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` (frontend is OK)
❌ **Bad**: `VITE_STRIPE_SECRET_KEY=sk_test_...` (NEVER in frontend!)

---

## Quick Start Command

```bash
# 1. Add your test publishable key
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE" > .env

# 2. Start dev server
npm run dev

# 3. Test payment flow:
#    - Sign up as nurse
#    - Request a booking
#    - Sign up as host
#    - Accept the booking
#    - Switch back to nurse
#    - Click "Pay Now"
#    - Use test card: 4242 4242 4242 4242
```

---

**Current Status**: Demo mode active - no real charges are made. Follow Phase 2 & 3 above to enable real payments with Stripe Connect!
