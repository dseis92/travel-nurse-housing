# NightShift Housing – Travel Nurse Stays

Sleek, nurse-first housing finder inspired by AirBnB/VRBO with modern styling, quick filters, and trust signals tailored to clinicians on contract.

## What’s inside
- React + TypeScript + Vite + Tailwind v4, Zustand for lightweight state.
- Hero stats, trust/safety cards, and host CTA to mirror top-tier rental flows.
- Expanded filters: budget, guests, room type, contract length (4/8/13 weeks), commute slider, verified-host toggle, quick amenity pills (parking, pets, Wi‑Fi, washer/dryer, desk, cleaning, security), and save-search action.
- Listing upgrades: richer mock data with amenities, pricing breakdowns, discounts, ratings, availability dates, contract-length tags, save/favorite toggles, and sorting (best fit/price/commute).
- Map preview and neighborhood stats block teeing up live maps, ETA bands, lighting/safety overlays.
- Host onboarding spotlight plus booking/payments + trust/safety panels (ID, messaging, reviews, payouts/cancellation scaffolding).

## Getting started
```bash
npm install
npm run dev
```
Open the printed localhost URL to explore the UI. Build with `npm run build`; lint with `npm run lint`.

## Current UX highlights
- Hero section with travel nurse value props and fast stats.
- Modern search panel in a glassy card plus quick-filter pills for nurse-priority amenities.
- Card grid with hover states, saved indicator, verified-host badge, amenities, and availability context.
- Saved searches module so you can rerun searches quickly.
- Side rail featuring map preview, safety/support assurances, booking breakdown, and trust/comms highlights.
- Host section to drive new supply with safety/insurance messaging and payouts callouts.

## Next steps
1) Connect to real listings + hospitals (Supabase/Firestore) and surface live commute times.  
2) Replace map placeholder with Maps SDK showing ETA bands, lighting scores, and crime heat.  
3) Add auth + profiles for guests/hosts; persist favorites and saved searches; host dashboard + calendar/blackout management.  
4) Full booking engine: request/instant book, secure payments (Stripe), refunds/cancellations per listing, receipts, and payouts reporting.  
5) In-app messaging, verification flows (RN license/ID), and review system tuned for shift work and safety.  
6) Monitoring: analytics, error tracking, performance budgets, and e2e tests for search/filter/book flows.  
# travel-nurse-housing
