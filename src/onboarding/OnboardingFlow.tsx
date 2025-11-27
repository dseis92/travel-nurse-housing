import React, { useEffect, useMemo, useState } from 'react'
import { NeumoCard, PillButton } from '../neumo/NeumoKit'

const STORAGE_KEY = 'nightshift_onboarding'

type RoomTypePref = 'studio' | 'shared' | 'entire' | undefined

type OnboardingPrefs = {
  name?: string
  assignmentLocation?: string
  startDate?: string
  endDate?: string
  roomType?: RoomTypePref
  budget?: number
  maxDistance?: number
  amenities?: string[]
  shiftType?: 'days' | 'nights' | 'rotating'
  noisePreference?: 'quiet' | 'flexible'
}

type StepId = 'welcome' | 'assignment' | 'housing' | 'lifestyle' | 'review'

const STEPS: StepId[] = ['welcome', 'assignment', 'housing', 'lifestyle', 'review']

const loadPrefs = (): OnboardingPrefs | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as OnboardingPrefs
  } catch {
    return null
  }
}

const savePrefs = (prefs: OnboardingPrefs) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export const OnboardingFlow: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0)

  const [name, setName] = useState('')
  const [assignmentLocation, setAssignmentLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [roomType, setRoomType] = useState<RoomTypePref>(undefined)
  const [budget, setBudget] = useState<number | ''>('')
  const [maxDistance, setMaxDistance] = useState<number | ''>('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [shiftType, setShiftType] = useState<'days' | 'nights' | 'rotating' | undefined>(
    undefined,
  )
  const [noisePreference, setNoisePreference] = useState<'quiet' | 'flexible' | undefined>(
    undefined,
  )

  const [attemptedNext, setAttemptedNext] = useState(false)

  useEffect(() => {
    const existing = loadPrefs()
    if (!existing) return

    if (existing.name) setName(existing.name)
    if (existing.assignmentLocation) setAssignmentLocation(existing.assignmentLocation)
    if (existing.startDate) setStartDate(existing.startDate)
    if (existing.endDate) setEndDate(existing.endDate)
    if (existing.roomType) setRoomType(existing.roomType)
    if (typeof existing.budget === 'number') setBudget(existing.budget)
    if (typeof existing.maxDistance === 'number') setMaxDistance(existing.maxDistance)
    if (existing.amenities) setAmenities(existing.amenities)
    if (existing.shiftType) setShiftType(existing.shiftType)
    if (existing.noisePreference) setNoisePreference(existing.noisePreference)
  }, [])

  const currentStep: StepId = useMemo(() => STEPS[stepIndex], [stepIndex])

  const isLastStep = stepIndex === STEPS.length - 1
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100

  const toggleAmenity = (value: string) => {
    setAmenities((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value],
    )
  }

  const validateStep = (step: StepId): boolean => {
    switch (step) {
      case 'welcome':
        return name.trim().length > 0
      case 'assignment':
        return (
          assignmentLocation.trim().length > 0 &&
          startDate.trim().length > 0 &&
          endDate.trim().length > 0
        )
      case 'housing':
        return roomType !== undefined && budget !== '' && maxDistance !== ''
      case 'lifestyle':
        return !!shiftType && !!noisePreference
      case 'review':
        return true
      default:
        return true
    }
  }

  const handleNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setAttemptedNext(true)
    if (!validateStep(currentStep)) return

    if (isLastStep) {
      const payload: OnboardingPrefs = {
        name: name.trim(),
        assignmentLocation: assignmentLocation.trim(),
        startDate,
        endDate,
        roomType,
        budget: budget === '' ? undefined : Number(budget),
        maxDistance: maxDistance === '' ? undefined : Number(maxDistance),
        amenities,
        shiftType,
        noisePreference,
      }
      savePrefs(payload)
      return
    }

    setAttemptedNext(false)
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setAttemptedNext(false)
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  const renderStep = () => {
    const showError = attemptedNext && !validateStep(currentStep)

    switch (currentStep) {
      case 'welcome':
        return (
          <>
            <h2 className="nm-heading-lg" style={{ fontSize: 20, marginBottom: 6 }}>
              Hi! What should we call you?
            </h2>
            <p className="nm-body" style={{ fontSize: 12, marginBottom: 12 }}>
              We&apos;ll use your name to personalize recommendations and messages.
            </p>
            <div className="nm-field-group">
              <label className="nm-label">Name or nickname</label>
              <input
                className="nm-input"
                placeholder="e.g. Jess, Travel Nurse Kayla"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {showError && (
              <p className="nm-error-text">Please tell us what to call you.</p>
            )}
          </>
        )

      case 'assignment':
        return (
          <>
            <h2 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 6 }}>
              Where&apos;s your next assignment?
            </h2>
            <p className="nm-body" style={{ fontSize: 12, marginBottom: 12 }}>
              We&apos;ll match housing around your hospital and contract dates.
            </p>
            <div className="nm-field-group">
              <label className="nm-label">Hospital or city</label>
              <input
                className="nm-input"
                placeholder="e.g. Swedish Medical Center, Denver"
                value={assignmentLocation}
                onChange={(e) => setAssignmentLocation(e.target.value)}
              />
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 8,
              }}
            >
              <div className="nm-field-group" style={{ flex: 1 }}>
                <label className="nm-label">Contract start</label>
                <input
                  type="date"
                  className="nm-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="nm-field-group" style={{ flex: 1 }}>
                <label className="nm-label">Contract end</label>
                <input
                  type="date"
                  className="nm-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            {showError && (
              <p className="nm-error-text">
                Add your hospital and contract dates to continue.
              </p>
            )}
          </>
        )

      case 'housing':
        return (
          <>
            <h2 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 6 }}>
              What kind of place feels right?
            </h2>
            <p className="nm-body" style={{ fontSize: 12, marginBottom: 12 }}>
              Choose your ideal setup and budget for this contract.
            </p>
            <div style={{ marginBottom: 10 }}>
              <p className="nm-label" style={{ marginBottom: 6 }}>
                Room type
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <PillButton
                  label="Private studio"
                  active={roomType === 'studio'}
                  onClick={() => setRoomType('studio')}
                />
                <PillButton
                  label="Shared nurse house"
                  active={roomType === 'shared'}
                  onClick={() => setRoomType('shared')}
                />
                <PillButton
                  label="Entire place"
                  active={roomType === 'entire'}
                  onClick={() => setRoomType('entire')}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 4,
              }}
            >
              <div className="nm-field-group" style={{ flex: 1 }}>
                <label className="nm-label">Max monthly budget</label>
                <input
                  className="nm-input"
                  inputMode="numeric"
                  placeholder="e.g. 2200"
                  value={budget === '' ? '' : String(budget)}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, '')
                    setBudget(v ? Number(v) : '')
                  }}
                />
              </div>
              <div className="nm-field-group" style={{ flex: 1 }}>
                <label className="nm-label">Max minutes to hospital</label>
                <input
                  className="nm-input"
                  inputMode="numeric"
                  placeholder="e.g. 20"
                  value={maxDistance === '' ? '' : String(maxDistance)}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, '')
                    setMaxDistance(v ? Number(v) : '')
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <p className="nm-label" style={{ marginBottom: 6 }}>
                Must-have amenities
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  'Blackout curtains',
                  'Quiet hours for night shift',
                  'Desk / workstation',
                  'In-unit laundry',
                  'Fast Wi-Fi',
                  'Secure parking',
                  'Nurses-only household',
                  'Flexible lease (13-week friendly)',
                ].map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={
                      'nm-pill ' + (amenities.includes(a) ? 'nm-pill--active' : '')
                    }
                    style={{ fontSize: 11 }}
                    onClick={() => toggleAmenity(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            {showError && (
              <p className="nm-error-text">
                Pick a room type, budget, and max commute time to continue.
              </p>
            )}
          </>
        )

      case 'lifestyle':
        return (
          <>
            <h2 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 6 }}>
              Help us match your schedule
            </h2>
            <p className="nm-body" style={{ fontSize: 12, marginBottom: 12 }}>
              We&apos;ll prioritize homes that fit your sleep and work rhythm.
            </p>

            <div style={{ marginBottom: 10 }}>
              <p className="nm-label" style={{ marginBottom: 6 }}>
                What&apos;s your typical shift?
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <PillButton
                  label="Day shift ☀️"
                  active={shiftType === 'days'}
                  onClick={() => setShiftType('days')}
                />
                <PillButton
                  label="Night shift 🌙"
                  active={shiftType === 'nights'}
                  onClick={() => setShiftType('nights')}
                />
                <PillButton
                  label="Rotating 🔄"
                  active={shiftType === 'rotating'}
                  onClick={() => setShiftType('rotating')}
                />
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <p className="nm-label" style={{ marginBottom: 6 }}>
                Noise preference
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <PillButton
                  label="Quiet please"
                  active={noisePreference === 'quiet'}
                  onClick={() => setNoisePreference('quiet')}
                />
                <PillButton
                  label="I&apos;m flexible"
                  active={noisePreference === 'flexible'}
                  onClick={() => setNoisePreference('flexible')}
                />
              </div>
            </div>

            {showError && (
              <p className="nm-error-text">
                Choose your shift type and noise preference to continue.
              </p>
            )}
          </>
        )

      case 'review':
      default:
        return (
          <>
            <h2 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 6 }}>
              All set. Does this look right?
            </h2>
            <p className="nm-body" style={{ fontSize: 12, marginBottom: 12 }}>
              We&apos;ll use these preferences to power your housing matches.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 12,
              }}
            >
              <div>
                <strong>Name:</strong> {name || '—'}
              </div>
              <div>
                <strong>Assignment:</strong> {assignmentLocation || '—'}
              </div>
              <div>
                <strong>Dates:</strong>{' '}
                {startDate && endDate ? `${startDate} → ${endDate}` : '—'}
              </div>
              <div>
                <strong>Room:</strong>{' '}
                {roomType === 'studio'
                  ? 'Private studio'
                  : roomType === 'shared'
                  ? 'Shared nurse house'
                  : roomType === 'entire'
                  ? 'Entire place'
                  : '—'}
              </div>
              <div>
                <strong>Budget:</strong>{' '}
                {budget === '' ? '—' : `$${Number(budget).toLocaleString()} / month`}
              </div>
              <div>
                <strong>Max commute:</strong>{' '}
                {maxDistance === ''
                  ? '—'
                  : `${Number(maxDistance)} min to hospital`}
              </div>
              <div>
                <strong>Amenities:</strong>{' '}
                {amenities.length ? amenities.join(', ') : '—'}
              </div>
              <div>
                <strong>Shift:</strong>{' '}
                {shiftType === 'days'
                  ? 'Day shift'
                  : shiftType === 'nights'
                  ? 'Night shift'
                  : shiftType === 'rotating'
                  ? 'Rotating'
                  : '—'}
              </div>
              <div>
                <strong>Noise:</strong>{' '}
                {noisePreference === 'quiet'
                  ? 'Quiet please'
                  : noisePreference === 'flexible'
                  ? 'Flexible'
                  : '—'}
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleNext()
      }}
    >
      <NeumoCard>
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.6)',
              overflow: 'hidden',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                borderRadius: 999,
                background:
                  'linear-gradient(135deg, #ff66c4, #8f63ff, #32e4c2)',
                transition: 'width 200ms ease-out',
              }}
            />
          </div>
          <p className="nm-body" style={{ fontSize: 11 }}>
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {renderStep()}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 12,
              gap: 8,
            }}
          >
            <button
              type="button"
              className="nm-pill"
              style={{
                fontSize: 12,
                visibility: stepIndex === 0 ? 'hidden' : 'visible',
              }}
              onClick={handleBack}
            >
              ← Back
            </button>
            <button
              type="submit"
              className="nm-pill nm-pill--active"
              style={{ fontSize: 13, minWidth: 120 }}
            >
              {isLastStep ? 'Save & finish' : 'Next'}
            </button>
          </div>
        </div>
      </NeumoCard>
    </form>
  )
}
