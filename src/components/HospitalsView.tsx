import { useState, useMemo } from 'react'
import type { Hospital } from '../types'
import { HospitalCard } from './HospitalCard'
import { NeumoCard } from '../neumo/NeumoKit'
import Map from './Map'

interface HospitalsViewProps {
  hospitals: Hospital[]
  onSelectHospital: (hospital: Hospital) => void
  onViewHousingForHospital: (hospital: Hospital) => void
}

export function HospitalsView({
  hospitals,
  onSelectHospital,
  onViewHousingForHospital,
}: HospitalsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewLayout, setViewLayout] = useState<'list' | 'map'>('list')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all')
  const [selectedState, setSelectedState] = useState<string>('all')

  // Get unique specialties and states
  const { specialties, states } = useMemo(() => {
    const specialtySet = new Set<string>()
    const stateSet = new Set<string>()

    hospitals.forEach((h) => {
      h.specialties.forEach((s) => specialtySet.add(s))
      stateSet.add(h.state)
    })

    return {
      specialties: Array.from(specialtySet).sort(),
      states: Array.from(stateSet).sort(),
    }
  }, [hospitals])

  // Filter hospitals
  const filteredHospitals = useMemo(() => {
    return hospitals.filter((hospital) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          hospital.name.toLowerCase().includes(query) ||
          hospital.city.toLowerCase().includes(query) ||
          hospital.state.toLowerCase().includes(query) ||
          hospital.specialties.some((s) => s.toLowerCase().includes(query))

        if (!matchesSearch) return false
      }

      // Specialty filter
      if (
        selectedSpecialty !== 'all' &&
        !hospital.specialties.includes(selectedSpecialty)
      ) {
        return false
      }

      // State filter
      if (selectedState !== 'all' && hospital.state !== selectedState) {
        return false
      }

      return true
    })
  }, [hospitals, searchQuery, selectedSpecialty, selectedState])

  // Sort by rating
  const sortedHospitals = useMemo(() => {
    return [...filteredHospitals].sort((a, b) => {
      if (!a.rating && !b.rating) return 0
      if (!a.rating) return 1
      if (!b.rating) return -1
      return b.rating - a.rating
    })
  }, [filteredHospitals])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search and filters */}
      <NeumoCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Search bar */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hospitals, cities, specialties..."
            className="nm-input"
            style={{
              width: '100%',
              fontSize: 12,
            }}
          />

          {/* Filter pills */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {/* State filter */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="nm-pill"
              style={{
                fontSize: 11,
                appearance: 'none',
                paddingRight: 24,
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%234b5563\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
              }}
            >
              <option value="all">All States</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            {/* Specialty filter */}
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="nm-pill"
              style={{
                fontSize: 11,
                appearance: 'none',
                paddingRight: 24,
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%234b5563\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
              }}
            >
              <option value="all">All Specialties</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>
        </div>
      </NeumoCard>

      {/* Results header with view toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
          {sortedHospitals.length === 0
            ? 'No hospitals found'
            : sortedHospitals.length === 1
            ? '1 hospital'
            : `${sortedHospitals.length} hospitals`}
        </p>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={
              'nm-pill ' + (viewLayout === 'list' ? 'nm-pill--active' : '')
            }
            style={{
              fontSize: 11,
              paddingInline: 12,
              paddingBlock: 6,
            }}
            onClick={() => setViewLayout('list')}
          >
            List
          </button>
          <button
            type="button"
            className={
              'nm-pill ' + (viewLayout === 'map' ? 'nm-pill--active' : '')
            }
            style={{
              fontSize: 11,
              paddingInline: 12,
              paddingBlock: 6,
            }}
            onClick={() => setViewLayout('map')}
          >
            Map
          </button>
        </div>
      </div>

      {/* Results */}
      {viewLayout === 'list' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {sortedHospitals.map((hospital) => (
            <HospitalCard
              key={hospital.id}
              hospital={hospital}
              onViewHousing={onViewHousingForHospital}
              onViewDetails={onSelectHospital}
            />
          ))}
        </div>
      ) : (
        <NeumoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                height: 400,
                boxShadow:
                  '0 18px 40px rgba(15,23,42,0.45), -4px -4px 12px rgba(255,255,255,0.9)',
              }}
            >
              <Map
                listings={sortedHospitals.map((h) => ({
                  id: h.id,
                  title: h.name,
                  city: h.city,
                  state: h.state,
                  hospitalName: h.name,
                  hospitalCity: h.city,
                  hospitalState: h.state,
                  minutesToHospital: 0,
                  pricePerMonth: h.averagePayRate || 0,
                  roomType: 'entire-place' as const,
                  imageUrl: h.imageUrl || '',
                  tags: h.specialties.slice(0, 3),
                  perks: [],
                  section: h.state,
                  latitude: h.latitude,
                  longitude: h.longitude,
                }))}
                onListingClick={(listing) => {
                  const hospital = sortedHospitals.find(
                    (h) => h.id === listing.id
                  )
                  if (hospital) onSelectHospital(hospital)
                }}
              />
            </div>

            {/* Hospital list below map */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                paddingBottom: 4,
              }}
            >
              {sortedHospitals.map((hospital) => (
                <button
                  key={hospital.id}
                  type="button"
                  onClick={() => onSelectHospital(hospital)}
                  style={{
                    minWidth: 200,
                    borderRadius: 20,
                    border: 'none',
                    padding: 12,
                    background: 'linear-gradient(135deg, #f4f3ff, #ffffff)',
                    boxShadow:
                      '0 10px 20px rgba(45,35,80,0.15), -4px -4px 10px rgba(255,255,255,0.9)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'transform 150ms ease, box-shadow 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow =
                      '0 14px 28px rgba(45,35,80,0.2), -5px -5px 12px rgba(255,255,255,0.95)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow =
                      '0 10px 20px rgba(45,35,80,0.15), -4px -4px 10px rgba(255,255,255,0.9)'
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {hospital.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>
                    {hospital.city}, {hospital.state}
                  </div>
                  {hospital.rating && (
                    <div
                      style={{
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>⭐</span>
                      <span style={{ fontWeight: 600 }}>
                        {hospital.rating.toFixed(1)}
                      </span>
                      {hospital.openPositions !== undefined && (
                        <>
                          <span style={{ color: '#6b7280' }}>•</span>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>
                            {hospital.openPositions} open
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </NeumoCard>
      )}
    </div>
  )
}
