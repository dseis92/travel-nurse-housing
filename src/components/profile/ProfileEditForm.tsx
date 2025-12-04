import { useState } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { AvatarUpload } from './AvatarUpload'
import { profileService, type UpdateProfileInput } from '../../services/profileService'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

interface ProfileEditFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProfileEditForm({ onSuccess, onCancel }: ProfileEditFormProps) {
  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(false)

  // Form state
  const [name, setName] = useState(profile?.name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [specialties, setSpecialties] = useState<string[]>(profile?.specialties || [])
  const [preferredCities, setPreferredCities] = useState<string[]>(profile?.preferredCities || [])

  // Privacy settings
  const [showEmail, setShowEmail] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [allowMessages, setAllowMessages] = useState(true)

  // New specialty/city input
  const [newSpecialty, setNewSpecialty] = useState('')
  const [newCity, setNewCity] = useState('')

  const isNurse = profile?.role === 'nurse'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      setLoading(true)

      const updates: UpdateProfileInput = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        showEmail,
        showPhone,
        allowMessages,
      }

      if (isNurse) {
        updates.specialties = specialties
        updates.preferredCities = preferredCities
      }

      await profileService.updateProfile(updates)
      toast.success('Profile updated!')
      onSuccess?.()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const addSpecialty = () => {
    if (!newSpecialty.trim()) return
    if (specialties.includes(newSpecialty.trim())) {
      toast.error('Specialty already added')
      return
    }
    setSpecialties([...specialties, newSpecialty.trim()])
    setNewSpecialty('')
  }

  const removeSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty))
  }

  const addCity = () => {
    if (!newCity.trim()) return
    if (preferredCities.includes(newCity.trim())) {
      toast.error('City already added')
      return
    }
    setPreferredCities([...preferredCities, newCity.trim()])
    setNewCity('')
  }

  const removeCity = (city: string) => {
    setPreferredCities(preferredCities.filter(c => c !== city))
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <NeumoCard>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 className="nm-heading-lg" style={{ fontSize: 18 }}>
              Edit Profile
            </h2>

            {/* Avatar */}
            <AvatarUpload currentAvatarUrl={profile?.avatarUrl} />

            {/* Name */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Name*
              </label>
              <input
                type="text"
                className="nm-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Phone
              </label>
              <input
                type="tel"
                className="nm-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                style={{ width: '100%' }}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Bio
              </label>
              <textarea
                className="nm-input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* Nurse-specific fields */}
            {isNurse && (
              <>
                {/* Specialties */}
                <div>
                  <label className="nm-body" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    Specialties
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {specialties.map((specialty) => (
                      <div
                        key={specialty}
                        className="nm-pill nm-pill--active"
                        style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {specialty}
                        <button
                          type="button"
                          onClick={() => removeSpecialty(specialty)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'inherit',
                            cursor: 'pointer',
                            fontSize: 14,
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="nm-input"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                      placeholder="Add specialty"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="nm-pill"
                      style={{ fontSize: 11 }}
                      onClick={addSpecialty}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Preferred Cities */}
                <div>
                  <label className="nm-body" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    Preferred Cities
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {preferredCities.map((city) => (
                      <div
                        key={city}
                        className="nm-pill nm-pill--active"
                        style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {city}
                        <button
                          type="button"
                          onClick={() => removeCity(city)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'inherit',
                            cursor: 'pointer',
                            fontSize: 14,
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="nm-input"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCity())}
                      placeholder="Add city"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="nm-pill"
                      style={{ fontSize: 11 }}
                      onClick={addCity}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Privacy Settings */}
            <div
              style={{
                padding: 12,
                borderRadius: 16,
                background: 'rgba(148,163,184,0.05)',
                border: '1px solid rgba(148,163,184,0.15)',
              }}
            >
              <h3 className="nm-heading-lg" style={{ fontSize: 13, marginBottom: 12 }}>
                Privacy Settings
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showEmail}
                    onChange={(e) => setShowEmail(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span className="nm-body" style={{ fontSize: 12 }}>
                    Show email on public profile
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showPhone}
                    onChange={(e) => setShowPhone(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span className="nm-body" style={{ fontSize: 12 }}>
                    Show phone on public profile
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={allowMessages}
                    onChange={(e) => setAllowMessages(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span className="nm-body" style={{ fontSize: 12 }}>
                    Allow others to message me
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
              {onCancel && (
                <button
                  type="button"
                  className="nm-pill"
                  style={{ flex: 1, fontSize: 12 }}
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="nm-pill nm-pill--active"
                style={{ flex: 2, fontSize: 12 }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </NeumoCard>
    </div>
  )
}
