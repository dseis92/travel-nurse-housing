import { supabase } from '../lib/supabaseClient';

export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  listingId: number;
  nurseId: string;
  hostId: string;
  startDate: string;
  endDate: string;
  totalMonths: number;
  monthlyRate: number;
  totalPrice: number;
  status: BookingStatus;
  nurseMessage?: string;
  hostResponse?: string;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
  holdExpiresAt?: string;
}

export interface CreateBookingData {
  listingId: number;
  hostId: string;
  startDate: string;
  endDate: string;
  monthlyRate: number;
  nurseMessage?: string;
}

export const bookingService = {
  /**
   * Create a new booking request
   */
  async createBooking(data: CreateBookingData): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be signed in to create a booking');

      // Calculate total months and price
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const totalMonths = Number((diffDays / 30).toFixed(1));
      const totalPrice = Math.round(totalMonths * data.monthlyRate);

      const bookingData = {
        listing_id: data.listingId,
        nurse_id: user.id,
        host_id: data.hostId,
        start_date: data.startDate,
        end_date: data.endDate,
        total_months: totalMonths,
        monthly_rate: data.monthlyRate,
        total_price: totalPrice,
        nurse_message: data.nurseMessage,
        status: 'pending',
      };

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        booking: this.transformBooking(booking),
      };
    } catch (error: any) {
      console.error('Create booking error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create booking request',
      };
    }
  },

  /**
   * Get bookings for current user (nurse view)
   */
  async getMyBookings(): Promise<{ success: boolean; bookings?: Booking[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be signed in');

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('nurse_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        bookings: data.map(this.transformBooking),
      };
    } catch (error: any) {
      console.error('Get my bookings error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch bookings',
      };
    }
  },

  /**
   * Get booking requests for host
   */
  async getHostBookings(): Promise<{ success: boolean; bookings?: Booking[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be signed in');

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        bookings: data.map(this.transformBooking),
      };
    } catch (error: any) {
      console.error('Get host bookings error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch bookings',
      };
    }
  },

  /**
   * Accept a booking request (host)
   */
  async acceptBooking(bookingId: string, hostResponse?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'accepted',
          host_response: hostResponse,
        })
        .eq('id', bookingId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Accept booking error:', error);
      return {
        success: false,
        error: error.message || 'Failed to accept booking',
      };
    }
  },

  /**
   * Decline a booking request (host)
   */
  async declineBooking(bookingId: string, hostResponse?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'declined',
          host_response: hostResponse,
        })
        .eq('id', bookingId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Decline booking error:', error);
      return {
        success: false,
        error: error.message || 'Failed to decline booking',
      };
    }
  },

  /**
   * Cancel a booking (nurse)
   */
  async cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Cancel booking error:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel booking',
      };
    }
  },

  /**
   * Transform snake_case database fields to camelCase
   */
  transformBooking(data: any): Booking {
    return {
      id: data.id,
      listingId: data.listing_id,
      nurseId: data.nurse_id,
      hostId: data.host_id,
      startDate: data.start_date,
      endDate: data.end_date,
      totalMonths: data.total_months,
      monthlyRate: data.monthly_rate,
      totalPrice: data.total_price,
      status: data.status,
      nurseMessage: data.nurse_message,
      hostResponse: data.host_response,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      respondedAt: data.responded_at,
      holdExpiresAt: data.hold_expires_at,
    };
  },
};
