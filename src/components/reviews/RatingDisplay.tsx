import { useState } from 'react'

interface RatingDisplayProps {
  rating: number
  reviewCount?: number
  size?: 'small' | 'medium' | 'large'
  showCount?: boolean
}

export function RatingDisplay({
  rating,
  reviewCount,
  size = 'small',
  showCount = true,
}: RatingDisplayProps) {
  const sizeStyles = {
    small: {
      fontSize: 11,
      starSize: 12,
      gap: 3,
    },
    medium: {
      fontSize: 13,
      starSize: 14,
      gap: 4,
    },
    large: {
      fontSize: 15,
      starSize: 16,
      gap: 5,
    },
  }

  const style = sizeStyles[size]

  if (!rating || rating === 0) {
    return (
      <p
        className="nm-body"
        style={{ fontSize: style.fontSize, color: '#6b7280' }}
      >
        No reviews yet
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: style.gap }}>
      <span style={{ fontSize: style.starSize, color: '#f59e0b' }}>★</span>
      <span
        className="nm-body"
        style={{ fontSize: style.fontSize, fontWeight: 600 }}
      >
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount !== undefined && reviewCount > 0 && (
        <span
          className="nm-body"
          style={{ fontSize: style.fontSize - 1, color: '#6b7280' }}
        >
          ({reviewCount})
        </span>
      )}
    </div>
  )
}

// Compact rating badge for overlaying on images
export function RatingBadge({ rating }: { rating: number }) {
  if (!rating || rating === 0) return null

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '4px 8px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.95)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <span style={{ fontSize: 11, color: '#f59e0b' }}>★</span>
      <span
        className="nm-body"
        style={{ fontSize: 11, fontWeight: 600, color: '#1f2937' }}
      >
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

// Star rating input for forms
interface StarRatingInputProps {
  value: number
  onChange: (rating: number) => void
  size?: number
  readonly?: boolean
}

export function StarRatingInput({
  value,
  onChange,
  size = 24,
  readonly = false,
}: StarRatingInputProps) {
  const [hover, setHover] = useState(0)

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          disabled={readonly}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: readonly ? 'default' : 'pointer',
            fontSize: size,
            padding: 0,
            transition: 'transform 0.15s ease',
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
  )
}
