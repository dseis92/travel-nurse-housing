import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { hostAnalyticsService, type EarningsOverview as EarningsData } from '../../services/hostAnalyticsService'
import toast from 'react-hot-toast'

export function EarningsOverview() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEarnings()
  }, [])

  const loadEarnings = async () => {
    try {
      setLoading(true)
      const data = await hostAnalyticsService.getEarningsOverview()
      setEarnings(data)
    } catch (error: any) {
      console.error('Error loading earnings:', error)
      toast.error('Failed to load earnings data')
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
            Loading earnings...
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

  if (!earnings) {
    return null
  }

  const monthlyGrowth = earnings.lastMonthEarnings > 0
    ? ((earnings.thisMonthEarnings - earnings.lastMonthEarnings) / earnings.lastMonthEarnings) * 100
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Main Earnings Card */}
      <NeumoCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="nm-body" style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                Total Earnings
              </p>
              <h2 className="nm-heading-lg" style={{ fontSize: 32, fontWeight: 700 }}>
                {formatCurrency(earnings.totalEarnings)}
              </h2>
            </div>
            <span style={{ fontSize: 28 }}>💰</span>
          </div>

          {/* This Month vs Last Month */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 12,
              borderRadius: 12,
              background: 'rgba(148,163,184,0.05)',
              border: '1px solid rgba(148,163,184,0.15)',
            }}
          >
            <div>
              <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                This Month
              </p>
              <p className="nm-heading-lg" style={{ fontSize: 16 }}>
                {formatCurrency(earnings.thisMonthEarnings)}
              </p>
            </div>
            {monthlyGrowth !== 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    fontSize: 18,
                    color: monthlyGrowth > 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {monthlyGrowth > 0 ? '↑' : '↓'}
                </span>
                <span
                  className="nm-body"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: monthlyGrowth > 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {Math.abs(monthlyGrowth).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </NeumoCard>

      {/* Secondary Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {/* Pending Payout */}
        <NeumoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                Pending Payout
              </p>
              <span style={{ fontSize: 16 }}>⏳</span>
            </div>
            <p className="nm-heading-lg" style={{ fontSize: 18 }}>
              {formatCurrency(earnings.pendingPayout)}
            </p>
            <p className="nm-body" style={{ fontSize: 9, color: '#9ca3af' }}>
              Processing
            </p>
          </div>
        </NeumoCard>

        {/* Upcoming Earnings */}
        <NeumoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                Upcoming
              </p>
              <span style={{ fontSize: 16 }}>📅</span>
            </div>
            <p className="nm-heading-lg" style={{ fontSize: 18 }}>
              {formatCurrency(earnings.upcomingEarnings)}
            </p>
            <p className="nm-body" style={{ fontSize: 9, color: '#9ca3af' }}>
              Future bookings
            </p>
          </div>
        </NeumoCard>

        {/* Last Month */}
        <NeumoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                Last Month
              </p>
              <span style={{ fontSize: 16 }}>📊</span>
            </div>
            <p className="nm-heading-lg" style={{ fontSize: 18 }}>
              {formatCurrency(earnings.lastMonthEarnings)}
            </p>
            <p className="nm-body" style={{ fontSize: 9, color: '#9ca3af' }}>
              {new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
        </NeumoCard>

        {/* Average per Month */}
        <NeumoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                Avg/Month
              </p>
              <span style={{ fontSize: 16 }}>📈</span>
            </div>
            <p className="nm-heading-lg" style={{ fontSize: 18 }}>
              {formatCurrency((earnings.thisMonthEarnings + earnings.lastMonthEarnings) / 2)}
            </p>
            <p className="nm-body" style={{ fontSize: 9, color: '#9ca3af' }}>
              Last 2 months
            </p>
          </div>
        </NeumoCard>
      </div>
    </div>
  )
}
