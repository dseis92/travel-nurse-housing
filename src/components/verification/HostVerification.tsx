import { useAuthStore } from '../../stores/authStore'
import { DocumentUpload } from './DocumentUpload'
import type { VerificationStatus } from '../../types'
import { NeumoCard } from '../../neumo/NeumoKit'

export function HostVerification() {
  const { profile } = useAuthStore()

  if (!profile || profile.role !== 'host') {
    return null
  }

  const status: VerificationStatus =
    profile.hostVerificationStatus || 'unverified'

  const getStatusDisplay = () => {
    switch (status) {
      case 'verified':
        return {
          color: '#10b981',
          icon: '✓',
          title: 'Verified Host',
          description: 'Your host profile has been verified',
        }
      case 'pending':
        return {
          color: '#f59e0b',
          icon: '⏳',
          title: 'Verification Pending',
          description: 'Your documents are under review (usually 1-2 business days)',
        }
      case 'rejected':
        return {
          color: '#ef4444',
          icon: '✗',
          title: 'Verification Failed',
          description: 'Please upload valid verification documents',
        }
      default:
        return {
          color: '#6b7280',
          icon: '!',
          title: 'Verification Required',
          description: 'Get verified to build trust with travel nurses',
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <NeumoCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status Badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                background: `${statusDisplay.color}22`,
                color: statusDisplay.color,
              }}
            >
              {statusDisplay.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h3 className="nm-heading-lg" style={{ fontSize: 16, marginBottom: 4 }}>
                {statusDisplay.title}
              </h3>
              <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
                {statusDisplay.description}
              </p>
            </div>
          </div>

          {/* Upload Section - only show if not verified or pending */}
          {status !== 'verified' && status !== 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 16,
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}
              >
                <h4
                  className="nm-heading-lg"
                  style={{ fontSize: 13, marginBottom: 8, color: '#1e40af' }}
                >
                  Why verify as a host?
                </h4>
                <ul
                  className="nm-body"
                  style={{
                    fontSize: 11,
                    color: '#1e40af',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    paddingLeft: 16,
                  }}
                >
                  <li>Get a "Verified Host" badge on all your listings</li>
                  <li>Nurses are 5x more likely to book with verified hosts</li>
                  <li>Higher search ranking and visibility</li>
                  <li>Build trust and credibility</li>
                  <li>Faster booking approvals</li>
                </ul>
              </div>

              <div>
                <label
                  className="nm-body"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Upload Government-Issued ID
                </label>
                <DocumentUpload documentType="government_id" />
              </div>

              <div>
                <label
                  className="nm-body"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Upload Proof of Property Ownership (Optional)
                </label>
                <p
                  className="nm-body"
                  style={{ fontSize: 10, color: '#6b7280', marginBottom: 8 }}
                >
                  Property deed, mortgage statement, or lease agreement
                </p>
                <DocumentUpload documentType="property_deed" />
              </div>

              <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                Accepted formats: PNG, JPG, PDF (max 10MB). Your documents will be
                reviewed within 1-2 business days. We protect your information and
                only use it for verification purposes.
              </p>
            </div>
          )}

          {/* Verified Badge Display */}
          {status === 'verified' && (
            <div
              style={{
                padding: 16,
                borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(20,184,166,0.1))',
                border: '2px solid rgba(16,185,129,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, #10B981, #14B8A6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 18px rgba(16,185,129,0.35)',
                  }}
                >
                  <svg
                    style={{ width: 36, height: 36, color: 'white' }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h4
                    className="nm-heading-lg"
                    style={{ fontSize: 18, marginBottom: 4 }}
                  >
                    You're verified!
                  </h4>
                  <p className="nm-body" style={{ fontSize: 12, color: '#059669' }}>
                    Travel nurses can see your verified badge on all your listings
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Status Display */}
          {status === 'pending' && (
            <div
              style={{
                padding: 12,
                borderRadius: 16,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <p className="nm-body" style={{ fontSize: 11, color: '#d97706' }}>
                We'll notify you via email once your verification is complete. This
                usually takes 1-2 business days.
              </p>
            </div>
          )}
        </div>
      </NeumoCard>
    </div>
  )
}
