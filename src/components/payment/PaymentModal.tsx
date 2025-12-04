import { useState } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { paymentService } from '../../services/paymentService'
import toast from 'react-hot-toast'

interface PaymentModalProps {
  bookingId: string
  totalAmount: number
  onSuccess: () => void
  onCancel: () => void
}

type PaymentState = 'review' | 'processing' | 'success'

export function PaymentModal({ bookingId, totalAmount, onSuccess, onCancel }: PaymentModalProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>('review')
  const [isProcessing, setIsProcessing] = useState(false)

  const payment = paymentService.calculatePayment(totalAmount)

  const handlePayment = async () => {
    try {
      setIsProcessing(true)
      setPaymentState('processing')

      // Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent(bookingId)

      // In production, you would:
      // 1. Load Stripe Elements
      // 2. Confirm the payment with the clientSecret
      // 3. Handle 3D Secure if needed
      // 4. Update booking status on success

      // For now, simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log('Payment Intent Created:', paymentIntent)

      setPaymentState('success')

      // Wait a moment before calling onSuccess
      setTimeout(() => {
        onSuccess()
      }, 1500)

    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error('Payment failed. Please try again.')
      setPaymentState('review')
      setIsProcessing(false)
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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && paymentState === 'review' && !isProcessing) {
          onCancel()
        }
      }}
    >
      <div style={{ maxWidth: 440, width: '100%' }}>
        <NeumoCard>
          <div style={{ padding: 24 }}>
            {paymentState === 'review' && (
              <>
                {/* Header */}
                <div style={{ marginBottom: 24, textAlign: 'center' }}>
                  <p style={{ fontSize: 48, marginBottom: 12 }}>💳</p>
                  <h2 className="nm-heading-lg" style={{ fontSize: 20, marginBottom: 8 }}>
                    Review Payment
                  </h2>
                  <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
                    Complete your booking payment
                  </p>
                </div>

                {/* Payment Breakdown */}
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'rgba(148,163,184,0.05)',
                    border: '1px solid rgba(148,163,184,0.15)',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="nm-body" style={{ fontSize: 13, color: '#6b7280' }}>
                        Accommodation
                      </span>
                      <span className="nm-body" style={{ fontSize: 13, fontWeight: 600 }}>
                        {formatCurrency(payment.subtotal)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="nm-body" style={{ fontSize: 13, color: '#6b7280' }}>
                        Platform Fee (10%)
                      </span>
                      <span className="nm-body" style={{ fontSize: 13, fontWeight: 600 }}>
                        {formatCurrency(payment.platformFee)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 1,
                        background: 'rgba(148,163,184,0.2)',
                        margin: '4px 0',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="nm-heading-lg" style={{ fontSize: 15 }}>
                        Total
                      </span>
                      <span className="nm-heading-lg" style={{ fontSize: 18 }}>
                        {formatCurrency(payment.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Host Payout Info */}
                <div
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'rgba(99,102,241,0.05)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    marginBottom: 24,
                  }}
                >
                  <p className="nm-body" style={{ fontSize: 11, color: '#6366f1', textAlign: 'center' }}>
                    🏡 Host receives {formatCurrency(payment.hostPayout)} after platform fee
                  </p>
                </div>

                {/* Mock Payment Note */}
                <div
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'rgba(251,146,60,0.1)',
                    border: '1px solid rgba(251,146,60,0.3)',
                    marginBottom: 24,
                  }}
                >
                  <p className="nm-body" style={{ fontSize: 10, color: '#f97316', textAlign: 'center' }}>
                    ⚠️ Demo Mode: This is a mock payment. No actual charges will be made.
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="nm-pill"
                    style={{ flex: 1, fontSize: 13, color: '#6b7280' }}
                    onClick={onCancel}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    className="nm-gradient-button"
                    style={{ flex: 1, fontSize: 13 }}
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    Confirm Payment
                  </button>
                </div>
              </>
            )}

            {paymentState === 'processing' && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    border: '4px solid #14B8A6',
                    borderTopColor: 'transparent',
                    borderRadius: 999,
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 24px',
                  }}
                />
                <h3 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 8 }}>
                  Processing Payment
                </h3>
                <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
                  Please wait while we process your payment...
                </p>
                <style>
                  {`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}
                </style>
              </div>
            )}

            {paymentState === 'success' && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontSize: 64, marginBottom: 16 }}>✅</p>
                <h3 className="nm-heading-lg" style={{ fontSize: 20, marginBottom: 8 }}>
                  Payment Successful!
                </h3>
                <p className="nm-body" style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                  Your booking is confirmed. The host will contact you soon.
                </p>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                >
                  <p className="nm-body" style={{ fontSize: 12, color: '#10b981' }}>
                    🎉 Confirmation email sent to your inbox
                  </p>
                </div>
              </div>
            )}
          </div>
        </NeumoCard>
      </div>
    </div>
  )
}
