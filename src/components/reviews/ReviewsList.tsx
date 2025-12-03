import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { reviewService, type Review, type RatingBreakdown } from '../../services/reviewService'
import { VerificationIcon } from '../verification/VerificationBadge'
import toast from 'react-hot-toast'

interface ReviewsListProps {
  listingId: string
  showBreakdown?: boolean
}

export function ReviewsList({ listingId, showBreakdown = true }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [breakdown, setBreakdown] = useState<RatingBreakdown | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReviews()
  }, [listingId])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const [reviewsData, breakdownData] = await Promise.all([
        reviewService.getListingReviews(listingId),
        showBreakdown ? reviewService.getRatingBreakdown(listingId) : Promise.resolve(null),
      ])
      setReviews(reviewsData)
      setBreakdown(breakdownData)
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const StarDisplay = ({ rating }: { rating: number }) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            fontSize: 14,
            color: star <= rating ? '#f59e0b' : '#d1d5db',
          }}
        >
          ★
        </span>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <NeumoCard>
          <p className="nm-body" style={{ textAlign: 'center', fontSize: 12 }}>
            Loading reviews...
          </p>
        </NeumoCard>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div style={{ padding: 16 }}>
        <NeumoCard>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
            <p className="nm-body" style={{ fontSize: 14, marginBottom: 4 }}>
              No reviews yet
            </p>
            <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
              Be the first to review this listing
            </p>
          </div>
        </NeumoCard>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Rating Breakdown */}
      {showBreakdown && breakdown && (
        <NeumoCard style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {breakdown.overallRating.toFixed(1)}
                </div>
                <StarDisplay rating={Math.round(breakdown.overallRating)} />
              </div>
              <div style={{ flex: 1 }}>
                <p className="nm-body" style={{ fontSize: 12, fontWeight: 600 }}>
                  {breakdown.reviewCount} {breakdown.reviewCount === 1 ? 'review' : 'reviews'}
                </p>
                {breakdown.recommendPercentage !== undefined && (
                  <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
                    {breakdown.recommendPercentage.toFixed(0)}% would recommend
                  </p>
                )}
              </div>
            </div>

            {/* Star Distribution */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count =
                  stars === 5
                    ? breakdown.fiveStarCount
                    : stars === 4
                    ? breakdown.fourStarCount
                    : stars === 3
                    ? breakdown.threeStarCount
                    : stars === 2
                    ? breakdown.twoStarCount
                    : breakdown.oneStarCount

                const percentage = breakdown.reviewCount > 0
                  ? (count / breakdown.reviewCount) * 100
                  : 0

                return (
                  <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="nm-body" style={{ fontSize: 10, width: 20 }}>
                      {stars}★
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        background: 'rgba(148,163,184,0.2)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: '#f59e0b',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <span className="nm-body" style={{ fontSize: 10, width: 24, color: '#6b7280' }}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Category Ratings */}
            {(breakdown.cleanlinessAvg || breakdown.accuracyAvg) && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(148,163,184,0.15)',
                }}
              >
                {breakdown.cleanlinessAvg && (
                  <div>
                    <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                      Cleanliness
                    </p>
                    <p className="nm-body" style={{ fontSize: 12, fontWeight: 600 }}>
                      {breakdown.cleanlinessAvg.toFixed(1)} ★
                    </p>
                  </div>
                )}
                {breakdown.accuracyAvg && (
                  <div>
                    <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                      Accuracy
                    </p>
                    <p className="nm-body" style={{ fontSize: 12, fontWeight: 600 }}>
                      {breakdown.accuracyAvg.toFixed(1)} ★
                    </p>
                  </div>
                )}
                {breakdown.communicationAvg && (
                  <div>
                    <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                      Communication
                    </p>
                    <p className="nm-body" style={{ fontSize: 12, fontWeight: 600 }}>
                      {breakdown.communicationAvg.toFixed(1)} ★
                    </p>
                  </div>
                )}
                {breakdown.locationAvg && (
                  <div>
                    <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                      Location
                    </p>
                    <p className="nm-body" style={{ fontSize: 12, fontWeight: 600 }}>
                      {breakdown.locationAvg.toFixed(1)} ★
                    </p>
                  </div>
                )}
                {breakdown.valueAvg && (
                  <div>
                    <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>
                      Value
                    </p>
                    <p className="nm-body" style={{ fontSize: 12, fontWeight: 600 }}>
                      {breakdown.valueAvg.toFixed(1)} ★
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </NeumoCard>
      )}

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reviews.map((review) => (
          <NeumoCard key={review.id}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Reviewer Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, #14B8A6, #FB923C)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  👩‍⚕️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p className="nm-body" style={{ fontSize: 13, fontWeight: 600 }}>
                      {review.reviewerName || 'Anonymous'}
                    </p>
                    {review.reviewerVerified === 'verified' && (
                      <VerificationIcon isVerified={true} />
                    )}
                  </div>
                  <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <StarDisplay rating={review.rating} />
              </div>

              {/* Title */}
              {review.title && (
                <h4 className="nm-heading-lg" style={{ fontSize: 14, margin: 0 }}>
                  {review.title}
                </h4>
              )}

              {/* Comment */}
              <p className="nm-body" style={{ fontSize: 12, lineHeight: 1.6 }}>
                {review.comment}
              </p>

              {/* Pros/Cons */}
              {(review.pros && review.pros.length > 0) ||
              (review.cons && review.cons.length > 0) ? (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {review.pros && review.pros.length > 0 && (
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <p className="nm-body" style={{ fontSize: 10, color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
                        PROS:
                      </p>
                      {review.pros.map((pro, idx) => (
                        <p key={idx} className="nm-body" style={{ fontSize: 11, marginBottom: 2 }}>
                          ✓ {pro}
                        </p>
                      ))}
                    </div>
                  )}
                  {review.cons && review.cons.length > 0 && (
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <p className="nm-body" style={{ fontSize: 10, color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>
                        CONS:
                      </p>
                      {review.cons.map((con, idx) => (
                        <p key={idx} className="nm-body" style={{ fontSize: 11, marginBottom: 2 }}>
                          • {con}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Would Recommend */}
              {review.wouldRecommend && (
                <div
                  style={{
                    padding: 8,
                    borderRadius: 12,
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                >
                  <p className="nm-body" style={{ fontSize: 11, color: '#059669' }}>
                    ✓ Would recommend to other travel nurses
                  </p>
                </div>
              )}

              {/* Host Response */}
              {review.hostResponse && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 16,
                    background: 'rgba(148,163,184,0.05)',
                    border: '1px solid rgba(148,163,184,0.15)',
                  }}
                >
                  <p className="nm-body" style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>
                    Response from {review.hostName || 'Host'}:
                  </p>
                  <p className="nm-body" style={{ fontSize: 11, lineHeight: 1.5 }}>
                    {review.hostResponse}
                  </p>
                  {review.hostRespondedAt && (
                    <p className="nm-body" style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>
                      {new Date(review.hostRespondedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Helpful Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
                <button
                  type="button"
                  className="nm-pill"
                  style={{ fontSize: 10, paddingInline: 10, paddingBlock: 5 }}
                >
                  👍 Helpful {review.helpfulCount > 0 && `(${review.helpfulCount})`}
                </button>
              </div>
            </div>
          </NeumoCard>
        ))}
      </div>
    </div>
  )
}
