import { useState } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { reviewService, type CreateReviewInput } from '../../services/reviewService'
import toast from 'react-hot-toast'

interface ReviewFormProps {
  listingId: string
  bookingId: string
  hostId: string
  listingTitle: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReviewForm({
  listingId,
  bookingId,
  hostId,
  listingTitle,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)

  // Category ratings
  const [cleanlinessRating, setCleanlinessRating] = useState(5)
  const [accuracyRating, setAccuracyRating] = useState(5)
  const [communicationRating, setCommunicationRating] = useState(5)
  const [locationRating, setLocationRating] = useState(5)
  const [valueRating, setValueRating] = useState(5)

  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (comment.trim().length < 10) {
      toast.error('Review must be at least 10 characters')
      return
    }

    try {
      setIsSubmitting(true)

      const reviewData: CreateReviewInput = {
        listingId,
        bookingId,
        hostId,
        rating,
        cleanlinessRating,
        accuracyRating,
        communicationRating,
        locationRating,
        valueRating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        wouldRecommend,
      }

      await reviewService.createReview(reviewData)
      toast.success('Review submitted successfully!')
      onSuccess?.()
    } catch (error: any) {
      console.error('Error submitting review:', error)
      toast.error(error.message || 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({
    value,
    onChange,
    label,
  }: {
    value: number
    onChange: (val: number) => void
    label: string
  }) => {
    const [hover, setHover] = useState(0)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="nm-body" style={{ fontSize: 11, fontWeight: 600 }}>
          {label}
        </label>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 24,
                padding: 0,
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <span
                style={{
                  color: star <= (hover || value) ? '#f59e0b' : '#d1d5db',
                }}
              >
                ★
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <NeumoCard>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 4 }}>
                Write a Review
              </h2>
              <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
                {listingTitle}
              </p>
            </div>

            {/* Overall Rating */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Overall Rating*
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 32,
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        color: star <= (hoverRating || rating) ? '#f59e0b' : '#d1d5db',
                      }}
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Ratings */}
            <div
              style={{
                padding: 12,
                borderRadius: 16,
                background: 'rgba(148,163,184,0.05)',
                border: '1px solid rgba(148,163,184,0.15)',
              }}
            >
              <h3 className="nm-heading-lg" style={{ fontSize: 13, marginBottom: 12 }}>
                Rate by Category
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <StarRating
                  value={cleanlinessRating}
                  onChange={setCleanlinessRating}
                  label="Cleanliness"
                />
                <StarRating
                  value={accuracyRating}
                  onChange={setAccuracyRating}
                  label="Accuracy"
                />
                <StarRating
                  value={communicationRating}
                  onChange={setCommunicationRating}
                  label="Communication"
                />
                <StarRating
                  value={locationRating}
                  onChange={setLocationRating}
                  label="Location"
                />
                <StarRating
                  value={valueRating}
                  onChange={setValueRating}
                  label="Value"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Title (optional)
              </label>
              <input
                type="text"
                className="nm-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                maxLength={100}
                style={{ width: '100%' }}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Your Review*
              </label>
              <textarea
                className="nm-input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience staying here..."
                rows={5}
                required
                minLength={10}
                style={{ width: '100%', resize: 'vertical' }}
              />
              <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
                {comment.length} / 10 characters minimum
              </p>
            </div>

            {/* Would Recommend */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={wouldRecommend}
                  onChange={(e) => setWouldRecommend(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span className="nm-body" style={{ fontSize: 12 }}>
                  I would recommend this place to other travel nurses
                </span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
              {onCancel && (
                <button
                  type="button"
                  className="nm-pill"
                  style={{ flex: 1, fontSize: 12 }}
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="nm-pill nm-pill--active"
                style={{ flex: 2, fontSize: 12 }}
                disabled={isSubmitting || comment.trim().length < 10}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </form>
      </NeumoCard>
    </div>
  )
}
