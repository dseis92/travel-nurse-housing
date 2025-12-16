# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nursery is a mobile-first travel nurse housing marketplace (Airbnb-style) built with React + TypeScript + Vite + Supabase. The platform serves two user roles: travel nurses searching for housing near hospitals, and hosts managing property listings.

**Key Stack:**
- Frontend: React 19, TypeScript, Vite, Custom Neumorphic UI
- Backend: Supabase (auth, database, real-time, storage)
- Maps: Mapbox GL JS
- Payments: Stripe (with Stripe Connect for host payouts)
- State: Zustand for auth, localStorage for favorites
- PWA: Configured with vite-plugin-pwa

## Common Commands

### Development
```bash
npm run dev          # Start dev server on port 5173
npm run build        # TypeScript compile + Vite build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Supabase Migrations
```bash
# Apply migrations to remote database
npx supabase db push --db-url "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:[PORT]/postgres"

# Or use the helper script
chmod +x run-migration.sh
./run-migration.sh <migration-file.sql>
```

### Environment Setup
Required environment variables in `.env.local`:
```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MAPBOX_TOKEN=
VITE_STRIPE_PUBLISHABLE_KEY=
```

See `.env.example` for details.

## Architecture

### Directory Structure

```
src/
├── components/           # Feature-organized components
│   ├── auth/            # Login/signup modals
│   ├── booking/         # Booking requests, MyBookings
│   ├── calendar/        # Availability management
│   ├── host/            # Host dashboard, listing creation/management
│   ├── messaging/       # Real-time chat infrastructure
│   ├── onboarding/      # Multi-step onboarding flows
│   ├── payment/         # Stripe payment components
│   ├── profile/         # User profile management
│   ├── reviews/         # Reviews and ratings
│   ├── search/          # Advanced search features
│   └── verification/    # License/ID verification
├── services/            # Backend service layer (Supabase)
│   ├── authService.ts          # Sign up/in, session management
│   ├── bookingService.ts       # Booking CRUD
│   ├── listingService.ts       # Listing CRUD, fetch logic
│   ├── messagingService.ts     # Real-time messaging
│   ├── paymentService.ts       # Stripe payment/payout logic
│   ├── profileService.ts       # User profile CRUD
│   ├── hostAnalyticsService.ts # Dashboard analytics
│   └── calendarService.ts      # Availability blocking
├── stores/              # Zustand stores
│   └── authStore.ts     # Global auth state
├── lib/
│   ├── supabaseClient.ts   # Supabase client singleton
│   ├── smartMatching.ts    # Match scoring algorithm
│   └── availability.ts     # Date filtering utilities
├── data/                # Demo/mock data
├── neumo/               # Neumorphic UI component library
└── types.ts             # Shared TypeScript types

