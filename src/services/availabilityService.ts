import { supabase } from '../lib/supabaseClient'

export type AvailabilityStatus = 'available' | 'blocked' | 'booked'
export type BlockReason = 'maintenance' | 'personal_use' | 'other'

export interface AvailabilityBlock {
  id: string
  listingId: string
  startDate: string
  endDate: string
  status: AvailabilityStatus
  bookingId?: string
  minStayNights?: number
  pricePerMonth?: number
  blockReason?: BlockReason
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface DayAvailability {
  date: string
  status: AvailabilityStatus
  pricePerMonth: number
  minStayNights: number
  bookingId?: string
}

export interface CalendarOverview {
  listingId: string
  listingTitle: string
  availableBlocks: number
  bookedBlocks: number
  blockedBlocks: number
  nextAvailableDate?: string
  lastAvailableDate?: string
}

export const availabilityService = {
  /**
   * Get all availability blocks for a listing
   */
  async getListingBlocks(listingId: string): Promise<AvailabilityBlock[]> {
    const { data, error } = await supabase
      .from('availability_blocks')
      .select('*')
      .eq('listing_id', listingId)
      .order('start_date', { ascending: true })

    if (error) throw error

    return (
      data?.map((block: any) => ({
        id: block.id,
        listingId: block.listing_id,
        startDate: block.start_date,
        endDate: block.end_date,
        status: block.status,
        bookingId: block.booking_id,
        minStayNights: block.min_stay_nights,
        pricePerMonth: block.price_per_month,
        blockReason: block.block_reason,
        notes: block.notes,
        createdAt: block.created_at,
        updatedAt: block.updated_at,
      })) || []
    )
  },

  /**
   * Get day-by-day availability for a listing
   */
  async getDayAvailability(
    listingId: string,
    startDate?: string,
    months: number = 12
  ): Promise<DayAvailability[]> {
    const { data, error } = await supabase.rpc('get_listing_availability', {
      p_listing_id: listingId,
      p_start_date: startDate || new Date().toISOString().split('T')[0],
      p_months: months,
    })

    if (error) throw error

    return (
      data?.map((day: any) => ({
        date: day.date,
        status: day.status,
        pricePerMonth: day.price_per_month,
        minStayNights: day.min_stay_nights,
        bookingId: day.booking_id,
      })) || []
    )
  },

  /**
   * Check if a date range is available
   */
  async isDateRangeAvailable(
    listingId: string,
    startDate: string,
    endDate: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_date_range_available', {
      p_listing_id: listingId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_exclude_booking_id: excludeBookingId || null,
    })

    if (error) throw error

