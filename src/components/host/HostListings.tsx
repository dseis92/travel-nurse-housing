import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import {
  fetchHostListings,
  publishListing,
  unpublishListing,
  deactivateListing,
  deleteListing,
  type Listing,
} from '../../services/listingService'
import toast from 'react-hot-toast'

interface HostListingsProps {
  onCreateNew?: () => void
  onEdit?: (listing: Listing) => void
}

export function HostListings({ onCreateNew, onEdit }: HostListingsProps) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    loadListings()
  }, [])

  const loadListings = async () => {
    try {
      setLoading(true)
      const data = await fetchHostListings()
      setListings(data)
    } catch (error) {
      console.error('Error loading listings:', error)
      toast.error('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (listingId: number) => {
    try {
      setActionLoading(listingId)
      await publishListing(listingId.toString())
      toast.success('Listing published!')
      await loadListings()
    } catch (error) {
      console.error('Error publishing listing:', error)
      toast.error('Failed to publish listing')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnpublish = async (listingId: number) => {
    try {
      setActionLoading(listingId)
      await unpublishListing(listingId.toString())
      toast.success('Listing unpublished')
      await loadListings()
    } catch (error) {
      console.error('Error unpublishing listing:', error)
      toast.error('Failed to unpublish listing')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeactivate = async (listingId: number) => {
    if (!confirm('Are you sure you want to deactivate this listing?')) return

    try {
      setActionLoading(listingId)
      await deactivateListing(listingId.toString())
      toast.success('Listing deactivated')
      await loadListings()
    } catch (error) {
      console.error('Error deactivating listing:', error)
      toast.error('Failed to deactivate listing')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (listingId: number) => {
    if (!confirm('Are you sure you want to permanently delete this listing? This cannot be undone.')) return

    try {
      setActionLoading(listingId)
      await deleteListing(listingId.toString())
      toast.success('Listing deleted')
      await loadListings()
    } catch (error) {
      console.error('Error deleting listing:', error)
      toast.error('Failed to delete listing')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <NeumoCard>
          <p className="nm-body" style={{ textAlign: 'center', fontSize: 12 }}>
            Loading your listings...
          </p>
        </NeumoCard>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 className="nm-heading-lg" style={{ fontSize: 18 }}>
          Your Listings
        </h2>
        {onCreateNew && (
          <button
            type="button"
            className="nm-pill nm-pill--active"
            style={{ fontSize: 11 }}
            onClick={onCreateNew}
          >
            + Create New
          </button>
        )}
      </div>

      {/* Empty state */}
      {listings.length === 0 && (
        <NeumoCard>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p className="nm-body" style={{ fontSize: 14, marginBottom: 8 }}>
              You don't have any listings yet
            </p>
            <p className="nm-body" style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
              Create your first listing to start hosting travel nurses
            </p>
            {onCreateNew && (
              <button
                type="button"
                className="nm-pill nm-pill--active"
                onClick={onCreateNew}
              >
                Create Your First Listing
              </button>
            )}
          </div>
        </NeumoCard>
      )}

      {/* Listings grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {listings.map((listing) => (
          <NeumoCard key={listing.id}>
            <div style={{ display: 'flex', gap: 12 }}>
              {/* Image */}
              <div
                style={{
                  width: 120,
                  height: 100,
                  borderRadius: 16,
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundImage: listing.imageUrl
                    ? `url(${listing.imageUrl})`
                    : 'linear-gradient(135deg, #e0e0e0, #f5f5f5)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 4,
                  }}
                >
                  <h3
                    className="nm-heading-lg"
                    style={{ fontSize: 14, margin: 0 }}
                  >
                    {listing.title}
                  </h3>

                  {/* Status badges */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {listing.verifiedHost && (
                      <span
                        className="nm-tag"
                        style={{
                          fontSize: 9,
                          background: 'linear-gradient(135deg, #10B981, #14B8A6)',
                          color: 'white',
                        }}
                      >
                        Published
                      </span>
                    )}
                    {!listing.verifiedHost && (
                      <span
                        className="nm-tag"
                        style={{
                          fontSize: 9,
                          background: '#f59e0b',
                          color: 'white',
                        }}
                      >
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                <p className="nm-body" style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                  {listing.city}, {listing.state} · {listing.hospitalName}
                </p>

                <p
                  className="nm-body"
                  style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}
                >
                  ${listing.pricePerMonth.toLocaleString()} / month
                </p>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  {listing.rating && (
                    <div style={{ fontSize: 11 }}>
                      <span>⭐</span>
                      <span style={{ marginLeft: 4 }}>
                        {listing.rating.toFixed(1)}
                      </span>
                      {listing.reviewCount && (
                        <span style={{ color: '#6b7280' }}>
                          {' '}({listing.reviewCount})
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    {listing.roomType === 'entire-place' && 'Entire place'}
                    {listing.roomType === 'private-room' && 'Private room'}
                    {listing.roomType === 'shared' && 'Shared room'}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {onEdit && (
                    <button
                      type="button"
                      className="nm-pill"
                      style={{ fontSize: 10, paddingInline: 10, paddingBlock: 5 }}
                      onClick={() => onEdit(listing)}
                      disabled={actionLoading === listing.id}
                    >
                      Edit
                    </button>
                  )}

                  {!listing.verifiedHost ? (
                    <button
                      type="button"
                      className="nm-pill nm-pill--active"
                      style={{ fontSize: 10, paddingInline: 10, paddingBlock: 5 }}
                      onClick={() => handlePublish(listing.id)}
                      disabled={actionLoading === listing.id}
                    >
                      {actionLoading === listing.id ? 'Publishing...' : 'Publish'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="nm-pill"
                      style={{ fontSize: 10, paddingInline: 10, paddingBlock: 5 }}
                      onClick={() => handleUnpublish(listing.id)}
                      disabled={actionLoading === listing.id}
                    >
                      {actionLoading === listing.id ? 'Unpublishing...' : 'Unpublish'}
                    </button>
                  )}

                  <button
                    type="button"
                    className="nm-pill"
                    style={{
                      fontSize: 10,
                      paddingInline: 10,
                      paddingBlock: 5,
                      color: '#ef4444',
                    }}
                    onClick={() => handleDeactivate(listing.id)}
                    disabled={actionLoading === listing.id}
                  >
                    Deactivate
                  </button>

                  <button
                    type="button"
                    className="nm-pill"
                    style={{
                      fontSize: 10,
                      paddingInline: 10,
                      paddingBlock: 5,
                      color: '#dc2626',
                    }}
                    onClick={() => handleDelete(listing.id)}
                    disabled={actionLoading === listing.id}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </NeumoCard>
        ))}
      </div>
    </div>
  )
}
