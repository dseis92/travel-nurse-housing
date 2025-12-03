import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { bookingService, type Booking } from '../../services/bookingService'
import toast from 'react-hot-toast'

interface BookingsListProps {
  userRole: 'nurse' | 'host'
}

export function BookingsList({ userRole }: BookingsListProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'cancelled'>('all')

  useEffect(() => {
    loadBookings()
  }, [userRole])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const result = userRole === 'nurse'
        ? await bookingService.getMyBookings()
        : await bookingService.getHostBookings()

      if (result.success && result.bookings) {
        setBookings(result.bookings)
      } else {
        toast.error(result.error || 'Failed to load bookings')
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (bookingId: string) => {
    try {
      setActionLoading(bookingId)
      const result = await bookingService.acceptBooking(bookingId)

      if (result.success) {
        toast.success('Booking accepted!')
        await loadBookings()
      } else {
        toast.error(result.error || 'Failed to accept booking')
      }
    } catch (error) {
      toast.error('Failed to accept booking')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (bookingId: string) => {
    if (!confirm('Are you sure you want to decline this booking?')) return

    try {
      setActionLoading(bookingId)
      const result = await bookingService.declineBooking(bookingId)

      if (result.success) {
        toast.success('Booking declined')
        await loadBookings()
      } else {
        toast.error(result.error || 'Failed to decline booking')
      }
    } catch (error) {
      toast.error('Failed to decline booking')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      setActionLoading(bookingId)
      const result = await bookingService.cancelBooking(bookingId)

      if (result.success) {
        toast.success('Booking cancelled')
        await loadBookings()
      } else {
        toast.error(result.error || 'Failed to cancel booking')
      }
    } catch (error) {
      toast.error('Failed to cancel booking')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b'
      case 'accepted':
        return '#10b981'
      case 'declined':
        return '#ef4444'
      case 'cancelled':
        return '#6b7280'
      case 'completed':
        return '#3b82f6'
      default:
        return '#6b7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'accepted':
        return 'Accepted'
      case 'declined':
        return 'Declined'
      case 'cancelled':
        return 'Cancelled'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter)

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <NeumoCard>
          <p className="nm-body" style={{ textAlign: 'center', fontSize: 12 }}>
            Loading bookings...
          </p>
        </NeumoCard>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 12 }}>
          {userRole === 'nurse' ? 'My Bookings' : 'Booking Requests'}
        </h2>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {(['all', 'pending', 'accepted', 'declined', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              type="button"
              className={'nm-pill ' + (filter === status ? 'nm-pill--active' : '')}
              style={{ fontSize: 11, paddingInline: 12, paddingBlock: 6 }}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All' : getStatusLabel(status)}
              {status === 'all'
                ? ` (${bookings.length})`
                : ` (${bookings.filter(b => b.status === status).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredBookings.length === 0 && (
        <NeumoCard>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p className="nm-body" style={{ fontSize: 14, marginBottom: 8 }}>
              {filter === 'all'
                ? userRole === 'nurse'
                  ? "You haven't made any booking requests yet"
                  : "You haven't received any booking requests yet"
                : `No ${filter} bookings`}
            </p>
            <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
              {userRole === 'nurse'
                ? 'Browse listings and send a booking request to get started'
                : 'Booking requests will appear here'}
            </p>
          </div>
        </NeumoCard>
      )}

      {/* Bookings list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredBookings.map((booking) => (
          <NeumoCard key={booking.id}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Header with status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 4 }}>
                    Booking #{booking.id.slice(0, 8)}
                  </h3>
                  <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
                    Created {new Date(booking.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className="nm-tag"
                  style={{
                    fontSize: 10,
                    background: getStatusColor(booking.status),
                    color: 'white',
                  }}
                >
                  {getStatusLabel(booking.status)}
                </span>
              </div>

              {/* Dates */}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                    Check-in
                  </p>
                  <p className="nm-body" style={{ fontSize: 12, fontWeight: 600 }}>
                    {new Date(booking.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                    Check-out
                  </p>
                  <p className="nm-body" style={{ fontSize: 12, fontWeight: 600 }}>
                    {new Date(booking.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                    Total
                  </p>
                  <p className="nm-body" style={{ fontSize: 12, fontWeight: 600 }}>
                    ${booking.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Hold expiration warning */}
              {booking.status === 'pending' && booking.holdExpiresAt && (
                <div
                  style={{
                    padding: 8,
                    borderRadius: 12,
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <p className="nm-body" style={{ fontSize: 11, color: '#f59e0b' }}>
                    ⏰ Expires {new Date(booking.holdExpiresAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Messages */}
              {booking.nurseMessage && (
                <div style={{ paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                  <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>
                    Message from nurse:
                  </p>
                  <p className="nm-body" style={{ fontSize: 12 }}>
                    {booking.nurseMessage}
                  </p>
                </div>
              )}

              {booking.hostResponse && (
                <div style={{ paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                  <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>
                    Response from host:
                  </p>
                  <p className="nm-body" style={{ fontSize: 12 }}>
                    {booking.hostResponse}
                  </p>
                </div>
              )}

              {/* Actions */}
              {booking.status === 'pending' && (
                <div style={{ display: 'flex', gap: 6, paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                  {userRole === 'host' ? (
                    <>
                      <button
                        type="button"
                        className="nm-pill nm-pill--active"
                        style={{ flex: 1, fontSize: 11 }}
                        onClick={() => handleAccept(booking.id)}
                        disabled={actionLoading === booking.id}
                      >
                        {actionLoading === booking.id ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        className="nm-pill"
                        style={{ flex: 1, fontSize: 11, color: '#ef4444' }}
                        onClick={() => handleDecline(booking.id)}
                        disabled={actionLoading === booking.id}
                      >
                        {actionLoading === booking.id ? 'Declining...' : 'Decline'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="nm-pill"
                      style={{ flex: 1, fontSize: 11, color: '#ef4444' }}
                      onClick={() => handleCancel(booking.id)}
                      disabled={actionLoading === booking.id}
                    >
                      {actionLoading === booking.id ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  )}
                </div>
              )}

              {booking.status === 'accepted' && userRole === 'nurse' && (
                <div style={{ display: 'flex', gap: 6, paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                  <button
                    type="button"
                    className="nm-pill"
                    style={{ flex: 1, fontSize: 11, color: '#ef4444' }}
                    onClick={() => handleCancel(booking.id)}
                    disabled={actionLoading === booking.id}
                  >
                    {actionLoading === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              )}
            </div>
          </NeumoCard>
        ))}
      </div>
    </div>
  )
}
