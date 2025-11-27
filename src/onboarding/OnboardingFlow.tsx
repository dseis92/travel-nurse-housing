import React, { useEffect, useMemo, useState } from 'react'
import { NeumoCard } from '../neumo/NeumoKit'

const STORAGE_KEY = 'nightshift_onboarding'

type Draft = {
  name: string
  assignmentLocation: string
  startDate: string
  endDate: string
  roomType: 'studio' | 'shared' | 'entire'
  budget: number | ''
  maxDistance: number | ''
  shiftType: 'day' | 'night' | 'rotating'
  noiseLevel: 'quiet' | 'flexible'
  pets: 'yes' | 'no'
  safetyNotes: string
}

const emptyDraft: Draft = {
  name: '',
  assignmentLocation: '',
  startDate: '',
  endDate: '',
  roomType: 'studio',
  budget: '',
  maxDistance: 15,
  shiftType: 'night',
  noiseLevel: 'quiet',
  pets: 'no',
  safetyNotes: '',
}

const steps = [
  'Welcome',
  'Assignment',
  'Housing',
  'Lifestyle & safety',
] as const

type StepIndex = 0 | 1 | 2 | 3

export const OnboardingFlow: React.FC = () => {
  const [step, setStep] = useState<StepIndex>(0)
  const [touched, setTouched] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Load existing prefs (if any)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setHasLoaded(true)
        return
      }
      const parsed = JSON.parse(raw)
      setDraft((prev) => ({
        ...prev,
        ...parsed,
      }))
    } catch {
      // ignore bad JSON
    } finally {
      setHasLoaded(true)
    }
  }, [])

  const saveDraft = (next: Draft) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore storage failures
    }
  }

  const updateDraft = (patch: Partial<Draft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      saveDraft(next)
      return next
    })
  }

  const totalSteps = steps.length
  const currentTitle = useMemo(() => steps[step], [step])

  const nameDisplay = draft.name.trim() || 'Travel nurse'

  // --------- VALIDATION PER STEP (LAST STEP IS NOW ALWAYS ALLOWED) ----------
  const stepError = useMemo(() => {
    switch (step) {
      case 0:
        if (!draft.name.trim()) return 'Tell us what to call you.'
        return ''
      case 1:
        if (!draft.assignmentLocation.trim())
          return 'Add your hospital or assignment city.'
        if (!draft.startDate || !draft.endDate)
          return 'Add your contract start and end dates.'
        return ''
      case 2:
        if (draft.budget === '' || Number.isNaN(Number(draft.budget)))
          return 'Set a monthly budget that feels right for you.'
        return ''
      case 3:
        // LAST STEP: no hard block, safety notes are helpful but OPTIONAL
        return ''
      default:
        return ''
    }
  }, [step, draft])

  const canNext = stepError === ''

  const goNext = () => {
    setTouched(true)
    if (!canNext) return

    if (step < totalSteps - 1) {
      setStep((s) => (s + 1) as StepIndex)
      setTouched(false)
      return
    }

    // Final step – already saved via updateDraft, just give a tiny visual nudge
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        // little haptic-ish flash using CSS class
        const shell = document.querySelector('.nm-onboard-shell')
        shell?.classList.add('nm-onboard-shell--finished')
        window.setTimeout(
          () => shell?.classList.remove('nm-onboard-shell--finished'),
          600,
        )
      }, 0)
    }
  }

  const goBack = () => {
    setTouched(false)
    if (step === 0) return
    setStep((s) => (s - 1) as StepIndex)
  }

  if (!hasLoaded) {
    return (
      <div className="nm-onboard-shell">
        <NeumoCard className="nm-onboard-step nm-onboard-step--center">
          <div className="nm-onboard-loader" />
          <p className="nm-body" style={{ fontSize: 12, marginTop: 12 }}>
            Getting your profile ready…
          </p>
        </NeumoCard>
      </div>
    )
  }

  return (
    <div className="nm-onboard-shell">
      {/* Progress header */}
      <NeumoCard className="nm-onboard-progress-card">
        <div className="nm-onboard-progress-top">
          <span className="nm-onboard-hello">Hi, {nameDisplay}</span>
          <span className="nm-onboard-step-label">
            Step {step + 1} of {totalSteps}
          </span>
        </div>
        <div className="nm-onboard-progress-bar">
          {steps.map((label, index) => {
            const active = index === step
            const complete = index < step
            return (
              <div
                key={label}
                className={
                  'nm-onboard-progress-dot' +
                  (active ? ' nm-onboard-progress-dot--active' : '') +
                  (complete ? ' nm-onboard-progress-dot--complete' : '')
                }
              >
                <span className="nm-onboard-progress-dot-inner" />
              </div>
            )
          })}
        </div>
        <div className="nm-onboard-progress-names">
          {steps.map((label, index) => (
            <span
              key={label}
              className={
                'nm-onboard-progress-name' +
                (index === step ? ' nm-onboard-progress-name--active' : '')
              }
            >
              {label}
            </span>
          ))}
        </div>
        <div className="nm-onboard-current-label">{currentTitle}</div>
      </NeumoCard>

      {/* STEP 0 */}
      {step === 0 && (
        <NeumoCard className="nm-onboard-step">
          <div className="nm-onboard-floating-emoji">🩺</div>
          <h2 className="nm-heading-lg nm-onboard-title">
            Welcome to NightShift Housing
          </h2>
          <p className="nm-body nm-onboard-copy">
            We&apos;ll use a few quick questions to match you with nurse-only
            housing that actually fits your contract.
          </p>

          <label className="nm-label" style={{ marginTop: 16 }}>
            What should we call you?
          </label>
          <input
            className="nm-input nm-onboard-input"
            placeholder="e.g. Sam, Jess, or 'Traveling ER RN'"
            value={draft.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
          />

          <ul className="nm-onboard-bullets">
            <li>We never show your full name to hosts until you book.</li>
            <li>You can change this anytime from your profile.</li>
          </ul>

          {touched && stepError && (
            <p className="nm-onboard-error">{stepError}</p>
          )}

          <div className="nm-onboard-actions">
            <button
              type="button"
              className="nm-pill nm-onboard-btn-secondary"
              onClick={goBack}
              disabled={step === 0}
            >
              Back
            </button>
            <button
              type="button"
              className={
                'nm-pill nm-pill--active nm-onboard-btn-primary' +
                (!canNext ? ' nm-onboard-btn-primary--disabled' : '')
              }
              onClick={goNext}
            >
              Next
            </button>
          </div>
        </NeumoCard>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <NeumoCard className="nm-onboard-step">
          <div className="nm-onboard-floating-emoji">📍</div>
          <h2 className="nm-heading-lg nm-onboard-title">
            Where&apos;s your next assignment?
          </h2>
          <p className="nm-body nm-onboard-copy">
            We&apos;ll prioritize housing close to your hospital and contract
            dates.
          </p>

          <label className="nm-label" style={{ marginTop: 12 }}>
            Hospital or city
          </label>
          <input
            className="nm-input nm-onboard-input"
            placeholder="e.g. Swedish Medical Center, Denver"
            value={draft.assignmentLocation}
            onChange={(e) =>
              updateDraft({ assignmentLocation: e.target.value })
            }
          />

          <div className="nm-onboard-row">
            <div className="nm-field-group" style={{ flex: 1 }}>
              <label className="nm-label">Contract start</label>
              <input
                type="date"
                className="nm-input nm-onboard-input"
                value={draft.startDate}
                onChange={(e) => updateDraft({ startDate: e.target.value })}
              />
            </div>
            <div className="nm-field-group" style={{ flex: 1 }}>
              <label className="nm-label">Contract end</label>
              <input
                type="date"
                className="nm-input nm-onboard-input"
                value={draft.endDate}
                onChange={(e) => updateDraft({ endDate: e.target.value })}
              />
            </div>
          </div>

          {touched && stepError && (
            <p className="nm-onboard-error">{stepError}</p>
          )}

          <div className="nm-onboard-actions">
            <button
              type="button"
              className="nm-pill nm-onboard-btn-secondary"
              onClick={goBack}
            >
              Back
            </button>
            <button
              type="button"
              className={
                'nm-pill nm-pill--active nm-onboard-btn-primary' +
                (!canNext ? ' nm-onboard-btn-primary--disabled' : '')
              }
              onClick={goNext}
            >
              Next
            </button>
          </div>
        </NeumoCard>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <NeumoCard className="nm-onboard-step">
          <div className="nm-onboard-floating-emoji">🏡</div>
          <h2 className="nm-heading-lg nm-onboard-title">
            What kind of place feels right?
          </h2>
          <p className="nm-body nm-onboard-copy">
            Pick the housing style and budget that match your contract.
          </p>

          <label className="nm-label" style={{ marginTop: 8 }}>
            Room type
          </label>
          <div className="nm-onboard-chip-row">
            <button
              type="button"
              className={
                'nm-onboard-chip' +
                (draft.roomType === 'studio' ? ' nm-onboard-chip--active' : '')
              }
              onClick={() => updateDraft({ roomType: 'studio' })}
            >
              🛏 Private studio
            </button>
            <button
              type="button"
              className={
                'nm-onboard-chip' +
                (draft.roomType === 'shared' ? ' nm-onboard-chip--active' : '')
              }
              onClick={() => updateDraft({ roomType: 'shared' })}
            >
              👯 Shared housing
            </button>
            <button
              type="button"
              className={
                'nm-onboard-chip' +
                (draft.roomType === 'entire' ? ' nm-onboard-chip--active' : '')
              }
              onClick={() => updateDraft({ roomType: 'entire' })}
            >
              🏠 Entire place
            </button>
          </div>

          <label className="nm-label" style={{ marginTop: 12 }}>
            Max monthly budget
          </label>
          <div className="nm-onboard-row nm-onboard-row--align">
            <input
              className="nm-input nm-onboard-input"
              inputMode="numeric"
              value={draft.budget === '' ? '' : String(draft.budget)}
              placeholder="e.g. 2200"
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, '')
                updateDraft({ budget: v ? Number(v) : '' })
              }}
            />
            <span className="nm-onboard-input-addon">USD / month</span>
          </div>

          <label className="nm-label" style={{ marginTop: 12 }}>
            Max distance from hospital
          </label>
          <div className="nm-onboard-row nm-onboard-row--align">
            <input
              className="nm-input nm-onboard-input"
              inputMode="numeric"
              value={draft.maxDistance === '' ? '' : String(draft.maxDistance)}
              placeholder="e.g. 15"
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, '')
                updateDraft({ maxDistance: v ? Number(v) : '' })
              }}
            />
            <span className="nm-onboard-input-addon">min drive</span>
          </div>

          {touched && stepError && (
            <p className="nm-onboard-error">{stepError}</p>
          )}

          <div className="nm-onboard-actions">
            <button
              type="button"
              className="nm-pill nm-onboard-btn-secondary"
              onClick={goBack}
            >
              Back
            </button>
            <button
              type="button"
              className={
                'nm-pill nm-pill--active nm-onboard-btn-primary' +
                (!canNext ? ' nm-onboard-btn-primary--disabled' : '')
              }
              onClick={goNext}
            >
              Next
            </button>
          </div>
        </NeumoCard>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <NeumoCard className="nm-onboard-step">
          <div className="nm-onboard-floating-emoji">🌙</div>
          <h2 className="nm-heading-lg nm-onboard-title">
            How do you work and rest?
          </h2>
          <p className="nm-body nm-onboard-copy">
            Hosts use this to keep things nurse-friendly: quiet days for
            night-shifters, no surprise parties on post-call.
          </p>

          <label className="nm-label" style={{ marginTop: 8 }}>
            Typical shift
          </label>
          <div className="nm-onboard-chip-row">
            <button
              type="button"
              className={
                'nm-onboard-chip' +
                (draft.shiftType === 'day' ? ' nm-onboard-chip--active' : '')
              }
              onClick={() => updateDraft({ shiftType: 'day' })}
            >
              ☀️ Day shift
            </button>
            <button
              type="button"
              className={
                'nm-onboard-chip' +
                (draft.shiftType === 'night' ? ' nm-onboard-chip--active' : '')
              }
              onClick={() => updateDraft({ shiftType: 'night' })}
            >
              🌙 Night shift
            </button>
            <button
              type="button"
              className={
                'nm-onboard-chip' +
                (draft.shiftType === 'rotating'
                  ? ' nm-onboard-chip--active'
                  : '')
              }
              onClick={() => updateDraft({ shiftType: 'rotating' })}
            >
              🔄 Rotating
            </button>
          </div>

          <label className="nm-label" style={{ marginTop: 12 }}>
            Noise & roommates
          </label>
          <div className="nm-onboard-chip-row">
            <button
              type="button"
              className={
                'nm-onboard-chip' +
                (draft.noiseLevel === 'quiet'
                  ? ' nm-onboard-chip--active'
                  : '')
              }
              onClick={() => updateDraft({ noiseLevel: 'quiet' })}
            >
              🤫 Quiet please
            </button>
            <button
              type="button"
              className={
                'nm-onboard-chip' +
                (draft.noiseLevel === 'flexible'
                  ? ' nm-onboard-chip--active'
                  : '')
              }
              onClick={() => updateDraft({ noiseLevel: 'flexible' })}
            >
              🙂 I&apos;m flexible
            </button>
          </div>

          <label className="nm-label" style={{ marginTop: 12 }}>
            Traveling with pets?
          </label>
          <div className="nm-onboard-chip-row">
            <button
              type="button"
              className={
                'nm-onboard-chip' +
                (draft.pets === 'yes' ? ' nm-onboard-chip--active' : '')
              }
              onClick={() => updateDraft({ pets: 'yes' })}
            >
              🐾 Yes, bring on the fur
            </button>
            <button
              type="button"
              className={
                'nm-onboard-chip' +
                (draft.pets === 'no' ? ' nm-onboard-chip--active' : '')
              }
              onClick={() => updateDraft({ pets: 'no' })}
            >
              🙅‍♀️ No pets this contract
            </button>
          </div>

          <label className="nm-label" style={{ marginTop: 12 }}>
            Anything hosts should know? (optional)
          </label>
          <textarea
            className="nm-input nm-onboard-input nm-onboard-notes"
            placeholder="Allergies, safety needs, parking requirements, elevator access, anything that makes your stay safer and smoother."
            value={draft.safetyNotes}
            onChange={(e) => updateDraft({ safetyNotes: e.target.value })}
          />

          {/* no hard error on last step anymore */}

          <div className="nm-onboard-actions">
            <button
              type="button"
              className="nm-pill nm-onboard-btn-secondary"
              onClick={goBack}
            >
              Back
            </button>
            <button
              type="button"
              className="nm-pill nm-pill--active nm-onboard-btn-primary"
              onClick={goNext}
            >
              Finish
            </button>
          </div>
        </NeumoCard>
      )}
    </div>
  )
}
