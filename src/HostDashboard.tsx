import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

type HostBooking = {
  id: number
  listing_id: number
  guest_name: string
  guest_email: string
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true)
      setError(null)

      // get current user (host)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('You must be logged in as a host to view bookings.')
        setLoading(false)
        return
      }

      // fetch bookings + related listing info
      const { data, error: bookingsError } = await supabase
        .from('bookings')
        .select(
          'id, listing_id, guest_name, guest_email, guest_phone, start_date, end_date, status, created_at, listings ( title, city, state )',
        )
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })

      if (bookingsError) {
        setError(bookingsError.message)
        setLoading(false)
        return
      }

      // map raw rows into HostBooking[]
      const safe: HostBooking[] = (data ?? []).map((row: any) => {
        const firstListing =
          row.listings && Array.isArray(row.listings) && row.listings[0]
            ? row.listings[0]
            : null

        return {
          id: row.id,
          listing_id: row.listing_id,
          guest_name: row.guest_name,
          guest_email: row.guest_email,
          guest_phone: row.guest_phone,
          start_date: row.start_date,
          end_date: row.end_date,
          status: row.status,
          created_at: row.created_at,
          listings: firstListing
            ? {
                title: firstListing.title,
                city: firstListing.city,
                state: firstListing.state,
              }
            : null,
        }
      })

      setBookings(safe)
      setLoading(false)
    }

    void loadBookings()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 className="nm-heading-lg" style={{ fontSize: 18 }}>
        Host dashboard
      </h2>

      {loading && (
        <p className="nm-body" style={{ fontSize: 12 }}>
          Loading bookings…
        </p>
      )}

      {error && (
        <p
          className="nm-body"
          style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}
        >
          {error}
        </p>
      )}

      {!loading && !error && bookings.length === 0 && (
        <p className="nm-body" style={{ fontSize: 12 }}>
          No bookings yet. Once nurses request to stay at your listings,
          they&apos;ll show up here.
        </p>
      )}

      {!loading &&
        !error &&
        bookings.map((b) => (
          <div
            key={b.id}
            style={{
              padding: 12,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.9)',
              boxShadow:
                '0 18px 40px rgba(45,35,80,0.18), -6px -6px 16px rgba(255,255,255,0.95)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                >
                  {b.guest_name}
                </div>
                <div
                  className="nm-body"
                  style={{ fontSize: 11, color: '#6b7280' }}
                >
                  {b.listings
                    ? `${b.listings.title} · ${b.listings.city}, ${b.listings.state}`
                    : 'Listing info unavailable'}
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background:
                    b.status === 'approved'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : b.status === 'rejected'
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(129, 140, 248, 0.12)',
                  color:
                    b.status === 'approved'
                      ? '#059669'
                      : b.status === 'rejected'
                      ? '#ef4444'
                      : '#4f46e5',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {b.status}
              </div>
            </div>

            <div
              className="nm-body"
              style={{ fontSize: 11, color: '#6b7280' }}
            >
              {b.start_date} → {b.end_date}
            </div>

            <div
              className="nm-body"
              style={{ fontSize: 11, color: '#6b7280' }}
            >
              {b.guest_email}
              {b.guest_phone ? ` · ${b.guest_phone}` : ''}
            </div>
          </div>
        ))}
    </div>
  )
}
