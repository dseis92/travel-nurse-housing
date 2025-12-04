import { useState, useEffect, useCallback } from 'react'

interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

interface MapBoundaryFilterProps {
  mapRef: React.RefObject<any>
  onBoundsChange?: (bounds: MapBounds) => void
  enabled?: boolean
}

export function MapBoundaryFilter({
  mapRef,
  onBoundsChange,
  enabled = true,
}: MapBoundaryFilterProps) {
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const updateBounds = useCallback(() => {
    if (!mapRef.current || !enabled) return

    const map = mapRef.current.getMap()
    const mapBounds = map.getBounds()

    const newBounds: MapBounds = {
      north: mapBounds.getNorth(),
      south: mapBounds.getSouth(),
      east: mapBounds.getEast(),
      west: mapBounds.getWest(),
    }

    setBounds(newBounds)
    setIsSearching(true)

    // Debounce the callback
    const timer = setTimeout(() => {
      setIsSearching(false)
      onBoundsChange?.(newBounds)
    }, 500)

    return () => clearTimeout(timer)
  }, [mapRef, enabled, onBoundsChange])

  useEffect(() => {
    if (!mapRef.current || !enabled) return

    const map = mapRef.current.getMap()

    // Update bounds on map move
    map.on('moveend', updateBounds)
    map.on('zoomend', updateBounds)

    // Initial bounds
    updateBounds()

    return () => {
      map.off('moveend', updateBounds)
      map.off('zoomend', updateBounds)
    }
  }, [mapRef, enabled, updateBounds])

  const handleSearchThisArea = () => {
    if (bounds) {
      onBoundsChange?.(bounds)
    }
  }

  if (!enabled || !bounds) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {/* Search This Area Button */}
      <button
        className="nm-pill nm-pill--active"
        style={{
          fontSize: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
        onClick={handleSearchThisArea}
        disabled={isSearching}
      >
        {isSearching ? (
          <>
            <div
              style={{
                width: 12,
                height: 12,
                border: '2px solid white',
                borderTopColor: 'transparent',
                borderRadius: 999,
                animation: 'spin 0.6s linear infinite',
              }}
            />
            Searching...
          </>
        ) : (
          <>
            🔍 Search this area
          </>
        )}
      </button>


      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}
