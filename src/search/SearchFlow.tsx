import React, { useState } from 'react'

export type SearchFlowResult = {
  location: string
  startDate?: string
  endDate?: string
  pets: string[]
}

type Step = 'where' | 'when' | 'who'

type Props = {
  initialLocation?: string
  initialStartDate?: string
  initialEndDate?: string
  onClose: () => void
  onComplete: (result: SearchFlowResult) => void
}

const SUGGESTED_DESTINATIONS = [
  {
    city: 'Milwaukee',
    state: 'WI',
    subtitle: 'For sights like Miller Park',
  },
  {
    city: 'Wisconsin Dells',
    state: 'WI',
    subtitle: 'Popular destination',
  },
  {
    city: 'Nashville',
    state: 'TN',
    subtitle: 'For its bustling nightlife',
  },
  {
    city: 'Minneapolis',
    state: 'MN',
    subtitle: 'For sights like Mall of America',
  },
  {
    city: 'Orlando',
    state: 'FL',
    subtitle: 'For sights like Walt Disney World',
  },
]

const PET_OPTIONS = [
  { id: 'none', label: 'No pets', emoji: '🚫' },
  { id: 'dog', label: 'Dog', emoji: '🐶' },
  { id: 'cat', label: 'Cat', emoji: '🐱' },
  { id: 'other', label: 'Other', emoji: '🦎' },
]

export const SearchFlow: React.FC<Props> = ({
  initialLocation,
  initialStartDate,
  initialEndDate,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<Step>('where')
  const [location, setLocation] = useState(initialLocation ?? '')
  const [startDate, setStartDate] = useState(initialStartDate ?? '')
  const [endDate, setEndDate] = useState(initialEndDate ?? '')
  const [selectedPets, setSelectedPets] = useState<string[]>([])

  const togglePet = (id: string) => {
    setSelectedPets((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  const handleNextFromWhere = () => {
    if (!location.trim()) return
    setStep('when')
  }

  const handleNextFromWhen = () => {
    if (!startDate || !endDate) return
    setStep('who')
  }

  const handleFinish = () => {
    if (step !== 'who') return
    onComplete({
      location: location.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      pets: selectedPets,
    })
  }

  return (
    <div className="ns-flow-overlay">
      <div className="ns-flow-card ns-flow-pop">
        <div className="ns-flow-top">
          <div className="ns-flow-top-left">
            <span className="ns-flow-app-title">NightShift Housing</span>
            <span className="ns-flow-step-label">
              {step === 'where' && 'Step 1 · Where'}
              {step === 'when' && 'Step 2 · When'}
              {step === 'who' && 'Step 3 · Who'}
            </span>
          </div>
          <button
            type="button"
            className="ns-flow-close"
            onClick={onClose}
            aria-label="Close search"
          >
            ✕
          </button>
        </div>

        <div className="ns-flow-body">
          {step === 'where' && (
            <>
              <h1 className="ns-flow-title">Where?</h1>
              <p className="ns-flow-sub">
                Search by hospital, city, or ZIP. We’ll find nurse-friendly
                housing nearby.
              </p>

              <div className="ns-flow-search-pill">
                <span className="ns-flow-search-icon">🔍</span>
                <input
                  autoFocus
                  className="ns-flow-search-input"
                  placeholder="Search destinations"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <p className="ns-flow-section-label">Suggested destinations</p>

              <div className="ns-flow-list">
                {SUGGESTED_DESTINATIONS.map((d) => {
                  const full = `${d.city}, ${d.state}`
                  return (
                    <button
                      key={full}
                      type="button"
                      className="ns-flow-list-row ns-flow-row-pop"
                      onClick={() => setLocation(full)}
                    >
                      <div className="ns-flow-list-icon">🏙️</div>
                      <div className="ns-flow-list-text">
                        <div className="ns-flow-list-title">{full}</div>
                        <div className="ns-flow-list-sub">{d.subtitle}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 'when' && (
            <>
              <h1 className="ns-flow-title">When?</h1>
              <p className="ns-flow-sub">
                Match your dates to your contract. You can tweak them later.
              </p>

              <div className="ns-flow-dates-grid">
                <div className="ns-flow-field-block">
                  <label className="ns-flow-field-label">Check-in</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="ns-flow-date-input"
                  />
                </div>
                <div className="ns-flow-field-block">
                  <label className="ns-flow-field-label">Check-out</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="ns-flow-date-input"
                  />
                </div>
              </div>

              <p className="ns-flow-hint">
                Pro tip: Use your 13-week contract and add a buffer on each
                side.
              </p>
            </>
          )}

          {step === 'who' && (
            <>
              <h1 className="ns-flow-title">Who&apos;s coming?</h1>
              <p className="ns-flow-sub">
                We&apos;ll keep it simple – just tell us about pets so we can
                surface pet-friendly stays.
              </p>

              <div className="ns-flow-pets-grid">
                {PET_OPTIONS.map((p) => {
                  const active = selectedPets.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePet(p.id)}
                      className={
                        'ns-flow-pet-pill ns-flow-pet-float ' +
                        (active ? 'ns-flow-pet-pill--active' : '')
                      }
                    >
                      <span className="ns-flow-pet-emoji">{p.emoji}</span>
                      <span className="ns-flow-pet-label">{p.label}</span>
                    </button>
                  )
                })}
              </div>

              <p className="ns-flow-hint">
                You can always update this later from your filters.
              </p>
            </>
          )}
        </div>

        <div className="ns-flow-footer">
          <button
            type="button"
            className="ns-flow-link"
            onClick={() => {
              setLocation('')
              setStartDate('')
              setEndDate('')
              setSelectedPets([])
              setStep('where')
            }}
          >
            Clear all
          </button>

          <div className="ns-flow-footer-actions">
            {step !== 'where' && (
              <button
                type="button"
                className="ns-flow-secondary"
                onClick={() => {
                  if (step === 'when') setStep('where')
                  if (step === 'who') setStep('when')
                }}
              >
                Back
              </button>
            )}

            {step === 'where' && (
              <button
                type="button"
                className={
                  'ns-flow-primary ' +
                  (!location.trim() ? 'ns-flow-primary--disabled' : '')
                }
                disabled={!location.trim()}
                onClick={handleNextFromWhere}
              >
                Next
              </button>
            )}

            {step === 'when' && (
              <button
                type="button"
                className={
                  'ns-flow-primary ' +
                  (!startDate || !endDate ? 'ns-flow-primary--disabled' : '')
                }
                disabled={!startDate || !endDate}
                onClick={handleNextFromWhen}
              >
                Next
              </button>
            )}

            {step === 'who' && (
              <button
                type="button"
                className="ns-flow-primary"
                onClick={handleFinish}
              >
                Search
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
