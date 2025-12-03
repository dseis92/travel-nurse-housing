# New Features Implementation Guide

This document describes the three new features added to the travel nurse housing platform.

## 1. 🗺️ Real Map Integration with Mapbox

### Setup

1. Get a free Mapbox token:
   - Visit https://account.mapbox.com/access-tokens/
   - Create a new token (or use the default public token)

2. Add to your `.env` file:
   ```env
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   ```

### Usage

The map is already integrated into the app! Users can:
- Click the "Map" view toggle to see listings on an interactive map
- Click price markers to see listing details in a popup
- Click the marker or popup to open the full listing detail modal
- The map automatically fits bounds to show all available listings

### Files

- `src/components/Map.tsx` - Main map component
- `src/App.tsx:704-707` - Integration point in the app

### Customization

The map markers are styled to match your design with:
- Teal/peach gradient pins
- Price display on each marker
- Smooth hover animations
- Custom popups with listing info

---

## 2. 💬 Messaging System

### Components

**MessageThread** (`src/components/messaging/MessageThread.tsx`)
- Real-time chat interface between nurse and host
- Auto-scrolling to latest messages
- Send messages with Enter key
- Beautiful neumorphic design matching your app

**MessageList** (`src/components/messaging/MessageList.tsx`)
- Shows all conversation threads
- Unread message indicators
- Last message preview
- Click to open full conversation

### Service API

**messagingService** (`src/services/messagingService.ts`)

```typescript
import { messagingService } from './services/messagingService'

// Get all threads for a user
const threads = await messagingService.getUserThreads(userId)

// Get messages in a thread
const messages = await messagingService.getThreadMessages(threadId)

// Send a message
const message = await messagingService.sendMessage(threadId, userId, 'Hello!')

// Find or create thread between two users
const thread = await messagingService.findOrCreateThread(
  nurseId,
  hostId,
  listingId
)

// Subscribe to real-time messages
const unsubscribe = messagingService.subscribeToThread(
  threadId,
  (message) => {
    console.log('New message:', message)
  }
)

// Cleanup when done
unsubscribe()
```

### Database Schema Required

You'll need these Supabase tables:

```sql
-- Message threads
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids TEXT[] NOT NULL,
  listing_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  attachments TEXT[],
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Integration Example

```typescript
import { MessageThread } from './components/messaging/MessageThread'
import { MessageList } from './components/messaging/MessageList'

// Show message list
<MessageList
  threads={threads}
  currentUserId={currentUser.id}
  getUserById={(id) => users.find(u => u.id === id)}
  onSelectThread={(threadId) => setActiveThreadId(threadId)}
  onClose={() => setShowMessages(false)}
/>

// Show specific conversation
<MessageThread
  messages={messages}
  currentUserId={currentUser.id}
  otherUser={otherUser}
  onSendMessage={async (body) => {
    await messagingService.sendMessage(threadId, currentUser.id, body)
  }}
  onClose={() => setActiveThreadId(null)}
/>
```

---

## 3. 🎯 Smart Matching Algorithm

### Usage

```typescript
import {
  calculateMatchScore,
  sortByMatchScore,
  getTopMatches,
  getMatchLabel,
  getMatchColor
} from './lib/smartMatching'

// Define user preferences
const preferences = {
  location: 'Minneapolis',
  maxBudget: 3000,
  roomType: 'private-room',
  startDate: '2025-01-15',
  endDate: '2025-04-15',
  preferredAmenities: ['wifi', 'parking', 'washer'],
  maxDistance: 15, // miles to hospital
}

// Calculate match score for a single listing
const matchScore = calculateMatchScore(listing, preferences)
// {
//   overall: 92,
//   breakdown: { location: 25, price: 22, amenities: 20, availability: 25 },
//   reasons: [
//     '🎯 Perfect match for you!',
//     'Perfect location match near Abbott Northwestern Hospital',
//     'Great value - $600 under budget'
//   ],
//   isPerfectMatch: true
// }

// Sort all listings by match score
const rankedListings = sortByMatchScore(allListings, preferences)
// Returns listings with matchScore attached, highest first

// Get only perfect matches (90+ score)
const perfectMatches = getTopMatches(allListings, preferences)

// Display match quality
const label = getMatchLabel(matchScore.overall) // "Perfect Match"
const color = getMatchColor(matchScore.overall) // "#10B981" (green)
```

### Scoring Breakdown

**Location (0-25 points)**
- 25 pts: City/hospital name match + close distance
- 15 pts: State match
- 5 pts: No match
- Bonus: +5 pts if ≤10 min to hospital

**Price (0-25 points)**
- 25 pts: ≤70% of budget (shows savings)
- 20 pts: 70-85% of budget
- 15 pts: 85-100% of budget
- 5 pts: 100-115% of budget (slightly over)
- 0 pts: >115% of budget

**Amenities (0-25 points)**
- Based on percentage of preferred amenities matched
- +5 bonus if room type matches exactly
- +3 bonus for highly rated listings (4.8+ stars)

**Availability (0-25 points)**
- 25 pts: Available for requested dates
- 0 pts: Not available
- 15 pts: No dates specified (neutral)

### Match Labels

- 90-100: "Perfect Match" (green #10B981)
- 75-89: "Great Match" (teal #14B8A6)
- 60-74: "Good Match" (blue #3B82F6)
- 40-59: "Decent Match" (amber #F59E0B)
- 0-39: "Consider" (gray #6B7280)

### Display Examples

```typescript
// Show match badge on listing card
<div style={{
  background: getMatchColor(listing.matchScore.overall),
  padding: '4px 10px',
  borderRadius: 999,
  color: 'white',
  fontSize: 11,
  fontWeight: 600
}}>
  {getMatchLabel(listing.matchScore.overall)}
</div>

// Show match reasons
{listing.matchScore.reasons.map(reason => (
  <div key={reason} style={{ fontSize: 11, color: '#6b7280' }}>
    {reason}
  </div>
))}

// Show detailed breakdown
<div>
  <div>Location: {listing.matchScore.breakdown.location}/25</div>
  <div>Price: {listing.matchScore.breakdown.price}/25</div>
  <div>Amenities: {listing.matchScore.breakdown.amenities}/25</div>
  <div>Availability: {listing.matchScore.breakdown.availability}/25</div>
</div>
```

---

## Next Steps

1. **Enable Mapbox**: Add your token to `.env`
2. **Set up database**: Create the message tables in Supabase
3. **Integrate matching**: Use `sortByMatchScore()` in your listing views
4. **Add messaging UI**: Integrate MessageList and MessageThread components where nurses and hosts can communicate

All three features are production-ready and designed to match your existing neumorphic design system!