supabase/
└── migrations/          # Database schema migrations (001-012)
```

### Key Architectural Patterns

**1. Role-Based UI**
- App.tsx checks `profile.role` ('nurse' | 'host') to show different views
- Bottom nav adapts based on role
- Services enforce role-based permissions via Supabase RLS

**2. Service Layer Pattern**
- All Supabase interactions go through `services/` modules
- Each service exports typed functions (e.g., `bookingService.createBooking()`)
- Services handle RLS policies, error handling, and type transformations

**3. Centralized Supabase Client**
- Single client instance in `lib/supabaseClient.ts`
- Configured with session persistence and auto-refresh
- All services import from this file (avoid duplicate clients)

**4. Zustand Auth Store**
- `stores/authStore.ts` manages user, profile, session state
- `authService.initialize()` called on app mount to restore session
- Use `useAuthStore()` hook to access auth state anywhere

**5. Smart Matching System**
- `lib/smartMatching.ts` calculates 0-100 match scores
- Factors: location proximity, price fit, amenities, availability
- Listings get color-coded badges and "match reasons"
- Filter by match quality (All / Great+ / Perfect)

**6. Real-Time Messaging**
- `messagingService.ts` handles thread creation, message sending
- Supabase real-time subscriptions for live updates
- Threads auto-created when host accepts booking
- UI components in `components/messaging/` (ready for integration)

**7. PWA Configuration**
- `vite.config.ts` configures PWA manifest and service worker
- Icons in `public/icons/`
- Offline caching strategy configured

### Database Schema

Key tables (see `supabase/migrations/`):

- **profiles**: User profiles with role, name, bio, verification status
- **listings**: Property listings with location, amenities, pricing
- **bookings**: Booking requests with status tracking (pending/accepted/declined/cancelled)
- **message_threads**: Conversation containers
- **messages**: Real-time messages with attachments
- **listing_availability**: Calendar blocking for hosts
- **saved_searches**: Saved search criteria with alerts
- **reviews**: Rating and review system
- **verification_documents**: License/ID upload tracking

All tables use Row-Level Security (RLS) policies for access control.

### Data Flow Examples

**Nurse Booking Flow:**
1. Nurse browses listings with match scores (App.tsx)
2. Clicks "Request to Book" → BookingRequestForm component
3. `bookingService.createBooking()` creates booking (status: pending)
4. Host sees request in HostDashboard → BookingRequests component
5. Host accepts → `bookingService.updateStatus()` + auto-create message thread
6. Nurse pays → PaymentModal → `paymentService.createPaymentIntent()`
7. Booking status → "completed", host gets payout scheduled

**Host Listing Creation:**
1. Host clicks "Create Listing" in HostDashboard
2. CreateListingForm (4-step wizard: info, location, amenities, photos)
3. Images uploaded to Supabase Storage
4. `listingService.createListing()` saves to database
5. Dashboard refreshes with new listing

**Smart Matching:**
1. Nurse completes onboarding → saves preferences to localStorage
2. SearchFlow applies filters + preferences
3. `smartMatching.ts` scores each listing (0-100)
4. Listings sorted by score, badges added
5. Perfect matches (90+) get special section

## Important Notes

### Demo vs. Production Data
- `App.tsx` has `USE_SUPABASE_LISTINGS` flag (currently false)
- When false: uses `data/demoListings.ts` for rapid UI development
- When true: fetches from Supabase via `listingService.fetchListings()`
- Switch to true when database is seeded with real listings

### Stripe Integration Status
- Frontend payment UI is built (PaymentModal, PayoutSettings)
- Backend payment intent creation needs serverless function
- See `STRIPE_SETUP.md` and `STRIPE_QUICK_START.md` for setup
- Platform fee: 10% (configured in `paymentService.ts`)
- Host payouts use Stripe Connect (Express accounts)

### Authentication Flow
- `authService.initialize()` called in App.tsx on mount
- Checks for existing session, fetches profile
- `useAuthStore` provides reactive auth state
- Sign out clears session + redirects to login

### Onboarding
- Nurse onboarding: collects preferences (location, dates, budget, room type)
- Host onboarding: collects property type and verification info
- Stored in localStorage + Supabase profiles table
- `onboardingCompleted` Set tracks which users finished onboarding

### Map Integration
- Mapbox token required in `.env.local`
- Map component in `components/Map.tsx`
- Markers for listings and hospitals
- Click markers to view details

### Migration Management
- All migrations in `supabase/migrations/`
- Named sequentially: 001, 002, 003...
- Apply via `npx supabase db push` or helper script
- Latest migration: 012 (fix bookings table)

### Testing Credentials
- Use test Stripe keys (pk_test_...) for development
- Supabase project: fhwyvxdhdklntaaztjoz (see .env.example)
- Mapbox token provided in .env.example

### Style Guide
- Custom neumorphic design system (not Material UI or Tailwind components)
- Gradient backgrounds, soft shadows
- Mobile-first, touch-optimized
- Airbnb-inspired card layouts
- Color scheme: purple/pink gradients (#8f63ff, #e3d4ff)

### Type Safety
- Strict TypeScript enabled
- All types in `types.ts` (Listing, Booking, UserProfile, etc.)
- Database row types separate from domain types
- Services transform rows → domain models

### Common Gotchas
- Always import from `lib/supabaseClient.ts`, not create new clients
- RLS policies require user to be authenticated (check session)
- Listings need `host_id` to enforce host-only edits
- Booking status transitions: pending → accepted → completed
- Message threads auto-created on booking acceptance
- Match scores only calculated when preferences exist
- Calendar availability separate from booking availability

## Feature Roadmap

Features organized by complexity and estimated implementation time:

### Quick Wins (30min - 2hrs each)

**Photo Gallery for Listings**
- Add swipeable photo carousel to listing cards
- Replace single image with multi-photo viewer
- Touch/swipe gestures for mobile
- Impact: Much better UX in swipe mode

**Filter Persistence**
- Save user's last search filters to localStorage
- Auto-restore on app reload
- Improve UX by maintaining context
- Files: App.tsx, add new localStorage helpers

**Skeleton Loading States**
- Add loading skeletons for listings feed
- Better perceived performance
- Replace empty states with animated placeholders
- Files: Add skeleton components, update App.tsx

**Toast Notification Polish**
- Better success/error messaging throughout app
- More descriptive messages
- Add progress toasts for long operations
- Files: Use existing react-hot-toast, enhance messages

### Medium Features (2-4hrs each)

**Real-Time Notifications**
- Use Supabase real-time subscriptions
- Show when hosts respond to booking requests
- Badge counts on bottom nav icons
- Desktop/mobile push notifications
- Files: Create notificationService.ts, update BookingRequests.tsx, MyBookings.tsx

**Advanced Amenity Filters**
- Add filters for parking, laundry, pet-friendly, furnished
- Multi-select UI with pill buttons
- Update match scoring to include amenity preferences
- Files: App.tsx, smartMatching.ts, add filter state

**Saved Searches with Alerts**
- Let users save search criteria
- Get notified when new matches appear
- Email/push notifications for new listings
- Files: Add savedSearchService.ts, new SavedSearches component

**Enhanced Messaging Features**
- File attachments (photos, PDFs)
- Read receipts and typing indicators
- Message reactions
- Files: messagingService.ts, MessagingContainer updates

**Photo Uploads for Hosts**
- Replace URL inputs with drag-and-drop uploader
- Use Supabase Storage buckets
- Image optimization and resizing
- Multiple photos per listing
- Files: CreateListingForm, add photoService.ts

**Listing Edit/Delete for Hosts**
- Complete CRUD operations
- Edit listing modal with form pre-fill
- Soft delete with confirmation
- Files: Add EditListingForm component, update listingService.ts

### Bigger Features (4-8hrs each)

**Complete Stripe Payment Flow**
- Backend serverless function for payment intents
- 3D Secure / SCA compliance
- Webhook handlers for payment events
- Test mode vs production mode
- Files: Add Netlify/Vercel functions, update paymentService.ts

**Reviews & Ratings System**
- Post-stay review submission
- Star ratings + text reviews
- Display on listing cards and detail modal
- Host response to reviews
- Files: Add reviewService.ts, Review components, update database

**Calendar Sync**
- Export bookings to Google Calendar
- iCal feed generation
- Automatic reminders
- Timezone handling
- Files: Add calendarSyncService.ts, Calendar integration

**Referral Program**
- Invite friends, earn credits
- Unique referral codes
- Track conversions
- Credit system for discounts
- Files: Add referralService.ts, Referral components, database tables

**Smart Recommendations Engine**
- "You might also like" based on swipe history
- Machine learning or rule-based
- Track user interactions (likes, views, bookings)
- Personalized homepage
- Files: Add recommendationService.ts, update App.tsx

**Advanced Search Features**
- Commute time calculator
- Map boundary filtering (draw on map)
- Hospital proximity search
- Distance-based sorting
- Files: Update SearchFlow, add map drawing tools

**Email Notification System**
- Booking confirmations
- Host response alerts
- Payment receipts
- Contract reminders (start date approaching)
- Files: Add email templates, Supabase Edge Functions

**Mobile App Enhancements**
- Improve PWA install prompts
- Add app shortcuts
- Offline mode with cached data
- Background sync
- Files: Update vite.config.ts, add service worker logic

**Host Verification System**
- ID/address verification
- Background checks integration
- Trust badges on listings
- Manual review workflow
- Files: Add verificationService.ts, admin dashboard

**Price Intelligence**
- Show price trends for area
- "Great deal" badges for below-market prices
- Dynamic pricing recommendations for hosts
- Market insights dashboard
- Files: Add priceAnalyticsService.ts, update HostDashboard

### Technical Debt / Infrastructure

**Testing Infrastructure**
- Add Vitest unit tests for services
- React Testing Library for components
- E2E tests with Playwright
- CI/CD pipeline integration

**Performance Optimization**
- Code splitting and lazy loading
- Image optimization (WebP, responsive images)
- Bundle size analysis and reduction
- Lighthouse score improvements

**Accessibility**
- ARIA labels and roles
- Keyboard navigation
- Screen reader testing
- WCAG 2.1 AA compliance

**Error Tracking**
- Sentry or similar integration
- User feedback widget
- Error boundary components
- Better error messages

**Analytics**
- User behavior tracking
- Conversion funnel analysis
- A/B testing framework
- Dashboard for metrics

## Recommended Next Steps

Based on current app maturity, prioritize:

1. **Real-time notifications** - Makes booking flow feel alive and responsive
2. **Photo gallery** - Big UX upgrade for swipe experience
3. **Advanced filters** - Helps users find exactly what they need
4. **Complete payment flow** - Unlock revenue generation
5. **Reviews system** - Build trust and social proof

These features have high impact and build on existing infrastructure.
