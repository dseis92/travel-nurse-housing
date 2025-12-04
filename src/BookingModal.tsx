import React, { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabaseClient'
import { NeumoCard } from './neumo/NeumoKit'

type BookingModalProps = {
  open: boolean
  onClose: () => void
  listing: {
    id: number
    title: string
    city?: string
    state?: string
  }
}

export const BookingModal: React.FC<BookingModalProps> = ({
  open,
  onClose,
  listing,
}) => {
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!startDate || !endDate) {
      alert('Please choose both a start and end date.')
      return
    }

    try {
      setIsSubmitting(true)

      const { error } = await supabase.from('bookings').insert([
        {
          listing_id: listing.id,
          guest_name: guestName || null,
          guest_email: guestEmail || null,
          guest_phone: guestPhone || null,
          start_date: startDate,
          end_date: endDate,
          status: 'pending',
          // keep notes next to the booking for now; column is optional
          notes: notes || null,
        },
      ])

      if (error) {
        console.error('Supabase booking insert error:', error)
        alert(`Could not send request:\n\n${error.message}`)
        setIsSubmitting(false)
        return
      }

      alert('Request sent! The host will review your stay.')
      setIsSubmitting(false)
      onClose()
    } catch (err: any) {
      console.error('Unexpected booking error:', err)
      alert(
        `Could not send request:\n\n${
          err?.message || 'Unexpected error, check console.'
        }`,
      )
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="nm-shell"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background:
          'linear-gradient(145deg, rgba(234,243,255,0.95), rgba(227,212,255,0.96))',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
        }}
      >
        <NeumoCard className="nm-fade-in" style={{ padding: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div>
              <h2
                className="nm-heading-lg"
                style={{ fontSize: 18, marginBottom: 4 }}
              >
                Request stay
              </h2>
              <p className="nm-body" style={{ fontSize: 12 }}>
                {listing.title}
                {listing.city && listing.state
                  ? ` · ${listing.city}, ${listing.state}`
                  : ''}
              </p>
            </div>
            <button
              type="button"
              className="nm-pill"
              style={{ fontSize: 11 }}
              onClick={onClose}
            >
              ✕ Close
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div className="nm-field-group" style={{ flex: 1, minWidth: 0 }}>
                <label className="nm-label">Your name</label>
                <input
                  className="nm-input"
                  placeholder="Optional"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <div className="nm-field-group" style={{ flex: 1, minWidth: 0 }}>
                <label className="nm-label">Email</label>
                <input
                  className="nm-input"
                  placeholder="Optional"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div className="nm-field-group" style={{ flex: 1, minWidth: 0 }}>
                <label className="nm-label">Phone</label>
                <input
                  className="nm-input"
                  placeholder="Optional"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div className="nm-field-group" style={{ flex: 1, minWidth: 0 }}>
                <label className="nm-label">Contract start</label>
                <input
                  type="date"
                  className="nm-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="nm-field-group" style={{ flex: 1, minWidth: 0 }}>
                <label className="nm-label">Contract end</label>
                <input
                  type="date"
                  className="nm-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="nm-field-group">
              <label className="nm-label">Anything the host should know?</label>
              <textarea
                className="nm-input"
                rows={3}
                placeholder="Night shift? Traveling with a pet? Share details here."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 6,
                gap: 8,
              }}
            >
              <p className="nm-body" style={{ fontSize: 11, maxWidth: 220 }}>
                Your contact info is shared securely with the host only if they
                approve your request.
              </p>
              <button
                type="submit"
                className="nm-pill nm-pill--active"
                style={{ fontSize: 13, minWidth: 120, textAlign: 'center' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending…' : 'Request stay'}
              </button>
            </div>
          </form>
        </NeumoCard>
      </div>
    </div>
  )
}
