import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { hostAnalyticsService, type BookingRequest } from '../../services/hostAnalyticsService'
import toast from 'react-hot-toast'

type FilterStatus = 'all' | 'pending' | 'accepted' | 'declined'

export function BookingRequests() {
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [filter])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const filterStatus = filter === 'all' ? undefined : filter
      const data = await hostAnalyticsService.getBookingRequests(filterStatus)
      setRequests(data)
    } catch (error: any) {
      console.error('Error loading booking requests:', error)
      toast.error('Failed to load booking requests')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (bookingId: string) => {
    if (processingId) return

    try {
      setProcessingId(bookingId)
      await hostAnalyticsService.acceptBooking(bookingId)
      toast.success('Booking accepted!')
      await loadRequests()
    } catch (error: any) {
      console.error('Error accepting booking:', error)
      toast.error('Failed to accept booking')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (bookingId: string) => {
    if (processingId) return

    if (!confirm('Are you sure you want to decline this booking request?')) {
      return
    }

    try {
      setProcessingId(bookingId)
      await hostAnalyticsService.declineBooking(bookingId)
      toast.success('Booking declined')
      await loadRequests()
    } catch (error: any) {
      console.error('Error declining booking:', error)
      toast.error('Failed to decline booking')
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b'
      case 'accepted':
        return '#10b981'
      case 'declined':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

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
            Loading requests...
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header with Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 4 }}>
        <div>
          <h3 className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 2 }}>
            Booking Requests
          </h3>
          {pendingCount > 0 && filter !== 'pending' && (
            <p className="nm-body" style={{ fontSize: 10, color: '#f59e0b' }}>
              {pendingCount} pending
            </p>
          )}
        </div>
      </div>

      {/* Status Filter Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(['all', 'pending', 'accepted', 'declined'] as FilterStatus[]).map((status) => (
          <button
            key={status}
            className={`nm-pill ${filter === status ? 'nm-pill--active' : ''}`}
            style={{ fontSize: 11 }}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : getStatusLabel(status)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <NeumoCard>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📬</p>
            <p className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 6 }}>
              No requests
            </p>
            <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
              {filter === 'all'
                ? "You don't have any booking requests yet"
                : `No ${filter} requests`}
            </p>
          </div>
        </NeumoCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map((request) => (
            <NeumoCard key={request.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Request Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 className="nm-heading-lg" style={{ fontSize: 12, marginBottom: 2 }}>
                      {request.listingTitle}
                    </h4>
                    <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </p>
                  </div>
                  <span
                    className="nm-pill"
                    style={{
                      fontSize: 10,
                      color: getStatusColor(request.status),
                      borderColor: getStatusColor(request.status),
                    }}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                {/* Guest Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      overflow: 'hidden',
                      background: request.guestAvatarUrl
                        ? `url(${request.guestAvatarUrl})`
                        : 'linear-gradient(135deg, #14B8A6, #FB923C)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {!request.guestAvatarUrl && (
                      <span style={{ fontSize: 18 }}>👤</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="nm-heading-lg" style={{ fontSize: 12, marginBottom: 2 }}>
                      {request.guestName}
                    </p>
                    <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                      Requested {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Price and Duration */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 10,
                    borderRadius: 10,
                    background: 'rgba(148,163,184,0.05)',
                    border: '1px solid rgba(148,163,184,0.15)',
                  }}
                >
                  <div>
                    <p className="nm-body" style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
                      Total Price
                    </p>
                    <p className="nm-heading-lg" style={{ fontSize: 14 }}>
                      {formatCurrency(request.totalPrice)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="nm-body" style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
                      Duration
                    </p>
                    <p className="nm-heading-lg" style={{ fontSize: 14 }}>
                      {Math.ceil(
                        (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      days
                    </p>
                  </div>
                </div>

                {/* Hold Expiration Warning */}
                {request.status === 'pending' && request.holdExpiresAt && (
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: 'rgba(251,146,60,0.1)',
                      border: '1px solid rgba(251,146,60,0.3)',
                    }}
                  >
                    <p className="nm-body" style={{ fontSize: 10, color: '#f97316' }}>
                      ⏰ Hold expires {formatDate(request.holdExpiresAt)}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {request.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="nm-pill"
                      style={{ flex: 1, fontSize: 11, color: '#ef4444' }}
                      onClick={() => handleDecline(request.id)}
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? 'Processing...' : 'Decline'}
                    </button>
                    <button
                      className="nm-pill nm-pill--active"
                      style={{ flex: 2, fontSize: 11 }}
                      onClick={() => handleAccept(request.id)}
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? 'Processing...' : 'Accept Booking'}
                    </button>
                  </div>
                )}
              </div>
            </NeumoCard>
          ))}
        </div>
      )}
    </div>
  )
}
