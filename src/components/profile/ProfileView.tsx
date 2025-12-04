import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { VerificationBadge } from '../verification/VerificationBadge'
import { profileService } from '../../services/profileService'
import { useAuthStore } from '../../stores/authStore'
import type { UserProfile } from '../../types'
import toast from 'react-hot-toast'

interface ProfileViewProps {
  userId?: string // If not provided, shows current user's profile
  onEdit?: () => void // Callback when edit button clicked (only for own profile)
}

export function ProfileView({ userId, onEdit }: ProfileViewProps) {
  const { profile: currentUserProfile } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const isOwnProfile = !userId || userId === currentUserProfile?.id

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      setLoading(true)

      if (isOwnProfile) {
        const data = await profileService.getMyProfile()
        setProfile(data)
      } else {
        const data = await profileService.getPublicProfile(userId!)
        setProfile(data)
      }
    } catch (error: any) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
        <NeumoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', padding: 32 }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid #14B8A6',
                borderTopColor: 'transparent',
                borderRadius: 999,
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
              Loading profile...
            </p>
          </div>
        </NeumoCard>
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

  if (!profile) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
        <NeumoCard>
          <div style={{ padding: 32, textAlign: 'center' }}>
            <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
              Profile not found
            </p>
          </div>
        </NeumoCard>
      </div>
    )
  }

  const isNurse = profile.role === 'nurse'
  const isVerified = isNurse
    ? profile.licenseStatus === 'verified'
    : profile.hostVerificationStatus === 'verified'

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <NeumoCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header with Edit Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 className="nm-heading-lg" style={{ fontSize: 18 }}>
              {isOwnProfile ? 'Your Profile' : `${profile.name}'s Profile`}
            </h2>
            {isOwnProfile && onEdit && (
              <button
                className="nm-pill nm-pill--active"
                style={{ fontSize: 11 }}
                onClick={onEdit}
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Avatar and Basic Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            {/* Avatar */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 999,
                overflow: 'hidden',
                background: profile.avatarUrl
                  ? `url(${profile.avatarUrl})`
                  : 'linear-gradient(135deg, #14B8A6, #FB923C)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(148,163,184,0.3)',
              }}
            >
              {!profile.avatarUrl && (
                <span style={{ fontSize: 48 }}>
                  👤
                </span>
              )}
            </div>

            {/* Name and Verification */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <h3 className="nm-heading-lg" style={{ fontSize: 20 }}>
                {profile.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span
                  className="nm-pill nm-pill--active"
                  style={{ fontSize: 11 }}
                >
                  {isNurse ? '🩺 Nurse' : '🏠 Host'}
                </span>
                {isVerified && (
                  <VerificationBadge
                    isVerified={true}
                    role={profile.role}
                    size="small"
                    showLabel={true}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h4 className="nm-heading-lg" style={{ fontSize: 13, marginBottom: 8 }}>
                About
              </h4>
              <p className="nm-body" style={{ fontSize: 12, lineHeight: 1.6, color: '#4b5563' }}>
                {profile.bio}
              </p>
            </div>
          )}

          {/* Nurse-specific fields */}
          {isNurse && (
            <>
              {/* Specialties */}
              {profile.specialties && profile.specialties.length > 0 && (
                <div>
                  <h4 className="nm-heading-lg" style={{ fontSize: 13, marginBottom: 8 }}>
                    Specialties
                  </h4>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {profile.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="nm-pill nm-pill--active"
                        style={{ fontSize: 11 }}
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Cities */}
              {profile.preferredCities && profile.preferredCities.length > 0 && (
                <div>
                  <h4 className="nm-heading-lg" style={{ fontSize: 13, marginBottom: 8 }}>
                    Preferred Cities
                  </h4>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {profile.preferredCities.map((city) => (
                      <span
                        key={city}
                        className="nm-pill"
                        style={{ fontSize: 11 }}
                      >
                        📍 {city}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Contact Information */}
          <div
            style={{
              padding: 12,
              borderRadius: 16,
              background: 'rgba(148,163,184,0.05)',
              border: '1px solid rgba(148,163,184,0.15)',
            }}
          >
            <h4 className="nm-heading-lg" style={{ fontSize: 13, marginBottom: 12 }}>
              Contact Information
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Email - always shown for own profile, conditional for others */}
              {(isOwnProfile || profile.email) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>📧</span>
                  <span className="nm-body" style={{ fontSize: 12, color: '#4b5563' }}>
                    {profile.email || 'No email provided'}
                  </span>
                  {!isOwnProfile && !profile.email && (
                    <span className="nm-body" style={{ fontSize: 10, color: '#9ca3af' }}>
                      (hidden)
                    </span>
                  )}
                </div>
              )}

              {/* Phone - always shown for own profile, conditional for others */}
              {(isOwnProfile || profile.phone) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>📱</span>
                  <span className="nm-body" style={{ fontSize: 12, color: '#4b5563' }}>
                    {profile.phone || 'No phone provided'}
                  </span>
                  {!isOwnProfile && !profile.phone && (
                    <span className="nm-body" style={{ fontSize: 10, color: '#9ca3af' }}>
                      (hidden)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(20,184,166,0.05), rgba(251,146,60,0.05))',
              border: '1px solid rgba(148,163,184,0.15)',
            }}
          >
            <h4 className="nm-heading-lg" style={{ fontSize: 13, marginBottom: 12 }}>
              Activity
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
              {/* Member Since */}
              <div style={{ textAlign: 'center' }}>
                <p className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 4 }}>
                  {new Date(profile.createdAt || Date.now()).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
                <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                  Member since
                </p>
              </div>

              {/* Last Active */}
              {profile.lastActiveAt && (
                <div style={{ textAlign: 'center' }}>
                  <p className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 4 }}>
                    {new Date(profile.lastActiveAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                    Last active
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </NeumoCard>
    </div>
  )
}
