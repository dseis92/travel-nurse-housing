import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

type HostBooking = {
  id: number
  listing_id: number
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  start_date: string
  end_date: string
  status: string
  created_at: string
  listings: {
    title: string
    city: string
    state: string
  } | null
}

export const HostDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<HostBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('bookings')
          .select(
            `
            id,
            listing_id,
            guest_name,
            guest_email,
            guest_phone,
            start_date,
            end_date,
            status,
            created_at,
            listings (
              title,
              city,
              state
            )
          `,
          )
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching host bookings:', error)
          setError('Could not load booking requests.')
          setIsLoading(false)
          return
        }

        setBookings((data ?? []) as HostBooking[])
        setIsLoading(false)
      } catch (err) {
        console.error('Unexpected host dashboard error:', err)
        setError('Something went wrong while loading bookings.')
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [])

  const updateStatus = async (
    bookingId: number,
    nextStatus: 'approved' | 'declined',
  ) => {
    try {
      setUpdatingId(bookingId)

      const { error } = await supabase
        .from('bookings')
        .update({ status: nextStatus })
        .eq('id', bookingId)

      if (error) {
        console.error('Error updating booking status:', error)
        alert('Could not update booking status. Try again.')
        setUpdatingId(null)
        return
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: nextStatus } : b,
        ),
      )
      setUpdatingId(null)
    } catch (err) {
      console.error('Unexpected error updating status:', err)
      alert('Something went wrong.')
      setUpdatingId(null)
    }
  }

  const getStatusChip = (status: string) => {
    let label = 'Pending'
    let background = 'rgba(255, 255, 255, 0.9)'
    let color = '#4b5563'

    if (status === 'approved') {
      label = 'Approved'
      background = 'rgba(50, 228, 194, 0.2)'
      color = '#0f766e'
    } else if (status === 'declined') {
      label = 'Declined'
      background = 'rgba(248, 113, 113, 0.18)'
      color = '#b91c1c'
    }

    return (
      <span
        style={{
          fontSize: 11,
          padding: '4px 10px',
          borderRadius: 999,
          background,
          color,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    )
  }

  const formatDate = (value: string) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateRange = (start: string, end: string) => {
    if (!start && !end) return 'No dates'
    if (!start || !end) return `${formatDate(start || end)}`
    return `${formatDate(start)} → ${formatDate(end)}`
  }

  const formatCreated = (value: string) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 8,
        }}
      >
        <div>
          <h3 className="nm-heading-lg" style={{ fontSize: 18 }}>
            Booking requests
          </h3>
          <p className="nm-body" style={{ fontSize: 11 }}>
            Review stay requests from travel nurses and update their status.
          </p>
        </div>
        {bookings.length > 0 && (
          <span
            className="nm-body"
            style={{ fontSize: 11, opacity: 0.8, whiteSpace: 'nowrap' }}
          >
            {bookings.length} total
          </span>
        )}
      </div>

      {isLoading && (
        <p className="nm-body" style={{ fontSize: 12 }}>
          Loading bookings…
        </p>
      )}

      {error && (
        <p
          className="nm-body"
          style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}
        >
          {error}
        </p>
      )}

      {!isLoading && !error && bookings.length === 0 && (
        <p className="nm-body" style={{ fontSize: 12 }}>
          No booking requests yet. Once nurses start requesting stays on your
          listings, you&apos;ll see them here.
        </p>
      )}

      {!isLoading &&
        !error &&
        bookings.map((booking) => {
          const listing = booking.listings
          const status = booking.status || 'pending'

          return (
            <div
              key={booking.id}
              style={{
                padding: 12,
                borderRadius: 24,
                background: 'rgba(255,255,255,0.88)',
                boxShadow:
                  '0 20px 40px rgba(45,35,80,0.18), -6px -6px 16px rgba(255,255,255,0.9)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    className="nm-body"
                    style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}
                  >
                    From
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{booking.guest_name || 'Travel nurse'}</span>
                  </div>
                </div>
                {getStatusChip(status)}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  fontSize: 11,
                }}
              >
                <div className="nm-body">
                  <span style={{ opacity: 0.7 }}>Listing: </span>
                  <span style={{ fontWeight: 600 }}>
                    {listing?.title || 'Unknown listing'}
                  </span>
                </div>
                <div className="nm-body">
                  <span style={{ opacity: 0.7 }}>Location: </span>
                  <span>
                    {listing
                      ? `${listing.city}, ${listing.state}`
                      : '—'}
                  </span>
                </div>
                <div className="nm-body">
                  <span style={{ opacity: 0.7 }}>Dates: </span>
                  <span>
                    {formatDateRange(booking.start_date, booking.end_date)}
                  </span>
                </div>
                {(booking.guest_email || booking.guest_phone) && (
                  <div className="nm-body">
                    <span style={{ opacity: 0.7 }}>Contact: </span>
                    <span>
                      {booking.guest_email && (
                        <>
                          {booking.guest_email}
                          {booking.guest_phone ? ' · ' : ''}
                        </>
                      )}
                      {booking.guest_phone && booking.guest_phone}
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <span
                  className="nm-body"
                  style={{ fontSize: 10, opacity: 0.65 }}
                >
                  Requested {formatCreated(booking.created_at)}
                </span>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    className="nm-pill"
                    style={{
                      fontSize: 11,
                      opacity:
                        status === 'approved' || updatingId === booking.id
                          ? 0.6
                          : 1,
                    }}
                    disabled={status === 'approved' || updatingId === booking.id}
                    onClick={() => updateStatus(booking.id, 'approved')}
                  >
                    {updatingId === booking.id && status !== 'approved'
                      ? 'Updating…'
                      : 'Approve'}
                  </button>
                  <button
                    type="button"
                    className="nm-pill"
                    style={{
                      fontSize: 11,
                      background:
                        status === 'declined'
                          ? 'rgba(248, 113, 113, 0.16)'
                          : undefined,
                      opacity:
                        status === 'declined' || updatingId === booking.id
                          ? 0.6
                          : 1,
                    }}
                    disabled={status === 'declined' || updatingId === booking.id}
                    onClick={() => updateStatus(booking.id, 'declined')}
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}
