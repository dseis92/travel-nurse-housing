import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Listing } from '../types'

// You'll need to add your Mapbox token to .env as VITE_MAPBOX_TOKEN
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

interface MapProps {
  listings: Listing[]
  onListingClick?: (listing: Listing) => void
  center?: [number, number]
  zoom?: number
}

export default function Map({
  listings,
  onListingClick,
  center = [-98.5795, 39.8283], // Center of USA
  zoom = 4,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox token not found. Please add VITE_MAPBOX_TOKEN to your .env file')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom,
    })

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [center, zoom])

  // Update markers when listings change
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add markers for each listing
    listings.forEach((listing) => {
      const lat = listing.latitude || listing.coordinates?.lat
      const lng = listing.longitude || listing.coordinates?.lng
      if (!lat || !lng) return

      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'map-marker'
      el.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #14B8A6, #FB923C);
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-size: 14px;
            font-weight: bold;
          ">$${Math.round(listing.pricePerMonth / 100)}</span>
        </div>
      `

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.15)'
      })

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)'
      })

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        maxWidth: '240px',
      }).setHTML(`
        <div style="padding: 8px;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #1f2937;">
            ${listing.title}
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 6px;">
            ${listing.city}, ${listing.state} • ${listing.minutesToHospital} min to hospital
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #14B8A6;">
            $${listing.pricePerMonth.toLocaleString()}/mo
          </div>
        </div>
      `)

      // Create marker
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!)

      // Handle click
      el.addEventListener('click', () => {
        if (onListingClick) {
          onListingClick(listing)
        }
      })

      markersRef.current.push(marker)
    })

    // Fit bounds to show all markers if there are listings
    if (listings.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()

      listings.forEach((listing) => {
        const lat = listing.latitude || listing.coordinates?.lat
        const lng = listing.longitude || listing.coordinates?.lng
        if (lat && lng) {
          bounds.extend([lng, lat])
        }
      })

      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12,
      })
    }
  }, [listings, mapLoaded, onListingClick])

  if (!MAPBOX_TOKEN) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f3f4f6',
          color: '#6b7280',
          fontSize: '13px',
          textAlign: 'center',
          padding: '20px',
        }}
      >
        <div>
          <div style={{ marginBottom: '8px', fontWeight: 600 }}>Map unavailable</div>
          <div style={{ fontSize: '11px' }}>
            Add VITE_MAPBOX_TOKEN to .env to enable real maps
          </div>
        </div>
      </div>
    )
  }

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}
