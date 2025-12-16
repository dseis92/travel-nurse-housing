import { useState, useEffect, useMemo } from 'react'
import { type Listing } from '../types'

interface AirbnbLayoutProps {
  listings: Listing[]
  favorites: Set<number>
  onToggleFavorite: (id: number) => void
  onViewDetails: (listing: Listing) => void
  activeTab: 'explore' | 'favorites' | 'messages' | 'profile'
  onTabChange: (tab: 'explore' | 'favorites' | 'messages' | 'profile') => void
}

export function AirbnbLayout({
  listings,
  favorites,
  onToggleFavorite,
  onViewDetails,
  activeTab,
  onTabChange,
}: AirbnbLayoutProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  // Filter listings based on active tab and search query
  const filteredListings = useMemo(() => {
    let filtered = listings

    // First filter by tab (favorites)
    if (activeTab === 'favorites') {
      filtered = filtered.filter(listing => favorites.has(listing.id))
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(listing => {
        return (
          listing.city.toLowerCase().includes(q) ||
          listing.state.toLowerCase().includes(q) ||
          listing.title.toLowerCase().includes(q) ||
          listing.hospitalName.toLowerCase().includes(q)
        )
      })
    }

    console.log('Filtered listings:', filtered.length, 'out of', listings.length)
    return filtered
  }, [listings, activeTab, favorites, searchQuery])

  // Reset index when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentIndex(0) // Reset to first result
    setDragOffset({ x: 0, y: 0 }) // Reset drag state
  }

  // Reset index when active tab changes
  useEffect(() => {
    setCurrentIndex(0)
    setDragOffset({ x: 0, y: 0 })
  }, [activeTab])

  const currentListing = filteredListings[currentIndex]
  const hasMore = currentIndex < filteredListings.length

  const SWIPE_THRESHOLD = 100

  const handleLike = () => {
    console.log('Like button clicked!')
    if (currentListing && !favorites.has(currentListing.id)) {
      onToggleFavorite(currentListing.id)
    }
    moveToNext()
  }

  const handlePass = () => {
    console.log('Pass button clicked!')
    moveToNext()
  }

  const moveToNext = () => {
    console.log('Moving to next card, current index:', currentIndex, 'total:', filteredListings.length)
    if (currentIndex < filteredListings.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setCurrentIndex(filteredListings.length)
    }
    // Reset drag state
    setDragOffset({ x: 0, y: 0 })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setStartPos({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - startPos.x
    const deltaY = touch.clientY - startPos.y
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)

    // Check if swipe threshold was met
    if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
      if (dragOffset.x > 0) {
        // Swipe right - Like
        handleLike()
      } else {
        // Swipe left - Pass
        handlePass()
      }
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 })
    }
  }

  // Mouse event handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - startPos.x
    const deltaY = e.clientY - startPos.y
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    // Check if swipe threshold was met
    if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
      if (dragOffset.x > 0) {
        // Swipe right - Like
        handleLike()
      } else {
        // Swipe left - Pass
        handlePass()
      }
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 })
    }
  }

  const getCardTransform = () => {
    if (!isDragging && dragOffset.x === 0) return 'none'
    const rotation = (dragOffset.x / window.innerWidth) * 20
    return `translateX(${dragOffset.x}px) rotate(${rotation}deg)`
  }

  const getCardOpacity = () => {
    if (!isDragging) return 1
    return 1 - Math.abs(dragOffset.x) / (window.innerWidth * 0.7)
  }

  const formatPrice = (amount: number) => {
    return `$${Math.round(amount / 1000)}k`
  }

  if (!hasMore || !currentListing) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          background: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #ebebeb',
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(to right, #FF385C, #E31C5F)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.5px',
            }}
          >
            Nursery
          </h1>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
          }}
        >
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#222222' }}>
            All caught up!
          </h2>
          <p style={{ fontSize: 14, color: '#717171', marginBottom: 24, textAlign: 'center', maxWidth: 300 }}>
            You've seen everything. Check your favorites ❤️
          </p>
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
        </div>

        {/* Bottom Nav */}
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#ffffff',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #ebebeb',
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
            marginBottom: 16,
            background: 'linear-gradient(to right, #FF385C, #E31C5F)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px',
          }}
        >
          Nursery
        </h1>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid #dddddd',
            background: '#ffffff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          }}
        >
          <span style={{ fontSize: 18, color: '#717171' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by city, hospital..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: '#222222',
              background: 'transparent',
            }}
          />
        </div>
      </div>

      {/* Card Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 24px 150px',
          overflow: 'hidden',
        }}
      >
        {/* Single Card */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => !isDragging && onViewDetails(currentListing)}
          style={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 16,
            border: '1px solid #ebebeb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            background: '#ffffff',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'pointer',
            transform: getCardTransform(),
            opacity: getCardOpacity(),
            transition: isDragging ? 'none' : 'all 0.3s ease-out',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          {/* Image with favorite button */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 280,
              background: `url(${currentListing.imageUrls?.[0] || currentListing.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Favorite button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(currentListing.id)
              }}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                color: favorites.has(currentListing.id) ? '#FF385C' : '#717171',
                fontSize: 18,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {favorites.has(currentListing.id) ? '❤️' : '🤍'}
            </button>
          </div>

          {/* Card Info */}
          <div style={{ padding: 16 }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                marginBottom: 4,
                color: '#222222',
              }}
            >
              {currentListing.title}
            </h3>
            <p
              style={{
                fontSize: 14,
                color: '#717171',
                margin: 0,
                marginBottom: 8,
              }}
            >
              {currentListing.minutesToHospital} min to {currentListing.hospitalName}
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {currentListing.rating && (
                <span style={{ fontSize: 14, color: '#222222', fontWeight: 600 }}>
                  ⭐ {currentListing.rating.toFixed(2)}
                </span>
              )}
              <span style={{ fontSize: 14, color: '#717171' }}>•</span>
              <span style={{ fontSize: 14, color: '#222222', fontWeight: 600 }}>
                {formatPrice(currentListing.pricePerMonth)}/mo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pass/Like Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: 90,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          padding: '0 24px',
          zIndex: 100,
          pointerEvents: 'none',
        }}
      >
        {/* Pass Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handlePass()
          }}
          style={{
            flex: 1,
            maxWidth: 160,
            padding: '14px 24px',
            borderRadius: 12,
            border: '2px solid #222222',
            background: '#ffffff',
            color: '#222222',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f7f7f7'
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          Pass
        </button>

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleLike()
          }}
          style={{
            flex: 1,
            maxWidth: 160,
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(to right, #FF385C, #E31C5F)',
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255,56,92,0.4)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,56,92,0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,56,92,0.4)'
          }}
        >
          Like <span style={{ fontSize: 18 }}>💕</span>
        </button>
      </div>

      {/* Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  )
}

// Bottom Navigation Component
function BottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tab: 'explore' | 'favorites' | 'messages' | 'profile') => void
}) {
  const tabs = [
    { id: 'explore' as const, icon: '🔥', label: 'Explore' },
    { id: 'favorites' as const, icon: '❤️', label: 'Favorites' },
    { id: 'messages' as const, icon: '💬', label: 'Messages' },
    { id: 'profile' as const, icon: '👤', label: 'Profile' },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 24px 16px',
        background: '#ffffff',
        borderTop: '1px solid #ebebeb',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
        zIndex: 200,
        pointerEvents: 'none',
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={(e) => {
            e.stopPropagation()
            console.log('Tab clicked:', tab.id)
            onTabChange(tab.id)
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '4px 12px',
            color: activeTab === tab.id ? '#FF385C' : '#717171',
            transition: 'color 0.2s',
            pointerEvents: 'auto',
          }}
        >
          <span style={{ fontSize: 24 }}>{tab.icon}</span>
          <span style={{ fontSize: 11, fontWeight: activeTab === tab.id ? 600 : 500 }}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
