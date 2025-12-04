import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { supabase } from '../lib/supabaseClient'

// This would be your Stripe publishable key from environment variables
// For now, using a placeholder - replace with actual key
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

export interface PaymentIntent {
  id: string
  clientSecret: string
  amount: number
  status: string
}

export interface PaymentInfo {
  bookingId: string
  amount: number
  platformFee: number
  hostPayout: number
  currency: string
}

export const paymentService = {
  /**
   * Calculate payment breakdown
   */
  calculatePayment(totalAmount: number): {
    subtotal: number
    platformFee: number
    hostPayout: number
  } {
    const subtotal = totalAmount
    const platformFee = Math.round(totalAmount * 0.10) // 10% platform fee
    const hostPayout = subtotal - platformFee

    return {
      subtotal,
      platformFee,
      hostPayout,
    }
  },

  /**
   * Create a payment intent for a booking
   * Note: In production, this should be done via a backend API for security
   */
  async createPaymentIntent(bookingId: string): Promise<PaymentIntent> {
    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          total_price,
          nurse_id,
          host_id,
          listing_id
        `)
        .eq('id', bookingId)
        .single()

      if (bookingError || !booking) {
        throw new Error('Booking not found')
      }

      const payment = this.calculatePayment(booking.total_price)

      // IMPORTANT: This is a mock implementation
      // In production, create payment intents on your backend using Stripe's server SDK
      const mockPaymentIntent = {
        id: `pi_mock_${Date.now()}`,
        clientSecret: `pi_mock_${Date.now()}_secret_mock`,
        amount: payment.subtotal,
        status: 'requires_payment_method',
      }

      // Store payment info in database (optional if payments table exists)
      try {
        await supabase.from('payments').insert({
          booking_id: bookingId,
          stripe_payment_intent_id: mockPaymentIntent.id,
          amount: payment.subtotal,
          platform_fee: payment.platformFee,
          host_payout: payment.hostPayout,
          currency: 'usd',
          status: 'pending',
        })
      } catch (err) {
        console.log('Payments table may not exist yet:', err)
      }

      return mockPaymentIntent
    } catch (error) {
      console.error('Error creating payment intent:', error)
      throw error
    }
  },

  /**
   * Calculate total pending payouts for a host
   */
  async getHostPendingPayouts(hostId: string): Promise<number> {
    try {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_price, platform_fee, host_payout')
        .eq('host_id', hostId)
        .eq('status', 'accepted')

      if (!bookings) return 0

      return bookings.reduce((sum, b) => {
        const payment = this.calculatePayment(b.total_price)
        return sum + payment.hostPayout
      }, 0)
    } catch (error) {
      console.error('Error calculating pending payouts:', error)
      return 0
    }
  },
}
