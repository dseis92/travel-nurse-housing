import React, { useState } from 'react'
import type { FormEvent } from 'react'

const STORAGE_KEY = 'nightshift_onboarding'
const TOTAL_STEPS = 5

type RoomTypeChoice = 'studio' | 'shared' | 'entire'
type ShiftType = 'day' | 'night' | 'rotating'

type OnboardingFlowProps = {
  onComplete?: () => void
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
}) => {
  const [step, setStep] = useState(0)

  // Core fields that App.tsx cares about
  const [nurseName, setNurseName] = useState('')
  const [assignmentLocation, setAssignmentLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [roomType, setRoomType] = useState<RoomTypeChoice | null>(null)
  const [budget, setBudget] = useState<string>('2200')
  const [maxDistance, setMaxDistance] = useState<string>('20')

  // Extra fun / nurse-specific details
  const [pets, setPets] = useState<boolean | null>(null)
  const [amenities, setAmenities] = useState<string[]>([])
  const [shiftType, setShiftType] = useState<ShiftType | null>(null)
  const [noiseLevel, setNoiseLevel] = useState<'quiet' | 'medium' | 'okay'>(
    'medium',
  )
  const [extraNotes, setExtraNotes] = useState('')

  const toggleAmenity = (value: string) => {
    setAmenities((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value],
    )
  }

  const canGoNext = (s: number): boolean => {
    switch (s) {
      case 0:
        return nurseName.trim().length > 0
      case 1:
        return (
          assignmentLocation.trim().length > 0 &&
          !!startDate &&
          !!endDate
        )
      case 2:
        return !!roomType && !!budget
      case 3:
        return !!shiftType && noiseLevel !== undefined && maxDistance !== ''
      case 4:
        // wrap-up can be skipped, but still "complete"
        return true
      default:
        return false
    }
  }

  const handleNext = (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!canGoNext(step)) return
    if (step < TOTAL_STEPS - 1) {
      setStep((prev) => prev + 1)
    } else {
      handleFinish()
    }
  }

  const handleBack = () => {
    if (step === 0) return
    setStep((prev) => prev - 1)
  }

  const handleFinish = () => {
    // Persist preferences so App.tsx can read them
    if (typeof window !== 'undefined') {
      const payload = {
        name: nurseName.trim(),
        assignmentLocation: assignmentLocation.trim(),
        startDate,
        endDate,
        roomType: roomType ?? undefined,
        budget: budget ? Number(budget) : undefined,
        maxDistance: maxDistance ? Number(maxDistance) : undefined,
        pets,
        amenities,
        shiftType,
        noiseLevel,
        extraNotes: extraNotes.trim() || undefined,
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    }

    // Tell parent "I'm done" so it can close overlay / refresh profile
    if (onComplete) {
      onComplete()
    }
  }

  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100

  const renderStepTitle = () => {
    switch (step) {
      case 0:
        return 'Welcome!'
      case 1:
        return 'Your next assignment'
      case 2:
        return 'Housing vibe'
      case 3:
        return 'Lifestyle & commute'
      case 4:
        return 'Final touches'
      default:
        return ''
    }
  }

  const renderStepSubtitle = () => {
    switch (step) {
      case 0:
        return 'Let’s make this feel like your app.'
      case 1:
        return 'We’ll anchor everything to your contract.'
      case 2:
        return 'Tell us what “home” feels like between shifts.'
      case 3:
        return 'Match your schedule and comfort level.'
      case 4:
        return 'Anything else we should know?'
      default:
        return ''
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="nm-onboarding-step nm-onboarding-step--hero" key={0}>
            <div className="nm-onboarding-hero-graphic nm-float-slow">
              <div className="nm-onboarding-badge">✨ NightShift Housing</div>
              <div className="nm-onboarding-hero-nurse">
                <span className="nm-onboarding-hero-emoji">👩‍⚕️</span>
                <span className="nm-onboarding-hero-emoji">🧳</span>
                <span className="nm-onboarding-hero-emoji">🏙️</span>
              </div>
            </div>
            <div className="nm-onboarding-fields">
              <label className="nm-label">
                What should we call you?
                <input
                  className="nm-input"
                  placeholder="e.g. Jess, RN"
                  value={nurseName}
                  onChange={(e) => setNurseName(e.target.value)}
                />
              </label>
              <p className="nm-onboarding-help">
                We’ll use this to personalize your matches and messages.
              </p>
            </div>
          </div>
        )
      case 1:
        return (
          <div className="nm-onboarding-step" key={1}>
            <div className="nm-onboarding-row nm-onboarding-row--split">
              <div className="nm-onboarding-chip-stack">
                <div className="nm-onboarding-chip nm-onboarding-chip--map nm-float">
                  📍
                </div>
                <div className="nm-onboarding-chip nm-onboarding-chip--calendar nm-float-delay">
                  📅
                </div>
              </div>
              <div className="nm-onboarding-fields">
                <label className="nm-label">
                  Where’s your next assignment?
                  <input
                    className="nm-input"
                    placeholder="Hospital or city (e.g. Swedish Medical, Denver)"
                    value={assignmentLocation}
                    onChange={(e) => setAssignmentLocation(e.target.value)}
                  />
                </label>
                <div className="nm-onboarding-row">
                  <label className="nm-label nm-onboarding-flex-1">
                    Start date
                    <input
                      type="date"
                      className="nm-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </label>
                  <label className="nm-label nm-onboarding-flex-1">
                    End date
                    <input
                      type="date"
                      className="nm-input"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </label>
                </div>
                <p className="nm-onboarding-help">
                  We’ll prioritize places that fit your contract window.
                </p>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="nm-onboarding-step" key={2}>
            <div className="nm-onboarding-fields">
              <div className="nm-onboarding-row nm-onboarding-row--space">
                <div className="nm-onboarding-chip nm-onboarding-chip--room nm-float">
                  🛏️
                </div>
                <div className="nm-onboarding-chip nm-onboarding-chip--coin nm-float-delay">
                  💸
                </div>
              </div>

              <div className="nm-onboarding-section-label">Room type</div>
              <div className="nm-onboarding-pill-row">
                <button
                  type="button"
                  className={
                    'nm-pill nm-pill--choice ' +
                    (roomType === 'studio' ? 'nm-pill--choice-active' : '')
                  }
                  onClick={() => setRoomType('studio')}
                >
                  Cozy studio
                </button>
                <button
                  type="button"
                  className={
                    'nm-pill nm-pill--choice ' +
                    (roomType === 'shared' ? 'nm-pill--choice-active' : '')
                  }
                  onClick={() => setRoomType('shared')}
                >
                  Shared nurse house
                </button>
                <button
                  type="button"
                  className={
                    'nm-pill nm-pill--choice ' +
                    (roomType === 'entire' ? 'nm-pill--choice-active' : '')
                  }
                  onClick={() => setRoomType('entire')}
                >
                  Entire place
                </button>
              </div>

              <label className="nm-label" style={{ marginTop: 10 }}>
                Target monthly budget
                <div className="nm-onboarding-row">
                  <input
                    className="nm-input"
                    inputMode="numeric"
                    value={budget}
                    onChange={(e) =>
                      setBudget(e.target.value.replace(/[^\d]/g, ''))
                    }
                    placeholder="e.g. 2200"
                  />
                  <span className="nm-onboarding-inline-tag">USD / month</span>
                </div>
              </label>

              <div className="nm-onboarding-section-label" style={{ marginTop: 12 }}>
                Pets?
              </div>
              <div className="nm-onboarding-pill-row">
                <button
                  type="button"
                  className={
                    'nm-pill nm-pill--choice ' +
                    (pets === true ? 'nm-pill--choice-active' : '')
                  }
                  onClick={() => setPets(true)}
                >
                  🐾 Yes, traveling with pets
                </button>
                <button
                  type="button"
                  className={
                    'nm-pill nm-pill--choice ' +
                    (pets === false ? 'nm-pill--choice-active' : '')
                  }
                  onClick={() => setPets(false)}
                >
                  🚫 No pets
                </button>
              </div>

              <div className="nm-onboarding-section-label" style={{ marginTop: 12 }}>
                Must-have amenities
              </div>
              <div className="nm-onboarding-pill-row nm-onboarding-pill-row--wrap">
                {[
                  'Fast Wi-Fi',
                  'In-unit laundry',
                  'Dedicated desk',
                  'Blackout curtains',
                  'Parking included',
                  'Nurses only building',
                  'Quiet hours',
                  'Short commute',
                ].map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    className={
                      'nm-pill nm-pill--choice nm-pill--small ' +
                      (amenities.includes(amenity)
                        ? 'nm-pill--choice-active'
                        : '')
                    }
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="nm-onboarding-step" key={3}>
            <div className="nm-onboarding-fields">
              <div className="nm-onboarding-section-label">Shift type</div>
              <div className="nm-onboarding-pill-row">
                <button
                  type="button"
                  className={
                    'nm-pill nm-pill--choice ' +
                    (shiftType === 'day' ? 'nm-pill--choice-active' : '')
                  }
                  onClick={() => setShiftType('day')}
                >
                  ☀️ Day shift
                </button>
                <button
                  type="button"
                  className={
                    'nm-pill nm-pill--choice ' +
                    (shiftType === 'night' ? 'nm-pill--choice-active' : '')
                  }
                  onClick={() => setShiftType('night')}
                >
                  🌙 Night shift
                </button>
                <button
                  type="button"
                  className={
                    'nm-pill nm-pill--choice ' +
                    (shiftType === 'rotating' ? 'nm-pill--choice-active' : '')
                  }
                  onClick={() => setShiftType('rotating')}
                >
                  🔄 Rotating
                </button>
              </div>

              <div className="nm-onboarding-section-label" style={{ marginTop: 12 }}>
                Noise level at home
              </div>
              <div className="nm-onboarding-pill-row">
                <button
                  type="button"
                  className={
                    'nm-pill nm-pill--choice ' +
                    (noiseLevel === 'quiet' ? 'nm-pill--choice-active' : '')
                  }
                  onClick={() => setNoiseLevel('quiet')}
                >
                  🔕 Very quiet, please
                </button>
                <button
                  type="button"
                  className={
                    'nm-pill nm-pill--choice ' +
                    (noiseLevel === 'medium' ? 'nm-pill--choice-active' : '')
                  }
                  onClick={() => setNoiseLevel('medium')}
                >
                  🔉 Some noise is okay
                </button>
                <button
                  type="button"
                  className={
                    'nm-pill nm-pill--choice ' +
                    (noiseLevel === 'okay' ? 'nm-pill--choice-active' : '')
                  }
                  onClick={() => setNoiseLevel('okay')}
                >
                  🎧 I can sleep anywhere
                </button>
              </div>

              <label className="nm-label" style={{ marginTop: 12 }}>
                Max distance to hospital (minutes)
                <div className="nm-onboarding-row">
                  <input
                    className="nm-input"
                    inputMode="numeric"
                    value={maxDistance}
                    onChange={(e) =>
                      setMaxDistance(e.target.value.replace(/[^\d]/g, ''))
                    }
                    placeholder="e.g. 20"
                  />
                  <span className="nm-onboarding-inline-tag">drive time</span>
                </div>
              </label>

              <p className="nm-onboarding-help">
                We’ll try to keep options within your comfort zone for commute
                and rest.
              </p>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="nm-onboarding-step" key={4}>
            <div className="nm-onboarding-fields">
              <div className="nm-onboarding-chip nm-onboarding-chip--shield nm-float">
                🛡️
              </div>
              <p className="nm-body" style={{ fontSize: 12, marginTop: 8 }}>
                We verify hosts and highlight safety-forward listings. Add
                anything else we should know to match you better.
              </p>
              <label className="nm-label" style={{ marginTop: 10 }}>
                Anything else you want to share?
                <textarea
                  className="nm-input nm-input--textarea"
                  rows={4}
                  placeholder="Allergies, accessibility needs, roommate preferences, parking requirements…"
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                />
              </label>
              <p className="nm-onboarding-help">
                You can always update this later in your profile.
              </p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="nm-onboarding-root">
      <form
        className="nm-onboarding-inner"
        onSubmit={(e) => {
          e.preventDefault()
          handleNext()
        }}
      >
        {/* Progress bar + step labels */}
        <div className="nm-onboarding-top">
          <div className="nm-onboarding-progress-bar">
            <div
              className="nm-onboarding-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="nm-onboarding-step-labels">
            <span className="nm-onboarding-step-title">
              {renderStepTitle()}
            </span>
            <span className="nm-onboarding-step-sub">
              {renderStepSubtitle()}
            </span>
          </div>
        </div>

        {/* Main animated slide */}
        <div key={step} className="nm-onboarding-slide">
          {renderStep()}
        </div>

        {/* Footer controls */}
        <div className="nm-onboarding-footer">
          <div className="nm-onboarding-dots">
            {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
              <span
                key={idx}
                className={
                  'nm-onboarding-dot ' +
                  (idx === step ? 'nm-onboarding-dot--active' : '')
                }
              />
            ))}
          </div>
          <div className="nm-onboarding-footer-actions">
            <button
              type="button"
              className="nm-pill"
              disabled={step === 0}
              onClick={handleBack}
            >
              Back
            </button>
            <button
              type="submit"
              className={
                'nm-pill nm-pill--active nm-onboarding-next ' +
                (!canGoNext(step) ? 'nm-onboarding-next--disabled' : '')
              }
              disabled={!canGoNext(step)}
            >
              {step === TOTAL_STEPS - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
