import type { Hospital } from '../types'

interface HospitalCardProps {
  hospital: Hospital
  onViewHousing: (hospital: Hospital) => void
  onViewDetails: (hospital: Hospital) => void
}

export function HospitalCard({
  hospital,
  onViewHousing,
  onViewDetails,
}: HospitalCardProps) {
  return (
    <div
      style={{
        borderRadius: 26,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f4f3ff, #ffffff)',
        boxShadow:
          '0 16px 32px rgba(45,35,80,0.2), -6px -6px 16px rgba(255,255,255,0.95)',
      }}
    >
      {/* Image header */}
      {hospital.imageUrl && (
        <div
          style={{
            height: 160,
            backgroundImage: `url(${hospital.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          {/* Badges */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {hospital.traumaLevel && (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(239, 68, 68, 0.95)',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                Level {hospital.traumaLevel} Trauma
              </span>
            )}
            {hospital.isTeachingHospital && (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(59, 130, 246, 0.95)',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                Teaching Hospital
              </span>
            )}
          </div>

          {/* Rating */}
          {hospital.rating && (
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              <span>⭐</span>
              <span>{hospital.rating.toFixed(1)}</span>
              {hospital.reviewCount && (
                <span style={{ color: '#6b7280', fontWeight: 400 }}>
                  ({hospital.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 14 }}>
        <h3
          className="nm-heading-lg"
          style={{ fontSize: 15, marginBottom: 4 }}
        >
          {hospital.name}
        </h3>

        <div
          style={{
            fontSize: 11,
            color: '#6b7280',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>📍</span>
          <span>
            {hospital.city}, {hospital.state}
          </span>
          {hospital.bedCount && (
            <>
              <span style={{ margin: '0 4px' }}>•</span>
              <span>{hospital.bedCount} beds</span>
            </>
          )}
        </div>

        {/* Facility type */}
        <div style={{ marginBottom: 10 }}>
          <span className="nm-tag">{hospital.facilityType}</span>
        </div>

        {/* Specialties */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 10,
              color: '#6b7280',
              marginBottom: 6,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            Specialties
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {hospital.specialties.slice(0, 4).map((specialty) => (
              <span key={specialty} className="nm-tag">
                {specialty}
              </span>
            ))}
            {hospital.specialties.length > 4 && (
              <span className="nm-tag" style={{ opacity: 0.7 }}>
                +{hospital.specialties.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 10,
            borderTop: '1px solid rgba(148,163,184,0.15)',
            marginBottom: 12,
          }}
        >
          {hospital.openPositions !== undefined && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: '#6b7280',
                  marginBottom: 2,
                }}
              >
                Open Positions
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: hospital.openPositions > 0 ? '#10b981' : '#6b7280',
                }}
              >
                {hospital.openPositions}
              </div>
            </div>
          )}

          {hospital.averagePayRate && (
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 10,
                  color: '#6b7280',
                  marginBottom: 2,
                }}
              >
                Avg Weekly Pay
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#14b8a6',
                }}
              >
                ${hospital.averagePayRate.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => onViewHousing(hospital)}
            className="nm-pill nm-pill--active"
            style={{
              flex: 1,
              fontSize: 11,
            }}
          >
            🏠 View Housing Nearby
          </button>
          <button
            type="button"
            onClick={() => onViewDetails(hospital)}
            className="nm-pill"
            style={{
              fontSize: 11,
            }}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  )
}
