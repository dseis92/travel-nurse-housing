import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../stores/authStore'
import { PaymentModal } from '../payment/PaymentModal'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  created_at: string
  start_date: string
  end_date: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'
  total_price: number
  guest_message: string | null
  hold_expires_at: string | null
  listing: {
    id: string
    title: string
    city: string
    state: string
    image_url: string | null
    price_per_month: number
  } | null
}

type FilterStatus = 'all' | 'pending' | 'accepted' | 'completed'

export function MyBookings() {
  const { profile } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null)

  useEffect(() => {
    if (profile) {
      loadBookings()
    }
  }, [profile, filter])

  const loadBookings = async () => {
    if (!profile) return

    try {
      setLoading(true)

      let query = supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          start_date,
          end_date,
          status,
          total_price,
          guest_message,
          hold_expires_at,
          listings:listing_id (
            id,
            title,
            city,
            state,
            image_url,
            price_per_month
          )
        `)
        .eq('nurse_id', profile.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform the data to flatten the listing object
      const transformedData = (data || []).map(booking => ({
        ...booking,
        listing: Array.isArray(booking.listings) ? booking.listings[0] : booking.listings
      }))

      setBookings(transformedData as any)
    } catch (error: any) {
      console.error('Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking request?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: profile?.id
        })
        .eq('id', bookingId)
        .eq('nurse_id', profile?.id)

      if (error) throw error

      toast.success('Booking cancelled')
      loadBookings()
    } catch (error: any) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel booking')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b'
      case 'accepted':
        return '#10b981'
      case 'declined':
      case 'cancelled':
        return '#ef4444'
      case 'completed':
        return '#6b7280'
      default:
        return '#6b7280'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '�'
      case 'accepted':
        return ''
      case 'declined':
        return 'L'
      case 'cancelled':
        return '=�'
      case 'completed':
        return '('
      default:
        return '=�'
    }
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const acceptedCount = bookings.filter(b => b.status === 'accepted').length

  if (!profile || profile.role !== 'nurse') {
    return (
      <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <NeumoCard>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>=i�</p>
            <p className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 6 }}>
              Nurse Account Required
            </p>
            <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
              Switch to nurse role to view your bookings
            </p>
          </div>
        </NeumoCard>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <NeumoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: 24 }}>
            <div
              style={{
                width: 24,
                height: 24,
                border: '3px solid #14B8A6',
                borderTopColor: 'transparent',
                borderRadius: 999,
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
              Loading your bookings...
            </p>
          </div>
          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </NeumoCard>
      </div>
    )
  }

  return (
    <div style={{ padding: 16, paddingBottom: 80, maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="nm-heading-lg" style={{ fontSize: 22, marginBottom: 8 }}>
          My Bookings
        </h1>
        <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
          {pendingCount > 0 && `${pendingCount} pending � `}
          {acceptedCount > 0 && `${acceptedCount} accepted`}
        </p>
      </div>

      {/* Status Filter Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {(['all', 'pending', 'accepted', 'completed'] as FilterStatus[]).map((status) => (
          <button
            key={status}
            className={`nm-pill ${filter === status ? 'nm-pill--active' : ''}`}
            style={{ fontSize: 11 }}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : getStatusLabel(status)}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <NeumoCard>
          <div style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>=�</p>
            <p className="nm-heading-lg" style={{ fontSize: 16, marginBottom: 8 }}>
              No bookings yet
            </p>
            <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
              {filter === 'all'
                ? "Start exploring listings to request your first booking"
                : `No ${filter} bookings`}
            </p>
          </div>
        </NeumoCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookings.map((booking) => (
            <NeumoCard key={booking.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Listing Image and Info */}
                <div style={{ display: 'flex', gap: 12 }}>
                  {booking.listing?.image_url && (
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 14,
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: `url(${booking.listing.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <h3 className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 2 }}>
                        {booking.listing?.title || 'Listing'}
                      </h3>
                      <span style={{ fontSize: 20, flexShrink: 0, marginLeft: 8 }}>
                        {getStatusIcon(booking.status)}
                      </span>
                    </div>
                    <p className="nm-body" style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                      {booking.listing?.city}, {booking.listing?.state}
                    </p>
                    <span
                      className="nm-pill"
                      style={{
                        fontSize: 9,
                        color: getStatusColor(booking.status),
                        borderColor: getStatusColor(booking.status),
                        display: 'inline-block',
                      }}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>
                </div>

                {/* Dates and Price */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    padding: 10,
                    borderRadius: 10,
                    background: 'rgba(148,163,184,0.05)',
                    border: '1px solid rgba(148,163,184,0.15)',
                  }}
                >
                  <div>
                    <p className="nm-body" style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
                      Check In
                    </p>
                    <p className="nm-body" style={{ fontSize: 12, fontWeight: 600 }}>
                      {formatDate(booking.start_date)}
                    </p>
                  </div>
                  <div>
                    <p className="nm-body" style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
                      Check Out
                    </p>
                    <p className="nm-body" style={{ fontSize: 12, fontWeight: 600 }}>
                      {formatDate(booking.end_date)}
                    </p>
                  </div>
                </div>

                {/* Total Price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
                    Total Price
                  </span>
                  <span className="nm-heading-lg" style={{ fontSize: 16 }}>
                    {formatCurrency(booking.total_price)}
                  </span>
                </div>

                {/* Message to Host */}
                {booking.guest_message && (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      background: 'rgba(99,102,241,0.05)',
                      border: '1px solid rgba(99,102,241,0.15)',
                    }}
                  >
                    <p className="nm-body" style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>
                      Your Message
                    </p>
                    <p className="nm-body" style={{ fontSize: 11 }}>
                      {booking.guest_message}
                    </p>
                  </div>
                )}

                {/* Hold Expiration Warning */}
                {booking.status === 'pending' && booking.hold_expires_at && (
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: 'rgba(251,146,60,0.1)',
                      border: '1px solid rgba(251,146,60,0.3)',
                    }}
                  >
                    <p className="nm-body" style={{ fontSize: 10, color: '#f97316' }}>
                      � Response needed by {formatDate(booking.hold_expires_at)}
                    </p>
                  </div>
                )}

                {/* Status Messages */}
                {booking.status === 'accepted' && (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.2)',
                    }}
                  >
                    <p className="nm-body" style={{ fontSize: 11, color: '#10b981' }}>
                       Your booking has been accepted! The host will contact you soon.
                    </p>
                  </div>
                )}

                {booking.status === 'declined' && (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}
                  >
                    <p className="nm-body" style={{ fontSize: 11, color: '#ef4444' }}>
                      This booking request was declined by the host.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {booking.status === 'pending' && (
                  <div>
                    <button
                      className="nm-pill"
                      style={{ width: '100%', fontSize: 11, color: '#ef4444' }}
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel Request
                    </button>
                  </div>
                )}

                {booking.status === 'accepted' && (
                  <button
                    className="nm-gradient-button"
                    style={{ width: '100%', fontSize: 13 }}
                    onClick={() => setPaymentBooking(booking)}
                  >
                    💳 Pay Now
                  </button>
                )}

                {/* Created Date */}
                <p className="nm-body" style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>
                  Requested on {formatDate(booking.created_at)}
                </p>
              </div>
            </NeumoCard>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {paymentBooking && (
        <PaymentModal
          bookingId={paymentBooking.id}
          totalAmount={paymentBooking.total_price}
          onSuccess={async () => {
            // Update booking status to completed
            try {
              const { error } = await supabase
                .from('bookings')
                .update({ status: 'completed' })
                .eq('id', paymentBooking.id)

              if (error) throw error

              toast.success('Payment successful! Your booking is confirmed.')
              setPaymentBooking(null)
              loadBookings()
            } catch (error: any) {
              console.error('Error updating booking status:', error)
              toast.error('Payment processed but booking update failed')
            }
          }}
          onCancel={() => setPaymentBooking(null)}
        />
      )}
    </div>
  )
}
