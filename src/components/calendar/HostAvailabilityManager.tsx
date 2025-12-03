import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { CalendarPicker } from './CalendarPicker'
import {
  availabilityService,
  type DayAvailability,
  type AvailabilityBlock,
  type BlockReason,
} from '../../services/availabilityService'
import { type Listing } from '../../types'
import toast from 'react-hot-toast'

interface HostAvailabilityManagerProps {
  listing: Listing
  onClose?: () => void
}

export function HostAvailabilityManager({
  listing,
  onClose,
}: HostAvailabilityManagerProps) {
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Block dates form
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [blockStartDate, setBlockStartDate] = useState('')
  const [blockEndDate, setBlockEndDate] = useState('')
  const [blockReason, setBlockReason] = useState<BlockReason>('other')
  const [blockNotes, setBlockNotes] = useState('')

  useEffect(() => {
    loadAvailability()
  }, [listing.id])

  const loadAvailability = async () => {
    try {
      setLoading(true)
      const [dayAvail, blockList] = await Promise.all([
        availabilityService.getDayAvailability(listing.id.toString()),
        availabilityService.getListingBlocks(listing.id.toString()),
      ])
      setAvailability(dayAvail)
      setBlocks(blockList)
    } catch (error) {
      console.error('Error loading availability:', error)
      toast.error('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  const handleBlockDates = async () => {
    if (!blockStartDate || !blockEndDate) {
      toast.error('Please select start and end dates')
      return
    }

    try {
      setActionLoading(true)
      await availabilityService.blockDates(
        listing.id.toString(),
        blockStartDate,
        blockEndDate,
        blockReason,
        blockNotes || undefined
      )
      toast.success('Dates blocked successfully')
      setShowBlockForm(false)
      setBlockStartDate('')
      setBlockEndDate('')
      setBlockReason('other')
      setBlockNotes('')
      await loadAvailability()
    } catch (error: any) {
      console.error('Error blocking dates:', error)
      toast.error(error.message || 'Failed to block dates')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnblock = async (blockId: string) => {
    if (!confirm('Are you sure you want to unblock these dates?')) return

    try {
      setActionLoading(true)
      await availabilityService.unblockDates(blockId)
      toast.success('Dates unblocked')
      await loadAvailability()
    } catch (error: any) {
      console.error('Error unblocking dates:', error)
      toast.error(error.message || 'Failed to unblock dates')
    } finally {
      setActionLoading(false)
    }
  }

  const blockedBlocks = blocks.filter((b) => b.status === 'blocked')
  const bookedBlocks = blocks.filter((b) => b.status === 'booked')

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <NeumoCard>
          <p className="nm-body" style={{ textAlign: 'center', fontSize: 12 }}>
            Loading calendar...
          </p>
        </NeumoCard>
      </div>
    )
  }

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 className="nm-heading-lg" style={{ fontSize: 18, margin: 0 }}>
          Manage Availability
        </h2>
        {onClose && (
          <button
            type="button"
            className="nm-pill"
            style={{ fontSize: 11 }}
            onClick={onClose}
          >
            Close
          </button>
        )}
      </div>

      <p className="nm-body" style={{ fontSize: 12, marginBottom: 16 }}>
        {listing.title}
      </p>

      {/* Calendar */}
      <CalendarPicker
        availability={availability}
        selectedStartDate={blockStartDate}
        selectedEndDate={blockEndDate}
        onDateSelect={(start, end) => {
          setBlockStartDate(start)
          setBlockEndDate(end || '')
        }}
        mode="range"
      />

      {/* Block dates form */}
      {showBlockForm ? (
        <NeumoCard style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 className="nm-heading-lg" style={{ fontSize: 14 }}>
              Block Selected Dates
            </h3>

            <div>
              <label
                className="nm-body"
                style={{ fontSize: 11, display: 'block', marginBottom: 4 }}
              >
                Reason for blocking:
              </label>
              <select
                className="nm-input"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value as BlockReason)}
                style={{ width: '100%' }}
              >
                <option value="other">Other</option>
                <option value="maintenance">Maintenance</option>
                <option value="personal_use">Personal Use</option>
              </select>
            </div>

            <div>
              <label
                className="nm-body"
                style={{ fontSize: 11, display: 'block', marginBottom: 4 }}
              >
                Notes (optional):
              </label>
              <textarea
                className="nm-input"
                value={blockNotes}
                onChange={(e) => setBlockNotes(e.target.value)}
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="Add any additional notes..."
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="nm-pill"
                style={{ flex: 1, fontSize: 11 }}
                onClick={() => {
                  setShowBlockForm(false)
                  setBlockStartDate('')
                  setBlockEndDate('')
                  setBlockReason('other')
                  setBlockNotes('')
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="nm-pill nm-pill--active"
                style={{ flex: 1, fontSize: 11 }}
                onClick={handleBlockDates}
                disabled={!blockStartDate || !blockEndDate || actionLoading}
              >
                {actionLoading ? 'Blocking...' : 'Block Dates'}
              </button>
            </div>
          </div>
        </NeumoCard>
      ) : (
        <button
          type="button"
          className="nm-pill nm-pill--active"
          style={{ width: '100%', marginTop: 16, fontSize: 12 }}
          onClick={() => setShowBlockForm(true)}
          disabled={!blockStartDate || !blockEndDate}
        >
          Block Selected Dates
        </button>
      )}

      {/* Blocked dates list */}
      {blockedBlocks.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3
            className="nm-heading-lg"
            style={{ fontSize: 14, marginBottom: 12 }}
          >
            Blocked Dates
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {blockedBlocks.map((block) => (
              <NeumoCard key={block.id}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      className="nm-body"
                      style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}
                    >
                      {new Date(block.startDate).toLocaleDateString()} -{' '}
                      {new Date(block.endDate).toLocaleDateString()}
                    </p>
                    {block.blockReason && (
                      <p
                        className="nm-body"
                        style={{ fontSize: 10, color: '#6b7280' }}
                      >
                        Reason: {block.blockReason.replace('_', ' ')}
                      </p>
                    )}
                    {block.notes && (
                      <p
                        className="nm-body"
                        style={{ fontSize: 10, color: '#6b7280' }}
                      >
                        {block.notes}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="nm-pill"
                    style={{ fontSize: 10, color: '#ef4444' }}
                    onClick={() => handleUnblock(block.id)}
                    disabled={actionLoading}
                  >
                    Unblock
                  </button>
                </div>
              </NeumoCard>
            ))}
          </div>
        </div>
      )}

      {/* Booked dates list */}
      {bookedBlocks.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3
            className="nm-heading-lg"
            style={{ fontSize: 14, marginBottom: 12 }}
          >
            Upcoming Bookings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bookedBlocks.map((block) => (
              <NeumoCard key={block.id}>
                <div>
                  <p
                    className="nm-body"
                    style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}
                  >
                    {new Date(block.startDate).toLocaleDateString()} -{' '}
                    {new Date(block.endDate).toLocaleDateString()}
                  </p>
                  <p
                    className="nm-body"
                    style={{ fontSize: 10, color: '#10b981' }}
                  >
                    Booked
                  </p>
                </div>
              </NeumoCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
