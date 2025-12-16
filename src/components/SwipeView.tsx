import { useState } from 'react'
import { SwipeableCard } from './SwipeableCard'
import { PhotoCarousel } from './PhotoCarousel'
import { type Listing } from '../types'

interface SwipeViewProps {
  listings: Listing[]
  favorites: Set<number>
  onToggleFavorite: (id: number) => void
  onViewDetails: (listing: Listing) => void
}

export function SwipeView({ listings, favorites, onToggleFavorite, onViewDetails }: SwipeViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentListing = listings[currentIndex]
  const nextListing = listings[currentIndex + 1]
  const hasMore = currentIndex < listings.length

  const handleSwipeRight = () => {
    if (currentListing && !favorites.has(currentListing.id)) {
      onToggleFavorite(currentListing.id)
    }
    moveToNext()
  }

  const handleSwipeLeft = () => {
    moveToNext()
  }

  const moveToNext = () => {
    if (currentIndex < listings.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setCurrentIndex(listings.length)
    }
  }

  const handleUndo = () => {
    if (currentIndex > 0) {
      const previousId = listings[currentIndex - 1]?.id
      if (previousId && favorites.has(previousId)) {
        onToggleFavorite(previousId)
      }
      setCurrentIndex(prev => prev - 1)
    }
  }

  if (!hasMore || !currentListing) {
    const isEmpty = listings.length === 0
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 32,
        }}
      >
        <div style={{ fontSize: 72, marginBottom: 20 }}>
          {isEmpty ? '🔍' : '🎉'}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#222222' }}>
          {isEmpty ? 'No matches found' : 'All caught up!'}
        </h2>
        <p style={{ fontSize: 14, color: '#717171', marginBottom: 24, textAlign: 'center', maxWidth: 300 }}>
          {isEmpty
            ? 'Try adjusting your filters or match quality settings above'
            : "You've seen everything. Check your favorites ❤️"}
        </p>
        {currentIndex > 0 && !isEmpty && (
          <button
            onClick={() => setCurrentIndex(0)}
            style={{
              padding: '14px 32px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(to right, #FF385C, #E31C5F)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255,56,92,0.3)',
            }}
          >
            ↺ Start Over
          </button>
        )}
      </div>
    )
  }

  const formatPrice = (amount: number) => {
    return `$${Math.round(amount / 1000)}k`
  }

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Subtle progress */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11,
          color: '#717171',
          fontWeight: 600,
        }}
      >
        {currentIndex + 1} / {listings.length}
      </div>

      {/* Card stack */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, height: 600, margin: '0 auto' }}>
        {/* Card 3 levels back */}
        {listings[currentIndex + 2] && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%) scale(0.88)',
              width: '100%',
              height: '100%',
              opacity: 0.3,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 16,
                background: '#f7f7f7',
                border: '1px solid #ebebeb',
                boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
              }}
            />
          </div>
        )}

        {/* Next card (underneath) */}
        {nextListing && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%) scale(0.94)',
              width: '100%',
              height: '100%',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 16,
                background: `url(${nextListing.imageUrls?.[0] || nextListing.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid #ebebeb',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
              }}
            />
          </div>
        )}

        {/* Current card */}
        <SwipeableCard
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        >
          <div
            onClick={(e) => {
              // Only open details if not clicking on photo navigation
              const target = e.target as HTMLElement
              if (!target.closest('button')) {
                onViewDetails(currentListing)
              }
            }}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: 16,
              border: '1px solid #ebebeb',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#ffffff',
            }}
          >
            {/* Photo carousel */}
            <PhotoCarousel
              images={currentListing.imageUrls || [currentListing.imageUrl]}
              alt={currentListing.title}
              style={{ borderRadius: 20 }}
            />
            {/* Gradient overlay for text readability */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />

            {/* Match score badge */}
            {currentListing.matchScore && currentListing.matchScore.overall >= 75 && (
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: currentListing.matchScore.overall >= 90 ? 'linear-gradient(to right, #00A699, #007A87)' : 'linear-gradient(to right, #FF385C, #E31C5F)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                {Math.round(currentListing.matchScore.overall)}% Match
              </div>
            )}

            {/* Info button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails(currentListing)
              }}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: 999,
                border: '1px solid rgba(235,235,235,0.8)',
                background: 'rgba(255,255,255,0.95)',
                color: '#222222',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              i
            </button>

            {/* Minimal info overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 20,
                color: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1 }}>
                  {currentListing.title.split(',')[0]}
                </h2>
                <span style={{ fontSize: 16, opacity: 0.9 }}>
                  {currentListing.minutesToHospital}min
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, opacity: 0.95 }}>
                <span>{currentListing.city}</span>
                <span>•</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(currentListing.pricePerMonth)}/mo</span>
              </div>
            </div>
          </div>
        </SwipeableCard>
      </div>

      {/* Floating action buttons */}
      <div
        style={{
          position: 'fixed',
          bottom: 90,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 20,
          zIndex: 100,
        }}
      >
        {/* Pass */}
        <button
          onClick={handleSwipeLeft}
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            border: '2px solid #222222',
            background: '#fff',
            color: '#222222',
            fontSize: 24,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            fontWeight: 600,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.background = '#f7f7f7'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.background = '#fff'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          ✕
        </button>

        {/* Undo */}
        {currentIndex > 0 && (
          <button
            onClick={handleUndo}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              border: '1px solid #dddddd',
              background: '#fff',
              color: '#717171',
              fontSize: 18,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.background = '#f7f7f7'
              e.currentTarget.style.borderColor = '#222222'
              e.currentTarget.style.color = '#222222'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.borderColor = '#dddddd'
              e.currentTarget.style.color = '#717171'
            }}
          >
            ↺
          </button>
        )}

        {/* Like */}
        <button
          onClick={handleSwipeRight}
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            border: 'none',
            background: 'linear-gradient(to right, #FF385C, #E31C5F)',
            color: '#fff',
            fontSize: 24,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255,56,92,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,56,92,0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,56,92,0.4)'
          }}
        >
          ❤️
        </button>
      </div>
    </div>
  )
}
