import { supabase } from '../lib/supabaseClient'

export interface ListingPerformance {
  listingId: string
  listingTitle: string
  viewCount: number
  favoriteCount: number
  bookingCount: number
  reviewCount: number
  averageRating: number
  totalEarnings: number
  occupancyRate: number
}

export interface EarningsOverview {
  totalEarnings: number
  pendingPayout: number
  thisMonthEarnings: number
  lastMonthEarnings: number
  upcomingEarnings: number
}

export interface BookingRequest {
  id: string
  listingId: string
  listingTitle: string
  guestId: string
  guestName: string
  guestAvatarUrl?: string
  startDate: string
  endDate: string
  totalPrice: number
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  createdAt: string
  holdExpiresAt?: string
}

export interface DashboardStats {
  totalListings: number
  activeListings: number
  totalBookings: number
  pendingRequests: number
  averageRating: number
  totalReviews: number
}

export const hostAnalyticsService = {
  /**
   * Get overall dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get listing counts
    const { data: listings } = await supabase
      .from('listings')
      .select('id, status')
      .eq('host_id', user.id)

    const totalListings = listings?.length || 0
    const activeListings = listings?.filter(l => l.status === 'active').length || 0

    // Get booking counts
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('listing_id', listings?.map(l => l.id) || [])

    const { count: pendingRequests } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('listing_id', listings?.map(l => l.id) || [])
      .eq('status', 'pending')

    // Get review stats
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .in('listing_id', listings?.map(l => l.id) || [])

    const totalReviews = reviews?.length || 0
    const averageRating = reviews?.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return {
      totalListings,
      activeListings,
      totalBookings: totalBookings || 0,
      pendingRequests: pendingRequests || 0,
      averageRating,
      totalReviews,
    }
  },

  /**
   * Get earnings overview
   */
  async getEarningsOverview(): Promise<EarningsOverview> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get all completed bookings for this host
    const { data: listings } = await supabase
      .from('listings')
      .select('id')
      .eq('host_id', user.id)

    const listingIds = listings?.map(l => l.id) || []

    const { data: completedBookings } = await supabase
      .from('bookings')
      .select('total_price, payout, start_date, end_date, created_at')
      .in('listing_id', listingIds)
      .eq('status', 'accepted')

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    let totalEarnings = 0
    let pendingPayout = 0
    let thisMonthEarnings = 0
    let lastMonthEarnings = 0
    let upcomingEarnings = 0

    completedBookings?.forEach((booking) => {
      const payout = booking.payout || 0
      const endDate = new Date(booking.end_date)
      const createdAt = new Date(booking.created_at)

      totalEarnings += payout

      // If booking hasn't ended yet, it's upcoming
      if (endDate > now) {
        upcomingEarnings += payout
      } else {
        // Assume payout happens 7 days after booking ends
        const payoutDate = new Date(endDate)
        payoutDate.setDate(payoutDate.getDate() + 7)

        if (payoutDate > now) {
          pendingPayout += payout
        }
      }

      // This month earnings
      if (createdAt >= thisMonthStart) {
        thisMonthEarnings += payout
      }

      // Last month earnings
      if (createdAt >= lastMonthStart && createdAt <= lastMonthEnd) {
        lastMonthEarnings += payout
      }
    })

    return {
      totalEarnings,
      pendingPayout,
      thisMonthEarnings,
      lastMonthEarnings,
      upcomingEarnings,
    }
  },

  /**
   * Get performance data for all listings
   */
  async getListingPerformance(): Promise<ListingPerformance[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: listings } = await supabase
      .from('listings')
      .select('id, title')
      .eq('host_id', user.id)

    if (!listings || listings.length === 0) {
      return []
    }

    const performance: ListingPerformance[] = []

    for (const listing of listings) {
      // Get booking stats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_price, payout, status')
        .eq('listing_id', listing.id)

      const bookingCount = bookings?.length || 0
      const totalEarnings = bookings?.reduce((sum, b) => sum + (b.payout || 0), 0) || 0

      // Get review stats
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('listing_id', listing.id)

      const reviewCount = reviews?.length || 0
      const averageRating = reviews?.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

      // Note: View count and favorite count would require tracking tables
      // For now, returning placeholder values
      performance.push({
        listingId: listing.id,
        listingTitle: listing.title,
        viewCount: 0, // Would need view tracking
        favoriteCount: 0, // Would need favorite tracking
        bookingCount,
        reviewCount,
        averageRating,
        totalEarnings,
        occupancyRate: 0, // Would need calendar data
      })
    }

    return performance
  },

  /**
   * Get booking requests for host
   */
  async getBookingRequests(status?: 'pending' | 'accepted' | 'declined'): Promise<BookingRequest[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get host's listings
    const { data: listings } = await supabase
      .from('listings')
      .select('id, title')
      .eq('host_id', user.id)

    if (!listings || listings.length === 0) {
      return []
    }

    const listingMap = new Map(listings.map(l => [l.id, l.title]))

    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        id,
        listing_id,
        guest_id,
        start_date,
        end_date,
        total_price,
        status,
        created_at,
        hold_expires_at
      `)
      .in('listing_id', listings.map(l => l.id))
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: bookings, error } = await query

    if (error) throw error
    if (!bookings) return []

    // Get guest profiles
    const guestIds = [...new Set(bookings.map(b => b.guest_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', guestIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    return bookings.map((booking) => {
      const profile = profileMap.get(booking.guest_id)
      return {
        id: booking.id,
        listingId: booking.listing_id,
        listingTitle: listingMap.get(booking.listing_id) || 'Unknown Listing',
        guestId: booking.guest_id,
        guestName: profile?.name || 'Guest',
        guestAvatarUrl: profile?.avatar_url,
        startDate: booking.start_date,
        endDate: booking.end_date,
        totalPrice: booking.total_price || 0,
        status: booking.status as BookingRequest['status'],
        createdAt: booking.created_at,
        holdExpiresAt: booking.hold_expires_at,
      }
    })
  },

  /**
   * Accept a booking request
   */
  async acceptBooking(bookingId: string): Promise<void> {
    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('nurse_id, host_id, listing_id')
      .eq('id', bookingId)
      .single()

    if (!booking) throw new Error('Booking not found')

    // Update booking status
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', bookingId)

    if (error) throw error

    // Create message thread if it doesn't exist
    try {
      // Check if thread already exists
      const { data: existingThreads } = await supabase
        .from('message_threads')
        .select('id')
        .eq('listing_id', booking.listing_id)
        .contains('participant_ids', [booking.nurse_id, booking.host_id])

      if (!existingThreads || existingThreads.length === 0) {
        // Create new thread
        const { error: threadError } = await supabase
          .from('message_threads')
          .insert({
            listing_id: booking.listing_id,
            participant_ids: [booking.nurse_id, booking.host_id],
          })

        if (threadError) {
          console.error('Failed to create message thread:', threadError)
          // Don't throw - booking was already accepted
        }
      }
    } catch (err) {
      console.error('Error creating message thread:', err)
      // Don't throw - booking was already accepted
    }
  },

  /**
   * Decline a booking request
   */
  async declineBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'declined' })
      .eq('id', bookingId)

    if (error) throw error
  },
}
