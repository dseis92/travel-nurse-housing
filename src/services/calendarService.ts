import { supabase } from '../lib/supabaseClient'

export interface AvailabilityEntry {
  id: string
  listingId: string
  startDate: string
  endDate: string
  status: 'available' | 'blocked' | 'booked'
  notes?: string
  bookingId?: string
  createdAt: string
  updatedAt: string
}

export interface DateStatus {
  date: string
  status: 'available' | 'blocked' | 'booked'
}

export interface BlockDatesInput {
  listingId: string
  startDate: string
  endDate: string
  notes?: string
}

export const calendarService = {
  /**
   * Get availability for a listing in a specific month
   */
  async getListingAvailability(
    listingId: string,
    year: number,
    month: number
  ): Promise<DateStatus[]> {
    const { data, error } = await supabase.rpc('get_listing_available_dates', {
      p_listing_id: listingId,
      p_year: year,
      p_month: month,
    })

    if (error) throw error

    return (
      data?.map((row: any) => ({
        date: row.date_value,
        status: row.status as 'available' | 'blocked' | 'booked',
      })) || []
    )
  },

  /**
   * Check if a listing is available for given dates
   */
  async checkAvailability(
    listingId: string,
    startDate: string,
    endDate: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_listing_availability', {
      p_listing_id: listingId,
      p_start_date: startDate,
      p_end_date: endDate,
    })

    if (error) throw error

    return data as boolean
  },

  /**
   * Block dates for a listing (host only)
   */
  async blockDates(input: BlockDatesInput): Promise<AvailabilityEntry> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify the user owns the listing
    const { data: listing } = await supabase
      .from('listings')
      .select('host_id')
      .eq('id', input.listingId)
      .single()

    if (!listing || listing.host_id !== user.id) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('listing_availability')
      .insert({
        listing_id: input.listingId,
        start_date: input.startDate,
        end_date: input.endDate,
        status: 'blocked',
        notes: input.notes,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      listingId: data.listing_id,
      startDate: data.start_date,
      endDate: data.end_date,
      status: data.status,
      notes: data.notes,
      bookingId: data.booking_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  /**
   * Unblock dates (delete availability entry)
   */
  async unblockDates(availabilityId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get the availability entry to verify ownership
    const { data: availability } = await supabase
      .from('listing_availability')
      .select('listing_id, status')
      .eq('id', availabilityId)
      .single()

    if (!availability) throw new Error('Availability entry not found')

    // Don't allow unblocking booked dates
    if (availability.status === 'booked') {
      throw new Error('Cannot unblock dates that are booked')
    }

    // Verify ownership
    const { data: listing } = await supabase
      .from('listings')
      .select('host_id')
      .eq('id', availability.listing_id)
      .single()

    if (!listing || listing.host_id !== user.id) {
      throw new Error('Unauthorized')
    }

    const { error } = await supabase
      .from('listing_availability')
      .delete()
      .eq('id', availabilityId)

    if (error) throw error
  },

  /**
   * Get all blocked dates for a listing
   */
  async getBlockedDates(listingId: string): Promise<AvailabilityEntry[]> {
    const { data, error } = await supabase
      .from('listing_availability')
      .select('*')
      .eq('listing_id', listingId)
      .eq('status', 'blocked')
      .order('start_date', { ascending: true })

    if (error) throw error

    return (
      data?.map((row: any) => ({
        id: row.id,
        listingId: row.listing_id,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        notes: row.notes,
        bookingId: row.booking_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) || []
    )
  },

  /**
   * Get all booked dates for a listing
   */
  async getBookedDates(listingId: string): Promise<AvailabilityEntry[]> {
    const { data, error } = await supabase
      .from('listing_availability')
      .select('*')
      .eq('listing_id', listingId)
      .eq('status', 'booked')
      .order('start_date', { ascending: true })

    if (error) throw error

    return (
      data?.map((row: any) => ({
        id: row.id,
        listingId: row.listing_id,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        notes: row.notes,
        bookingId: row.booking_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) || []
    )
  },

  /**
   * Get all availability entries for a listing (blocked + booked)
   */
  async getAllAvailability(listingId: string): Promise<AvailabilityEntry[]> {
    const { data, error } = await supabase
      .from('listing_availability')
      .select('*')
      .eq('listing_id', listingId)
      .order('start_date', { ascending: true })

    if (error) throw error

    return (
      data?.map((row: any) => ({
        id: row.id,
        listingId: row.listing_id,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        notes: row.notes,
        bookingId: row.booking_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) || []
    )
  },
}
