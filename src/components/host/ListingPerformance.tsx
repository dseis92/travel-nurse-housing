import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { RatingDisplay } from '../reviews/RatingDisplay'
import { hostAnalyticsService, type ListingPerformance as PerformanceData } from '../../services/hostAnalyticsService'
import toast from 'react-hot-toast'

export function ListingPerformance() {
  const [performance, setPerformance] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPerformance()
  }, [])

  const loadPerformance = async () => {
    try {
      setLoading(true)
      const data = await hostAnalyticsService.getListingPerformance()
      setPerformance(data)
    } catch (error: any) {
      console.error('Error loading listing performance:', error)
      toast.error('Failed to load listing performance')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
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
            Loading performance data...
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
    )
  }

  if (performance.length === 0) {
    return (
      <NeumoCard>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🏠</p>
          <p className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 6 }}>
            No listings yet
          </p>
          <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
            Create your first listing to start earning
          </p>
        </div>
      </NeumoCard>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 className="nm-heading-lg" style={{ fontSize: 14, paddingLeft: 4 }}>
        Your Listings
      </h3>

      {performance.map((listing) => (
        <NeumoCard key={listing.listingId}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Listing Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h4 className="nm-heading-lg" style={{ fontSize: 13, marginBottom: 4 }}>
                  {listing.listingTitle}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {listing.averageRating > 0 ? (
                    <RatingDisplay
                      rating={listing.averageRating}
                      reviewCount={listing.reviewCount}
                      size="small"
                    />
                  ) : (
                    <p className="nm-body" style={{ fontSize: 10, color: '#9ca3af' }}>
                      No reviews yet
                    </p>
                  )}
                </div>
              </div>
              <span
                className="nm-pill nm-pill--active"
                style={{ fontSize: 10 }}
              >
                Active
              </span>
            </div>

            {/* Performance Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                padding: 12,
                borderRadius: 12,
                background: 'rgba(148,163,184,0.05)',
                border: '1px solid rgba(148,163,184,0.15)',
              }}
            >
              {/* Total Earnings */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>💵</span>
                  <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                    Earnings
                  </p>
                </div>
                <p className="nm-heading-lg" style={{ fontSize: 16 }}>
                  {formatCurrency(listing.totalEarnings)}
                </p>
              </div>

              {/* Bookings */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>📅</span>
                  <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                    Bookings
                  </p>
                </div>
                <p className="nm-heading-lg" style={{ fontSize: 16 }}>
                  {listing.bookingCount}
                </p>
              </div>

              {/* Reviews */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>⭐</span>
                  <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                    Reviews
                  </p>
                </div>
                <p className="nm-heading-lg" style={{ fontSize: 16 }}>
                  {listing.reviewCount}
                </p>
              </div>

              {/* Occupancy */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>📊</span>
                  <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                    Occupancy
                  </p>
                </div>
                <p className="nm-heading-lg" style={{ fontSize: 16 }}>
                  {listing.occupancyRate > 0 ? `${listing.occupancyRate}%` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <button
              className="nm-pill"
              style={{ fontSize: 11, width: '100%' }}
              onClick={() => {
                // TODO: Navigate to listing details/edit
                toast('Edit listing feature coming soon', { icon: '🚧' })
              }}
            >
              View Details
            </button>
          </div>
        </NeumoCard>
      ))}
    </div>
  )
}
