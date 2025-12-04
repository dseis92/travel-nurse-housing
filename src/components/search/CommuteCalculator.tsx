import { useState } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'

interface CommuteResult {
  distance: number // in miles
  duration: number // in minutes
  route: string
}

interface CommuteCalculatorProps {
  listingCoords?: { lat: number; lng: number }
  listingAddress?: string
  hospitalCoords?: { lat: number; lng: number }
  hospitalName?: string
}

export function CommuteCalculator({
  listingCoords,
  listingAddress,
  hospitalCoords,
  hospitalName,
}: CommuteCalculatorProps) {
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<CommuteResult | null>(null)
  const [mode, setMode] = useState<'driving' | 'transit' | 'walking'>('driving')

  const calculateCommute = async () => {
    if (!listingCoords || !hospitalCoords) {
      return
    }

    setCalculating(true)

    try {
      // In a real implementation, you would call a routing API like Mapbox Directions API
      // For now, using a simple distance calculation and estimate
      const distance = calculateDistance(
        listingCoords.lat,
        listingCoords.lng,
        hospitalCoords.lat,
        hospitalCoords.lng
      )

      // Rough estimates based on mode
      let duration: number
      switch (mode) {
        case 'driving':
          duration = Math.round(distance * 2.5) // ~24 mph average
          break
        case 'transit':
          duration = Math.round(distance * 4) // ~15 mph average
          break
        case 'walking':
          duration = Math.round(distance * 20) // ~3 mph average
          break
      }

      setResult({
        distance,
        duration,
        route: 'via main roads', // Placeholder
      })
    } catch (error) {
      console.error('Error calculating commute:', error)
    } finally {
      setCalculating(false)
    }
  }

  // Haversine formula for distance calculation
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959 // Earth's radius in miles
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return Math.round(distance * 10) / 10 // Round to 1 decimal
  }

  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180)
  }

  const getModeIcon = (transportMode: string) => {
    switch (transportMode) {
      case 'driving':
        return '🚗'
      case 'transit':
        return '🚇'
      case 'walking':
        return '🚶'
      default:
        return '🚗'
    }
  }

  const getModeLabel = (transportMode: string) => {
    switch (transportMode) {
      case 'driving':
        return 'Driving'
      case 'transit':
        return 'Transit'
      case 'walking':
        return 'Walking'
      default:
        return 'Driving'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (!listingCoords || !hospitalCoords) {
    return (
      <NeumoCard>
        <div style={{ padding: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 24, marginBottom: 8 }}>🗺️</p>
          <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
            Location data not available
          </p>
        </div>
      </NeumoCard>
    )
  }

  return (
    <NeumoCard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header */}
        <div>
          <h4 className="nm-heading-lg" style={{ fontSize: 13, marginBottom: 4 }}>
            Commute Calculator
          </h4>
          <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
            {listingAddress && hospitalName
              ? `${listingAddress} → ${hospitalName}`
              : 'Calculate travel time'}
          </p>
        </div>

        {/* Mode Selector */}
        <div>
          <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>
            Travel Mode
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['driving', 'transit', 'walking'] as const).map((transportMode) => (
              <button
                key={transportMode}
                className={`nm-pill ${mode === transportMode ? 'nm-pill--active' : ''}`}
                style={{ fontSize: 11, flex: 1 }}
                onClick={() => setMode(transportMode)}
              >
                {getModeIcon(transportMode)} {getModeLabel(transportMode)}
              </button>
            ))}
          </div>
        </div>

        {/* Calculate Button */}
        <button
          className="nm-pill nm-pill--active"
          style={{ fontSize: 12 }}
          onClick={calculateCommute}
          disabled={calculating}
        >
          {calculating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
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
              Calculating...
            </div>
          ) : (
            'Calculate Commute'
          )}
        </button>

        {/* Results */}
        {result && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(20,184,166,0.1), rgba(251,146,60,0.1))',
              border: '1px solid rgba(148,163,184,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 8 }}>
              {/* Duration */}
              <div style={{ textAlign: 'center' }}>
                <p className="nm-body" style={{ fontSize: 9, color: '#6b7280', marginBottom: 3 }}>
                  Travel Time
                </p>
                <p className="nm-heading-lg" style={{ fontSize: 18 }}>
                  {formatDuration(result.duration)}
                </p>
              </div>

              {/* Distance */}
              <div style={{ textAlign: 'center' }}>
                <p className="nm-body" style={{ fontSize: 9, color: '#6b7280', marginBottom: 3 }}>
                  Distance
                </p>
                <p className="nm-heading-lg" style={{ fontSize: 18 }}>
                  {result.distance} mi
                </p>
              </div>
            </div>

            {/* Route Info */}
            <div
              style={{
                paddingTop: 8,
                borderTop: '1px solid rgba(148,163,184,0.2)',
              }}
            >
              <p className="nm-body" style={{ fontSize: 9, color: '#6b7280' }}>
                {getModeIcon(mode)} {getModeLabel(mode)} {result.route}
              </p>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="nm-body" style={{ fontSize: 9, color: '#9ca3af', fontStyle: 'italic' }}>
          * Estimates based on typical traffic conditions
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
