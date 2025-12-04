import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { paymentService } from '../../services/paymentService'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

export function PayoutSettings() {
  const { profile } = useAuthStore()
  const [pendingPayouts, setPendingPayouts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stripeConnected, setStripeConnected] = useState(false)

  useEffect(() => {
    loadPayoutInfo()
  }, [profile])

  const loadPayoutInfo = async () => {
    if (!profile) return

    try {
      setLoading(true)
      const pending = await paymentService.getHostPendingPayouts(profile.id)
      setPendingPayouts(pending)

      // In production, check if host has Stripe Connect account
      // For now, using mock data
      setStripeConnected(false)
    } catch (error) {
      console.error('Error loading payout info:', error)
      toast.error('Failed to load payout information')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectStripe = () => {
    // In production, this would:
    // 1. Create Stripe Connect account
    // 2. Redirect to Stripe onboarding
    // 3. Handle OAuth callback
    // 4. Store account ID in database
    toast('Stripe Connect integration coming soon!', { icon: '🚧' })
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
      <div style={{ padding: 16 }}>
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
              Loading payout information...
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
      </div>
    )
  }

  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 className="nm-heading-lg" style={{ fontSize: 20, marginBottom: 8 }}>
          Payouts & Banking
        </h2>
        <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
          Manage your payment settings and view earnings
        </p>
      </div>

      {/* Pending Payouts Card */}
      <NeumoCard style={{ marginBottom: 16 }}>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <p className="nm-body" style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                Pending Payouts
              </p>
              <p className="nm-heading-lg" style={{ fontSize: 28 }}>
                {formatCurrency(pendingPayouts)}
              </p>
            </div>
            <p style={{ fontSize: 48 }}>💰</p>
          </div>
          <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
            From accepted bookings (after 10% platform fee)
          </p>
        </div>
      </NeumoCard>

      {/* Stripe Connect Status */}
      <NeumoCard style={{ marginBottom: 16 }}>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 32 }}>
              {stripeConnected ? '✅' : '⚠️'}
            </p>
            <div style={{ flex: 1 }}>
              <p className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 4 }}>
                {stripeConnected ? 'Stripe Connected' : 'Connect Stripe Account'}
              </p>
              <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
                {stripeConnected
                  ? 'Your payouts are set up and ready'
                  : 'Connect Stripe to receive payouts'}
              </p>
            </div>
          </div>

          {!stripeConnected && (
            <button
              className="nm-gradient-button"
              style={{ width: '100%', fontSize: 13 }}
              onClick={handleConnectStripe}
            >
              Connect Stripe Account
            </button>
          )}

          {stripeConnected && (
            <button
              className="nm-pill"
              style={{ width: '100%', fontSize: 11 }}
              onClick={handleConnectStripe}
            >
              View Stripe Dashboard
            </button>
          )}
        </div>
      </NeumoCard>

      {/* How Payouts Work */}
      <NeumoCard>
        <div style={{ padding: 20 }}>
          <h3 className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 12 }}>
            How Payouts Work
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>1️⃣</span>
              <div>
                <p className="nm-body" style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                  Booking Accepted
                </p>
                <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                  Guest pays when you accept their booking request
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>2️⃣</span>
              <div>
                <p className="nm-body" style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                  Platform Fee
                </p>
                <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                  We deduct 10% to maintain and improve the platform
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>3️⃣</span>
              <div>
                <p className="nm-body" style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                  You Get Paid
                </p>
                <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                  Payout arrives 7 days after booking ends
                </p>
              </div>
            </div>
          </div>
        </div>
      </NeumoCard>

      {/* Demo Notice */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 10,
          background: 'rgba(251,146,60,0.1)',
          border: '1px solid rgba(251,146,60,0.3)',
        }}
      >
        <p className="nm-body" style={{ fontSize: 10, color: '#f97316', textAlign: 'center' }}>
          ⚠️ Demo Mode: Stripe Connect integration coming soon. This is a preview of the payout system.
        </p>
      </div>
    </div>
  )
}
