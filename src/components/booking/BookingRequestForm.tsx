import { useState } from 'react';
import { bookingService } from '../../services/bookingService';
import type { Listing } from '../../types';
import toast from 'react-hot-toast';

interface BookingRequestFormProps {
  listing: Listing;
  hostId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BookingRequestForm({ listing, hostId, onSuccess, onCancel }: BookingRequestFormProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate estimated cost
  const calculateCost = () => {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Number((diffDays / 30).toFixed(1));
    const total = Math.round(months * listing.pricePerMonth);

    return { months, total };
  };

  const cost = calculateCost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error('Please select your contract dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      const result = await bookingService.createBooking({
        listingId: listing.id,
        hostId,
        startDate,
        endDate,
        monthlyRate: listing.pricePerMonth,
        nurseMessage: message || undefined,
      });

      if (result.success) {
        toast.success('Booking request sent!');
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to send booking request');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h3 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 8 }}>
          Request to Book
        </h3>
        <p className="nm-body" style={{ fontSize: 13, color: '#6b7280' }}>
          {listing.title}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Start Date */}
        <div>
          <label className="nm-body" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Contract Start Date
          </label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 14,
              border: '1px solid rgba(148,163,184,0.3)',
              background: 'rgba(255,255,255,0.9)',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="nm-body" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Contract End Date
          </label>
          <input
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 14,
              border: '1px solid rgba(148,163,184,0.3)',
              background: 'rgba(255,255,255,0.9)',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Cost Estimate */}
        {cost && (
          <div style={{
            padding: 12,
            borderRadius: 14,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
                {cost.months} months × ${listing.pricePerMonth.toLocaleString()}/month
              </span>
              <span className="nm-body" style={{ fontSize: 16, fontWeight: 700, color: '#6366f1' }}>
                ${cost.total.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Message */}
        <div>
          <label className="nm-body" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Message to Host <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 14,
              border: '1px solid rgba(148,163,184,0.3)',
              background: 'rgba(255,255,255,0.9)',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
            placeholder="Tell the host about your assignment..."
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            className="nm-pill"
            style={{ flex: 1, fontSize: 14 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="nm-pill nm-pill--active"
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
