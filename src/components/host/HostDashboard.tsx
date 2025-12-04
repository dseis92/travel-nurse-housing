import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { EarningsOverview } from './EarningsOverview'
import { ListingPerformance } from './ListingPerformance'
import { BookingRequests } from './BookingRequests'
import { CreateListingForm } from './CreateListingForm'
import { PayoutSettings } from './PayoutSettings'
import { hostAnalyticsService, type DashboardStats } from '../../services/hostAnalyticsService'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'requests' | 'listings' | 'create-listing' | 'payouts'

export function HostDashboard() {
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await hostAnalyticsService.getDashboardStats()
      setStats(data)
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (profile?.role !== 'host') {
    return (
      <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <NeumoCard>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🏠</p>
            <p className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 6 }}>
              Host Dashboard
            </p>
            <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
              Switch to host role to access the dashboard
            </p>
          </div>
        </NeumoCard>
      </div>
    )
  }

  return (
    <div style={{ padding: 16, paddingBottom: 80, maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="nm-heading-lg" style={{ fontSize: 22, marginBottom: 8 }}>
          Host Dashboard
        </h1>
        <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
          Welcome back, {profile?.name || 'Host'}
        </p>
      </div>

      {/* Quick Stats */}
      {loading ? (
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
              Loading dashboard...
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
      ) : stats ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {/* Total Listings */}
          <NeumoCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                  Listings
                </p>
                <span style={{ fontSize: 16 }}>🏠</span>
              </div>
              <p className="nm-heading-lg" style={{ fontSize: 24 }}>
                {stats.totalListings}
              </p>
              <p className="nm-body" style={{ fontSize: 9, color: '#9ca3af' }}>
                {stats.activeListings} active
              </p>
            </div>
          </NeumoCard>

          {/* Pending Requests */}
          <NeumoCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                  Pending
                </p>
                <span style={{ fontSize: 16 }}>📬</span>
              </div>
              <p className="nm-heading-lg" style={{ fontSize: 24 }}>
                {stats.pendingRequests}
              </p>
              <p className="nm-body" style={{ fontSize: 9, color: '#9ca3af' }}>
                Requests
              </p>
            </div>
          </NeumoCard>

          {/* Total Bookings */}
          <NeumoCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                  Bookings
                </p>
                <span style={{ fontSize: 16 }}>📅</span>
              </div>
              <p className="nm-heading-lg" style={{ fontSize: 24 }}>
                {stats.totalBookings}
              </p>
              <p className="nm-body" style={{ fontSize: 9, color: '#9ca3af' }}>
                All time
              </p>
            </div>
          </NeumoCard>

          {/* Average Rating */}
          <NeumoCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                  Rating
                </p>
                <span style={{ fontSize: 16 }}>⭐</span>
              </div>
              <p className="nm-heading-lg" style={{ fontSize: 24 }}>
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
              </p>
              <p className="nm-body" style={{ fontSize: 9, color: '#9ca3af' }}>
                {stats.totalReviews} reviews
              </p>
            </div>
          </NeumoCard>
        </div>
      ) : null}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className={`nm-pill ${activeTab === 'overview' ? 'nm-pill--active' : ''}`}
          style={{ fontSize: 12 }}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`nm-pill ${activeTab === 'requests' ? 'nm-pill--active' : ''}`}
          style={{ fontSize: 12, position: 'relative' }}
          onClick={() => setActiveTab('requests')}
        >
          📬 Requests
          {stats && stats.pendingRequests > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: '#ef4444',
                color: 'white',
                fontSize: 9,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 999,
                minWidth: 18,
                textAlign: 'center',
              }}
            >
              {stats.pendingRequests}
            </span>
          )}
        </button>
        <button
          className={`nm-pill ${activeTab === 'listings' ? 'nm-pill--active' : ''}`}
          style={{ fontSize: 12 }}
          onClick={() => setActiveTab('listings')}
        >
          🏠 Listings
        </button>
        <button
          className={`nm-pill ${activeTab === 'payouts' ? 'nm-pill--active' : ''}`}
          style={{ fontSize: 12 }}
          onClick={() => setActiveTab('payouts')}
        >
          💰 Payouts
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <button
            className="nm-pill nm-pill--active"
            style={{ fontSize: 12, fontWeight: 600 }}
            onClick={() => setActiveTab('create-listing')}
          >
            ➕ Create Listing
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <EarningsOverview />
            <ListingPerformance />
          </div>
        )}

        {activeTab === 'requests' && <BookingRequests />}

        {activeTab === 'listings' && <ListingPerformance />}

        {activeTab === 'create-listing' && (
          <CreateListingForm
            onSuccess={() => {
              toast.success('Listing created! Refreshing dashboard...')
              loadStats()
              setActiveTab('listings')
            }}
            onCancel={() => setActiveTab('listings')}
          />
        )}

        {activeTab === 'payouts' && <PayoutSettings />}
      </div>
    </div>
  )
}
