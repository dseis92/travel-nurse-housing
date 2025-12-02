NightShift Housing — Mobile-First Travel Nurse Housing App

Airbnb-style housing marketplace for travel nurses & hosts

Tech Stack: React + TypeScript + Vite + Custom Neumorphic UI + Zero Backend

⸻

🚀 Project Overview

NightShift Housing is a mobile-first, app-like React application designed specifically for travel nurses to find safe, reliable mid-term housing near hospitals. The app mimics the Airbnb mobile experience while adding nurse-specific workflows, filters, onboarding, and user flows.

It also includes host tools, allowing property owners to list and manage nurse-friendly housing.

This project is structured as a single-page React application using:
	•	React 18
	•	TypeScript
	•	Vite
	•	Custom Neumorphism UI Kit
	•	LocalStorage state persistence
	•	Fully client-side logic (no backend yet)
	•	Lightweight modal + animation engine

The UI is heavily influenced by Airbnb Mobile, but themed in a gradient, soft-neumorphic aesthetic.

This repository represents a fully interactive prototype ready to be converted into a production app (React Native, Expo, or full-stack Next.js).

⸻

🌟 Core Features / What’s Already Built

Everything below is already implemented in the current codebase.

⸻

✅ 1. Role Selection Screen (“Who’s Signing In”)

Before entering the app, the user chooses:
	•	👩‍⚕️ Travel Nurse
	•	🏡 Host

This determines the UI and available tools.

The user can switch roles later through the bottom nav → Profile.

⸻

✅ 2. Nurse Onboarding System

A mobile, multi-step onboarding flow that stores preferences in localStorage:
	•	Name
	•	Assignment location
	•	Contract start/end dates
	•	Budget
	•	Preferred room type

These preferences feed into the housing recommendation engine.

⸻

✅ 3. Housing Feed (Airbnb-style grouped listings)

The home feed displays property cards that are:
	•	grouped into section categories (like Airbnb)
	•	scrollable
	•	filterable
	•	visually neumorphic
	•	fully interactive

Each listing includes:
	•	Image
	•	Rating & review count
	•	Tags (“Guest Favorite”, “Walk to lake”)
	•	Price per month
	•	Distance to hospital
	•	Room type
	•	Amenities

⸻

✅ 4. Listing Detail Modal (Airbnb mobile layout)

A full-screen sheet with:
	•	Entry + exit slide/fade animations
	•	Large hero image
	•	Favorite button
	•	Rating badge
	•	Pricing block
	•	Amenities grid
	•	Perks section
	•	Nurse-specific tips
	•	A fake calendar preview UI
	•	Static map preview with location callout
	•	“Request to Book” bottom bar

This modal overlays the entire app and dims the background.

⸻

✅ 5. Search Flow (Start Your Search)

A dedicated interactive 3-step search flow:

Step 1 — Where

Ask for city / hospital.

Step 2 — When

(Date fields included but availability logic not yet implemented)

Step 3 — Who

Currently very simple (e.g. pets / basic occupancy).

✔ After completion the home feed automatically filters results.
✔ Feed scrolls to the top automatically.

⸻

✅ 6. Filtering Engine (React useMemo)

Properties can be filtered by:
	•	City / State / Hospital name
	•	Max budget
	•	Room type
	•	Contract dates
	•	Favorites only

If filters produce zero results, the feed falls back to all listings (never blank).

⸻

✅ 7. Favorites System

Every card has a heart icon.
Favorite state is stored in React state (no backend yet).

The bottom nav has a dedicated ❤️ Favorites tab.

⸻

✅ 8. Host Dashboard

When the user selects Host, they see a placeholder dashboard that will later become:
	•	Listing management
	•	Calendar
	•	Requests
	•	Messaging
	•	Earnings overview

The entire file is ready for expansion.

⸻

✅ 9. Bottom Navigation (App-like)

A bottom navigation bar that mimics mobile app UX:
	•	🏠 Home
	•	🔍 Search
	•	❤️ Favorites
	•	👤 Profile / Role Switcher

All tabs animate and update the main view.

⸻

✅ 10. Full Custom UI Kit (Neumorphic theme)

Custom reusable components in /src/neumo/NeumoKit:
	•	NeumoCard
	•	NeumoPill
	•	Search pill
	•	Gradient buttons
	•	Soft shadows
	•	Rounded frames
	•	neumorphic grid cards

The entire UI is built from this system.
📱 UI Philosophy & Design

The UI is engineered to feel like:

✔ A real mobile app
✔ Soft, gradient, relaxing visuals
✔ Airbnb-level card design
✔ Smooth modals & transitions
✔ Easy readability for healthcare workers on night shifts

⸻

🔧 Tech Stack

Frontend
	•	React 18
	•	TypeScript
	•	Vite
	•	Custom CSS (no frameworks)
	•	Inline styles + component styles
	•	Neumorphic UI Kit

State & Storage
	•	React useState, useEffect, useMemo
	•	LocalStorage (for onboarding data)

Animations
	•	Pure CSS transitions
	•	No animation libraries needed yet

No Backend
	•	No auth
	•	No API calls
	•	No database

Future-ready for:
	•	Supabase
	•	Firebase
	•	Express.js
	•	Next.js

⸻

🏁 Future Directions (for Codex)

Codex / future developers can expand into:

🔜 1. Real backend
	•	Supabase or Firebase for listings, users, favorites

🔜 2. Authentication
	•	Email login
	•	Nurse licensing verification
	•	Host verification

🔜 3. Real calendar availability
	•	Sync with contracts
	•	Host availability calendars

🔜 4. In-app messaging
	•	Nurse ↔ Host secure messaging

🔜 5. Map search (Google / Mapbox)

🔜 6. Payment integration
	•	Stripe Connect for hosts
	•	Secure booking fees

⸻

🧰 New scaffolding (in progress)
	•	Domain models for listings, bookings, messaging, payments, and verification now live in src/types.ts.
	•	Availability-aware demo listings moved to src/data/demoListings.ts with host verification, pet flags, contract lengths, and coordinates for future map search.
	•	Shared availability helper in src/lib/availability.ts so filters can respect contract windows.
	•	Platform services stub in src/services/platform.ts to centralize auth, bookings, payments, messaging, and map search calls; swap this out for Supabase/Firebase/Next.js when ready.

⸻

🔑 Summary for Developers

This project is:
	•	A mobile-first React prototype
	•	Using a custom-designed neumorphic UI system
	•	Includes listings, search, onboarding, host tools, favorites, and full listing details
	•	All logic is self-contained inside the React app
	•	No backend — but designed to scale into one

Codex should treat this project as:

👉 A fully working UX foundation that is ready to evolve into a production-grade mobile or web app.
