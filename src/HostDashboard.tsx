import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { NeumoCard } from './neumo/NeumoKit'

type HostBooking = {
  id: number
  listingId: number
  guestName: string
  guestEmail: string | null
  guestPhone: string | null
  startDate: string
  endDate: string
  status: string
  createdAt: string
  listingTitle: string
  listingCity: string
  listingState: string
}

export const HostDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<HostBooking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    void loadBookings()
  }, [])

  const loadBookings = async () => {
    setIsLoading(true)
    setErrorText(null)
    try {
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
          listings(
            title,
            city,
            state
          )
        `,
        )
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading bookings:', error)
        setErrorText('Could not load bookings.')
        return
      }

      const mapped: HostBooking[] = (data ?? []).map((row: any): HostBooking => {
        const listingMeta = Array.isArray(row.listings)
          ? row.listings[0]
          : row.listings

        return {
          id: row.id,
          listingId: row.listing_id,
          guestName: row.guest_name,
          guestEmail: row.guest_email ?? null,
          guestPhone: row.guest_phone ?? null,
          startDate: row.start_date,
          endDate: row.end_date,
          status: row.status ?? 'pending',
          createdAt: row.created_at,
          listingTitle: listingMeta?.title ?? 'Unknown listing',
          listingCity: listingMeta?.city ?? '',
          listingState: listingMeta?.state ?? '',
        }
      })

      setBookings(mapped)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (bookingId: number, newStatus: string) => {
    setUpdatingId(bookingId)
    setErrorText(null)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)

      if (error) {
        console.error('Error updating status:', error)
        setErrorText('Could not update booking status.')
        return
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: newStatus,
              }
            : b,
        ),
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const pending = bookings.filter((b) => b.status === 'pending')
  const upcoming = bookings.filter(
    (b) => b.status === 'approved' || b.status === 'accepted',
  )
  const declined = bookings.filter(
    (b) => b.status === 'declined' || b.status === 'rejected',
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h2 className="nm-heading-lg" style={{ fontSize: 18 }}>
        Host dashboard
      </h2>
      <p className="nm-body" style={{ fontSize: 12 }}>
        See incoming stay requests from travel nurses, approve or decline, and keep
        track of your upcoming stays.
      </p>

      {errorText && (
        <div
          style={{
            fontSize: 12,
            color: '#b91c1c',
            marginTop: 4,
          }}
        >
          {errorText}
        </div>
      )}

      <button
        type="button"
        className="nm-pill"
        style={{ alignSelf: 'flex-start', fontSize: 12 }}
        onClick={loadBookings}
        disabled={isLoading}
      >
        {isLoading ? 'Refreshing…' : 'Refresh bookings'}
      </button>

      {/* Pending requests */}
      <SectionBlock
        title="Pending requests"
        subtitle="New requests from nurses waiting for your response."
      >
        {pending.length === 0 ? (
          <EmptyState text="No pending requests right now." />
        ) : (
          pending.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              updatingId={updatingId}
              onUpdateStatus={updateStatus}
            />
          ))
        )}
      </SectionBlock>

      {/* Upcoming stays */}
      <SectionBlock
        title="Upcoming stays"
        subtitle="Approved stays based on your listings."
      >
        {upcoming.length === 0 ? (
          <EmptyState text="No upcoming stays yet." />
        ) : (
          upcoming.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              updatingId={updatingId}
              onUpdateStatus={updateStatus}
            />
          ))
        )}
      </SectionBlock>

      {/* Declined / past */}
      <SectionBlock
        title="Declined or past requests"
        subtitle="For your records."
      >
        {declined.length === 0 ? (
          <EmptyState text="No declined requests." />
        ) : (
          declined.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              updatingId={updatingId}
              onUpdateStatus={updateStatus}
            />
          ))
        )}
      </SectionBlock>
    </div>
  )
}

const SectionBlock: React.FC<{
  title: string
  subtitle?: string
  children: React.ReactNode
}> = ({ title, subtitle, children }) => {
  return (
    <NeumoCard>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div>
          <h3 className="nm-heading-lg" style={{ fontSize: 14 }}>
            {title}
          </h3>
          {subtitle && (
            <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {children}
        </div>
      </div>
    </NeumoCard>
  )
}

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div
    className="nm-body"
    style={{
      fontSize: 11,
      color: '#9ca3af',
      paddingTop: 4,
    }}
  >
    {text}
  </div>
)

const BookingCard: React.FC<{
  booking: HostBooking
  updatingId: number | null
  onUpdateStatus: (id: number, status: string) => void
}> = ({ booking, updatingId, onUpdateStatus }) => {
  const isUpdating = updatingId === booking.id
  const isPending = booking.status === 'pending'
  const isApproved =
    booking.status === 'approved' || booking.status === 'accepted'
  const isDeclined =
    booking.status === 'declined' || booking.status === 'rejected'

  const dateRange = `${booking.startDate} → ${booking.endDate}`

  let statusLabel = booking.status
  if (booking.status === 'approved') statusLabel = 'Approved'
  if (booking.status === 'accepted') statusLabel = 'Accepted'
  if (booking.status === 'pending') statusLabel = 'Pending'
  if (booking.status === 'declined') statusLabel = 'Declined'
  if (booking.status === 'rejected') statusLabel = 'Rejected'

  const statusColor =
    isPending ? '#f97316' : isApproved ? '#16a34a' : isDeclined ? '#dc2626' : '#6b7280'

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 10,
        background: 'rgba(255,255,255,0.9)',
        boxShadow:
          '0 18px 36px rgba(15,23,42,0.2), -4px -4px 10px rgba(255,255,255,0.9)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {booking.listingTitle}
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#6b7280',
            }}
          >
            {booking.listingCity}, {booking.listingState}
          </div>
        </div>
        <div
          style={{
            alignSelf: 'flex-start',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 999,
            backgroundColor: 'rgba(148,163,184,0.12)',
            color: statusColor,
            fontWeight: 600,
          }}
        >
          {statusLabel}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 2,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: '#4b5563',
          }}
        >
          <div>
            <span
              style={{
                fontWeight: 600,
              }}
            >
              Guest:
            </span>{' '}
            {booking.guestName}
          </div>
          {booking.guestEmail && (
            <div>
              <span style={{ fontWeight: 600 }}>Email:</span>{' '}
              {booking.guestEmail}
            </div>
          )}
          {booking.guestPhone && (
            <div>
              <span style={{ fontWeight: 600 }}>Phone:</span>{' '}
              {booking.guestPhone}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#4b5563',
            textAlign: 'right',
          }}
        >
          <div>
            <span style={{ fontWeight: 600 }}>Dates:</span>
          </div>
          <div>{dateRange}</div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 6,
          marginTop: 6,
        }}
      >
        <button
          type="button"
          className="nm-pill"
          style={{
            fontSize: 11,
            opacity: isDeclined ? 0.6 : 1,
          }}
          onClick={() => onUpdateStatus(booking.id, 'declined')}
          disabled={isUpdating || isDeclined}
        >
          {isUpdating && !isApproved && !isDeclined
            ? 'Updating…'
            : isDeclined
            ? 'Declined'
            : 'Decline'}
        </button>
        <button
          type="button"
          className="nm-pill nm-pill--active"
          style={{
            fontSize: 11,
            opacity: isApproved ? 0.6 : 1,
          }}
          onClick={() => onUpdateStatus(booking.id, 'approved')}
          disabled={isUpdating || isApproved}
        >
          {isUpdating && !isApproved && !isDeclined
            ? 'Updating…'
            : isApproved
            ? 'Approved'
            : 'Approve'}
        </button>
      </div>
    </div>
  )
}