    return data as boolean
  },

  /**
   * Block dates for a listing (host only)
   */
  async blockDates(
    listingId: string,
    startDate: string,
    endDate: string,
    blockReason: BlockReason = 'other',
    notes?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('block_dates', {
      p_listing_id: listingId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_block_reason: blockReason,
      p_notes: notes || null,
    })

    if (error) throw error

    return data as string
  },

  /**
   * Unblock dates (remove a block)
   */
  async unblockDates(blockId: string): Promise<void> {
    const { error } = await supabase.rpc('unblock_dates', {
      p_block_id: blockId,
    })

    if (error) throw error
  },

  /**
   * Create or update an availability block manually
   */
  async createAvailabilityBlock(
    block: Omit<
      AvailabilityBlock,
      'id' | 'createdAt' | 'updatedAt' | 'bookingId'
    >
  ): Promise<AvailabilityBlock> {
    const { data, error } = await supabase
      .from('availability_blocks')
      .insert({
        listing_id: block.listingId,
        start_date: block.startDate,
        end_date: block.endDate,
        status: block.status,
        min_stay_nights: block.minStayNights,
        price_per_month: block.pricePerMonth,
        block_reason: block.blockReason,
        notes: block.notes,
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
      bookingId: data.booking_id,
      minStayNights: data.min_stay_nights,
      pricePerMonth: data.price_per_month,
      blockReason: data.block_reason,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  /**
   * Update an availability block
   */
  async updateAvailabilityBlock(
    blockId: string,
    updates: Partial<
      Omit<AvailabilityBlock, 'id' | 'createdAt' | 'updatedAt' | 'listingId'>
    >
  ): Promise<AvailabilityBlock> {
    const updateData: any = {}

    if (updates.startDate) updateData.start_date = updates.startDate
    if (updates.endDate) updateData.end_date = updates.endDate
    if (updates.status) updateData.status = updates.status
    if (updates.minStayNights !== undefined)
      updateData.min_stay_nights = updates.minStayNights
    if (updates.pricePerMonth !== undefined)
      updateData.price_per_month = updates.pricePerMonth
    if (updates.blockReason) updateData.block_reason = updates.blockReason
    if (updates.notes !== undefined) updateData.notes = updates.notes

    const { data, error } = await supabase
      .from('availability_blocks')
      .update(updateData)
      .eq('id', blockId)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      listingId: data.listing_id,
      startDate: data.start_date,
      endDate: data.end_date,
      status: data.status,
      bookingId: data.booking_id,
      minStayNights: data.min_stay_nights,
      pricePerMonth: data.price_per_month,
      blockReason: data.block_reason,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  /**
   * Delete an availability block
   */
  async deleteAvailabilityBlock(blockId: string): Promise<void> {
    const { error } = await supabase
      .from('availability_blocks')
      .delete()
      .eq('id', blockId)

    if (error) throw error
  },

  /**
   * Get calendar overview for all host's listings
   */
  async getHostCalendarOverview(): Promise<CalendarOverview[]> {
    const { data, error } = await supabase
      .from('listing_calendar_overview')
      .select('*')
      .order('listing_title', { ascending: true })

    if (error) throw error

    return (
      data?.map((overview: any) => ({
        listingId: overview.listing_id,
        listingTitle: overview.listing_title,
        availableBlocks: overview.available_blocks || 0,
        bookedBlocks: overview.booked_blocks || 0,
        blockedBlocks: overview.blocked_blocks || 0,
        nextAvailableDate: overview.next_available_date,
        lastAvailableDate: overview.last_available_date,
      })) || []
    )
  },

  /**
   * Get booked dates for a listing (for calendar display)
   */
  async getBookedDates(
    listingId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ startDate: string; endDate: string; bookingId: string }[]> {
    let query = supabase
      .from('availability_blocks')
      .select('start_date, end_date, booking_id')
      .eq('listing_id', listingId)
      .eq('status', 'booked')
      .not('booking_id', 'is', null)

    if (startDate) {
      query = query.gte('end_date', startDate)
    }
    if (endDate) {
      query = query.lte('start_date', endDate)
    }

    const { data, error } = await query.order('start_date', { ascending: true })

    if (error) throw error

    return (
      data?.map((block: any) => ({
        startDate: block.start_date,
        endDate: block.end_date,
        bookingId: block.booking_id,
      })) || []
    )
  },

  /**
   * Get blocked dates for a listing (for calendar display)
   */
  async getBlockedDates(
    listingId: string,
    startDate?: string,
    endDate?: string
  ): Promise<
    {
      id: string
      startDate: string
      endDate: string
      blockReason?: BlockReason
      notes?: string
    }[]
  > {
    let query = supabase
      .from('availability_blocks')
      .select('id, start_date, end_date, block_reason, notes')
      .eq('listing_id', listingId)
      .eq('status', 'blocked')

    if (startDate) {
      query = query.gte('end_date', startDate)
    }
    if (endDate) {
      query = query.lte('start_date', endDate)
    }

    const { data, error } = await query.order('start_date', { ascending: true })

    if (error) throw error

    return (
      data?.map((block: any) => ({
        id: block.id,
        startDate: block.start_date,
        endDate: block.end_date,
        blockReason: block.block_reason,
        notes: block.notes,
      })) || []
    )
  },
}
