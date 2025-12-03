import { useState, useEffect } from 'react'
import { bookingService } from '../../services/bookingService'
import { availabilityService, type DayAvailability } from '../../services/availabilityService'
import { CalendarPicker } from '../calendar/CalendarPicker'
import type { Listing } from '../../types'
import toast from 'react-hot-toast'

interface BookingRequestFormWithCalendarProps {
  listing: Listing
  hostId: string
  onSuccess: () => void
  onCancel: () => void
}

export function BookingRequestFormWithCalendar({
  listing,
  hostId,
  onSuccess,
  onCancel,
}: BookingRequestFormWithCalendarProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(true)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    loadAvailability()
  }, [listing.id])

  useEffect(() => {
    if (startDate && endDate) {
      checkAvailability()
    } else {
      setIsAvailable(null)
    }
  }, [startDate, endDate])

  const loadAvailability = async () => {
    try {
      setLoadingAvailability(true)
      const avail = await availabilityService.getDayAvailability(
        listing.id.toString()
      )
      setAvailability(avail)
    } catch (error) {
      console.error('Error loading availability:', error)
      toast.error('Failed to load availability')
    } finally {
      setLoadingAvailability(false)
    }
  }

  const checkAvailability = async () => {
    try {
      setCheckingAvailability(true)
      const available = await availabilityService.isDateRangeAvailable(
        listing.id.toString(),
        startDate,
        endDate
      )
      setIsAvailable(available)

      if (!available) {
        toast.error('Selected dates are not available')
      }
    } catch (error) {
      console.error('Error checking availability:', error)
    } finally {
      setCheckingAvailability(false)
    }
  }

  // Calculate estimated cost
  const calculateCost = () => {
    if (!startDate || !endDate) return null

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const months = Number((diffDays / 30).toFixed(1))
    const total = Math.round(months * listing.pricePerMonth)

    return { months, total, days: diffDays }
  }

  const cost = calculateCost()

  const handleDateSelect = (start: string, end?: string) => {
    setStartDate(start)
    setEndDate(end || '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDate || !endDate) {
      toast.error('Please select your contract dates using the calendar')
      return
    }

    if (isAvailable === false) {
      toast.error('Selected dates are not available')
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end <= start) {
      toast.error('End date must be after start date')
      return
    }

    setLoading(true)

    try {
      const result = await bookingService.createBooking({
        listingId: listing.id,
        hostId,
        startDate,
        endDate,
        monthlyRate: listing.pricePerMonth,
        nurseMessage: message || undefined,
      })

      if (result.success) {
        toast.success('Booking request sent!')
        onSuccess()
      } else {
        toast.error(result.error || 'Failed to send booking request')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h3 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 8 }}>
          Request to Book
        </h3>
        <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
          {listing.title}
        </p>
      </div>

      {/* Calendar */}
      <div>
        <label
          className="nm-body"
          style={{ fontSize: 12, display: 'block', marginBottom: 8 }}
        >
          Select your dates:
        </label>
        {loadingAvailability ? (
          <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
            Loading calendar...
          </p>
        ) : (
          <CalendarPicker
            availability={availability}
            selectedStartDate={startDate}
            selectedEndDate={endDate}
            onDateSelect={handleDateSelect}
            mode="range"
          />
        )}
      </div>

      {/* Selected dates summary */}
      {startDate && endDate && (
        <div
          style={{
            padding: 12,
            borderRadius: 16,
            background:
              isAvailable === false
                ? 'rgba(239,68,68,0.1)'
                : isAvailable === true
                ? 'rgba(16,185,129,0.1)'
                : 'rgba(148,163,184,0.1)',
            border: `1px solid ${
              isAvailable === false
                ? 'rgba(239,68,68,0.2)'
                : isAvailable === true
                ? 'rgba(16,185,129,0.2)'
                : 'rgba(148,163,184,0.2)'
            }`,
          }}
        >
          <p
            className="nm-body"
            style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}
          >
            Selected Dates
          </p>
          <p className="nm-body" style={{ fontSize: 12, marginBottom: 4 }}>
            {new Date(startDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}{' '}
            -{' '}
            {new Date(endDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          {cost && (
            <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
              {cost.days} nights ({cost.months.toFixed(1)} months) • $
              {cost.total.toLocaleString()}
            </p>
          )}
          {checkingAvailability && (
            <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
              Checking availability...
            </p>
          )}
          {isAvailable === false && (
            <p
              className="nm-body"
              style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}
            >
              ⚠️ These dates are not available
            </p>
          )}
          {isAvailable === true && (
            <p
              className="nm-body"
              style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}
            >
              ✓ Dates are available
            </p>
          )}
        </div>
      )}

      {/* Message */}
      <div>
        <label
          className="nm-body"
          style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
        >
          Message to host (optional):
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell the host about yourself and your assignment..."
          rows={3}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 16,
            border: '1px solid rgba(148,163,184,0.3)',
            fontSize: 12,
            resize: 'vertical',
            fontFamily: 'inherit',
            background: 'rgba(255,255,255,0.9)',
            boxShadow:
              'inset 0 2px 4px rgba(15,23,42,0.06), -2px -2px 6px rgba(255,255,255,0.9)',
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 16,
            border: 'none',
            background: 'rgba(148,163,184,0.15)',
            color: '#1f2937',
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(148,163,184,0.15)',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !startDate || !endDate || isAvailable === false}
          style={{
            flex: 2,
            padding: '12px 16px',
            borderRadius: 16,
            border: 'none',
            background:
              loading ||
              !startDate ||
              !endDate ||
              isAvailable === false
                ? 'rgba(148,163,184,0.3)'
                : 'linear-gradient(135deg, #14B8A6, #10B981)',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            cursor:
              loading ||
              !startDate ||
              !endDate ||
              isAvailable === false
                ? 'not-allowed'
                : 'pointer',
            boxShadow:
              loading ||
              !startDate ||
              !endDate ||
              isAvailable === false
                ? 'none'
                : '0 8px 18px rgba(20,184,166,0.35)',
            transition: 'all 0.2s ease',
          }}
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </div>
    </div>
  )
}
