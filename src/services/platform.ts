import { autocompletePlaces, type PlaceSuggestion } from '../api/placesAutocomplete'
import { demoListings } from '../data/demoListings'
import { listingMatchesAvailability } from '../lib/availability'
import {
  type Booking,
  type Listing,
  type Message,
  type MessageThread,
  type PaymentQuote,
  type UserProfile,
  type UserRole,
} from '../types'

export type ListingFilters = {
  location?: string
  maxBudget?: number
  roomType?: Listing['roomType'] | 'any'
  startDate?: string
  endDate?: string
  onlyVerified?: boolean
  allowsPets?: boolean
  maxMinutes?: number
}

export type BookingRequestPayload = {
  listingId: number
  guestId: string
  startDate: string
  endDate: string
  message?: string
  guests?: number
  pets?: boolean
}

export type AuthResult = {
  user: UserProfile
  token: string
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function filterListings(filters: ListingFilters): Listing[] {
  const q = normalize(filters.location ?? '')
  const roomType = filters.roomType ?? 'any'

  return demoListings.filter((listing) => {
    if (q) {
      const city = normalize(listing.city)
      const state = normalize(listing.state)
      const hospital = normalize(listing.hospitalName)
      const cityState = normalize(`${listing.city}, ${listing.state}`)
      const matchesQuery =
        city.includes(q) || state.includes(q) || hospital.includes(q) || cityState.includes(q)
      if (!matchesQuery) return false
    }

    if (typeof filters.maxBudget === 'number' && listing.pricePerMonth > filters.maxBudget) {
      return false
    }

    if (roomType !== 'any' && listing.roomType !== roomType) {
      return false
    }

    if (
      filters.onlyVerified &&
      listing.verifiedHost !== undefined &&
      listing.verifiedHost === false
    ) {
      return false
    }

    if (filters.allowsPets && listing.allowsPets === false) {
      return false
    }

    if (
      typeof filters.maxMinutes === 'number' &&
      listing.minutesToHospital > filters.maxMinutes
    ) {
      return false
    }

    if (filters.startDate && filters.endDate) {
      const matches = listingMatchesAvailability(
        listing,
        filters.startDate,
        filters.endDate,
      )
      if (!matches) return false
    }

    return true
  })
}

// Lightweight local implementation. Can be swapped for Supabase/Firebase/Next.js API later.
export const platformServices = {
  async searchListings(filters: ListingFilters): Promise<Listing[]> {
    const results = filterListings(filters)
    return results.length === 0 ? demoListings : results
  },

  async authenticate(role: UserRole, email: string, name?: string): Promise<AuthResult> {
    const user: UserProfile = {
      id: `local-${role}-${email}`,
      role,
      name: name ?? email.split('@')[0],
      email,
      licenseStatus: role === 'nurse' ? 'pending' : undefined,
      hostVerificationStatus: role === 'host' ? 'pending' : undefined,
    }

    return {
      user,
      token: 'mock-token',
    }
  },

  async requestBooking(payload: BookingRequestPayload): Promise<Booking> {
    const now = new Date().toISOString()
    return {
      id: `booking-${payload.listingId}-${now}`,
      listingId: payload.listingId,
      guestId: payload.guestId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: 'pending',
      createdAt: now,
      holdExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      totalPrice: 0,
      payout: 0,
    }
  },

  async quotePayment(monthlyPrice: number): Promise<PaymentQuote> {
    const platformFee = Math.round(monthlyPrice * 0.08)
    const hostPayout = monthlyPrice - platformFee
    return {
      subtotal: monthlyPrice,
      platformFee,
      hostPayout,
      currency: 'USD',
    }
  },

  async fetchMessageThreads(userId: string): Promise<MessageThread[]> {
    return [
      {
        id: 'thread-demo',
        listingId: 1,
        participantIds: [userId, 'host-1'],
        lastMessage: {
          id: 'msg-1',
          threadId: 'thread-demo',
          senderId: 'host-1',
          body: 'Hi! Thanks for your interest — the unit is open for your dates.',
          createdAt: new Date().toISOString(),
        } as Message,
        unreadCount: 0,
      },
    ]
  },

  async sendMessage(threadId: string, senderId: string, body: string): Promise<Message> {
    return {
      id: `msg-${Date.now()}`,
      threadId,
      senderId,
      body,
      createdAt: new Date().toISOString(),
    }
  },

  async searchPlaces(input: string): Promise<PlaceSuggestion[]> {
    return autocompletePlaces(input)
  },
}
