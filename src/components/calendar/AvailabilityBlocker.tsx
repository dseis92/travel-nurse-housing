import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { CalendarDatePicker } from './CalendarDatePicker'
import { calendarService, type AvailabilityEntry } from '../../services/calendarService'
import toast from 'react-hot-toast'

interface AvailabilityBlockerProps {
  listingId: string
  listingTitle: string
}

export function AvailabilityBlocker({ listingId, listingTitle }: AvailabilityBlockerProps) {
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null)
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)
  const [notes, setNotes] = useState('')
  const [blocking, setBlocking] = useState(false)
  const [blockedDates, setBlockedDates] = useState<AvailabilityEntry[]>([])
  const [bookedDates, setBookedDates] = useState<AvailabilityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAvailability()
  }, [listingId])

  const loadAvailability = async () => {
    try {
      setLoading(true)
      const [blocked, booked] = await Promise.all([
        calendarService.getBlockedDates(listingId),
        calendarService.getBookedDates(listingId),
      ])
      setBlockedDates(blocked)
      setBookedDates(booked)
    } catch (error: any) {
      console.error('Error loading availability:', error)
      toast.error('Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (startDate: Date, endDate: Date | null) => {
    setSelectedStartDate(startDate)
    setSelectedEndDate(endDate)
  }

  const handleBlockDates = async () => {
    if (!selectedStartDate) {
      toast.error('Please select a start date')
      return
    }

    const endDate = selectedEndDate || selectedStartDate

    try {
      setBlocking(true)
      await calendarService.blockDates({
        listingId,
        startDate: selectedStartDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        notes: notes.trim() || undefined,
      })
      toast.success('Dates blocked successfully')
      setSelectedStartDate(null)
      setSelectedEndDate(null)
      setNotes('')
      await loadAvailability()
    } catch (error: any) {
      console.error('Error blocking dates:', error)
      toast.error(error.message || 'Failed to block dates')
    } finally {
      setBlocking(false)
    }
  }

  const handleUnblock = async (availabilityId: string) => {
    if (!confirm('Unblock these dates?')) return

    try {
      await calendarService.unblockDates(availabilityId)
      toast.success('Dates unblocked')
      await loadAvailability()
    } catch (error: any) {
      console.error('Error unblocking dates:', error)
      toast.error(error.message || 'Failed to unblock dates')
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  // Convert blocked and booked dates to calendar format
  const blockedDateRanges = [
    ...blockedDates.map(entry => ({
      start: new Date(entry.startDate),
      end: new Date(entry.endDate),
    })),
    ...bookedDates.map(entry => ({
      start: new Date(entry.startDate),
      end: new Date(entry.endDate),
    })),
  ]

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
            Loading calendar...
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <h3 className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 4 }}>
          Manage Availability
        </h3>
        <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
          {listingTitle}
        </p>
      </div>

      {/* Calendar */}
      <CalendarDatePicker
        selectedStartDate={selectedStartDate}
        selectedEndDate={selectedEndDate}
        onDateRangeChange={handleDateRangeChange}
        minDate={new Date()}
        blockedDateRanges={blockedDateRanges}
      />

      {/* Block Dates Form */}
      {selectedStartDate && (
        <NeumoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 className="nm-heading-lg" style={{ fontSize: 13 }}>
              Block Selected Dates
            </h4>
            <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
              {formatDateRange(
                selectedStartDate.toISOString().split('T')[0],
                (selectedEndDate || selectedStartDate).toISOString().split('T')[0]
              )}
            </p>
            <div>
              <label className="nm-body" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Notes (optional)
              </label>
              <textarea
                className="nm-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Property maintenance, personal use..."
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <button
              className="nm-pill nm-pill--active"
              style={{ fontSize: 12 }}
              onClick={handleBlockDates}
              disabled={blocking}
            >
              {blocking ? 'Blocking...' : 'Block Dates'}
            </button>
          </div>
        </NeumoCard>
      )}

      {/* Blocked Dates List */}
      {blockedDates.length > 0 && (
        <div>
          <h4 className="nm-heading-lg" style={{ fontSize: 13, marginBottom: 12, paddingLeft: 4 }}>
            Blocked Dates
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {blockedDates.map(entry => (
              <NeumoCard key={entry.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p className="nm-heading-lg" style={{ fontSize: 12, marginBottom: 4 }}>
                      {formatDateRange(entry.startDate, entry.endDate)}
                    </p>
                    {entry.notes && (
                      <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                        {entry.notes}
                      </p>
                    )}
                  </div>
                  <button
                    className="nm-pill"
                    style={{ fontSize: 10, color: '#ef4444' }}
                    onClick={() => handleUnblock(entry.id)}
                  >
                    Unblock
                  </button>
                </div>
              </NeumoCard>
            ))}
          </div>
        </div>
      )}

      {/* Booked Dates List */}
      {bookedDates.length > 0 && (
        <div>
          <h4 className="nm-heading-lg" style={{ fontSize: 13, marginBottom: 12, paddingLeft: 4 }}>
            Booked Dates
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bookedDates.map(entry => (
              <NeumoCard key={entry.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📅</span>
                  <div>
                    <p className="nm-heading-lg" style={{ fontSize: 12, marginBottom: 2 }}>
                      {formatDateRange(entry.startDate, entry.endDate)}
                    </p>
                    <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                      Confirmed booking
                    </p>
                  </div>
                </div>
              </NeumoCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
