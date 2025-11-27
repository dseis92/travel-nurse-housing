import React, { useState } from 'react'
import { NeumoCard } from './neumo/NeumoKit'
import { supabase } from './supabaseClient'

type ListingDetailsProps = {
  listing: {
    id: number
    title: string
    city: string
    state: string
    hospitalName: string
    hospitalCity?: string
    hospitalState?: string
    minutesToHospital: number
    pricePerMonth: number
    roomType: string
    imageUrl: string
    tags?: string[]
    perks?: string[]
    rating?: number
    reviewCount?: number
  }
  guestName?: string
  onClose: () => void
}

export const ListingDetailsModal: React.FC<ListingDetailsProps> = ({
  listing,
  guestName,
  onClose,
}) => {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const displayName =
    guestName && guestName.trim().length > 0 ? guestName.trim() : 'Travel nurse'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!checkIn || !checkOut) {
      alert('Add your contract dates before requesting this stay.')
      return
    }

    try {
      setIsSubmitting(true)

      const { error } = await supabase.from('bookings').insert([
        {
          listing_id: listing.id,
          guest_name: displayName,
          start_date: checkIn,
          end_date: checkOut,
          status: 'pending',
          // NOTE: we are *not* storing message yet because the bookings table
          // currently doesn’t have a notes column. We can add that later.
        },
      ])

      if (error) {
        console.error('Supabase insert error:', error)
        alert('Could not send request. Try again in a moment.')
        setIsSubmitting(false)
        return
      }

      console.log('Request stay payload stored:', {
        listingId: listing.id,
        checkIn,
        checkOut,
        guestName: displayName,
      })

      alert('Request sent to the host! 🩺')
      onClose()
    } catch (err) {
      console.error('Unexpected error sending booking request:', err)
      alert('Something went wrong sending your request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const prettyRoomType =
    listing.roomType === 'entire-place'
      ? 'Entire place'
      : listing.roomType === 'private-room'
      ? 'Private room'
      : listing.roomType === 'shared'
      ? 'Shared room'
      : listing.roomType

  return (
    <div className="nm-modal-overlay" onClick={onClose}>
      <div
        className="nm-modal-inner"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <NeumoCard className="nm-modal-sheet">
          <div className="nm-modal-header">
            <div
              className="nm-modal-image"
              style={{
                backgroundImage: `url(${listing.imageUrl})`,
              }}
            >
              <div className="nm-modal-chip-row">
                <span className="nm-modal-chip">
                  {prettyRoomType} · {listing.city}, {listing.state}
                </span>
                {typeof listing.rating === 'number' && (
                  <span className="nm-modal-chip">
                    ⭐ {listing.rating.toFixed(1)}{' '}
                    {listing.reviewCount
                      ? `· ${listing.reviewCount} reviews`
                      : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="nm-modal-body">
            <div className="nm-modal-title-row">
              <div>
                <h2 className="nm-heading-lg nm-modal-title">
                  {listing.title}
                </h2>
                <p className="nm-body nm-modal-sub">
                  ~{listing.minutesToHospital} min to{' '}
                  {listing.hospitalName || 'hospital'}
                </p>
              </div>
              <div className="nm-modal-price">
                <span className="nm-modal-price-main">
                  ${listing.pricePerMonth.toLocaleString()}
                </span>
                <span className="nm-modal-price-sub">/ month</span>
              </div>
            </div>

            {(listing.tags?.length || listing.perks?.length) && (
              <div className="nm-modal-tags">
                {listing.tags?.map((tag) => (
                  <span key={tag} className="nm-tag">
                    {tag}
                  </span>
                ))}
                {listing.perks?.map((perk) => (
                  <span key={perk} className="nm-tag nm-tag--soft">
                    {perk}
                  </span>
                ))}
              </div>
            )}

            <form
              className="nm-modal-form"
              onSubmit={handleSubmit}
              autoComplete="off"
            >
              <div className="nm-onboarding-row">
                <label className="nm-label nm-onboarding-flex-1">
                  Check-in
                  <input
                    type="date"
                    className="nm-input"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    disabled={isSubmitting}
                  />
                </label>
                <label className="nm-label nm-onboarding-flex-1">
                  Check-out
                  <input
                    type="date"
                    className="nm-input"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              <label className="nm-label">
                Message to host (optional)
                <textarea
                  className="nm-input nm-input--textarea"
                  rows={3}
                  placeholder="Introduce yourself, share your shift type, and anything important (pets, parking, etc.)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSubmitting}
                />
              </label>

              <div className="nm-modal-footer">
                <button
                  type="button"
                  className="nm-pill"
                  style={{ fontSize: 12 }}
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="nm-pill nm-pill--active"
                  style={{ fontSize: 13, opacity: isSubmitting ? 0.7 : 1 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending…' : 'Request stay'}
                </button>
              </div>
            </form>
          </div>
        </NeumoCard>
      </div>
    </div>
  )
}
