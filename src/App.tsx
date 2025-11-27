import React, { useEffect, useMemo, useRef, useState } from 'react'
import { OnboardingFlow } from './onboarding/OnboardingFlow'
import { NeumoCard, PillButton } from './neumo/NeumoKit'
import { HostDashboard } from './HostDashboard'

type RoomTypeFilter = 'any' | 'private-room' | 'entire-place' | 'shared'

type Listing = {
  id: number
  title: string
  city: string
  state: string
  hospitalName: string
  hospitalCity: string
  hospitalState: string
  minutesToHospital: number
  pricePerMonth: number
  roomType: 'private-room' | 'entire-place' | 'shared'
  imageUrl: string
  tags: string[]
  perks: string[]
  rating?: number
  reviewCount?: number
}

type OnboardingPrefs = {
  name?: string
  assignmentLocation?: string
  startDate?: string
  endDate?: string
  roomType?: 'studio' | 'shared' | 'entire'
  budget?: number
  maxDistance?: number
}

const STORAGE_KEY = 'nightshift_onboarding'

function loadOnboardingPrefs(): OnboardingPrefs | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as OnboardingPrefs
  } catch {
    return null
  }
}

function mapRoomTypeFromOnboarding(
  rt: OnboardingPrefs['roomType'] | undefined,
): RoomTypeFilter {
  if (rt === 'studio') return 'private-room'
  if (rt === 'shared') return 'shared'
  if (rt === 'entire') return 'entire-place'
  return 'any'
}

const LISTINGS: Listing[] = [
  {
    id: 1,
    title: "Quiet studio 5 min from St. Mary's",
    city: 'Wausau',
    state: 'WI',
    hospitalName: "St. Mary's Medical Center",
    hospitalCity: 'Wausau',
    hospitalState: 'WI',
    minutesToHospital: 5,
    pricePerMonth: 1850,
    roomType: 'entire-place',
    imageUrl:
      'https://images.pexels.com/photos/37347/office-freelancer-computer-business-37347.jpeg',
    tags: ['Pet friendly', 'Washer & dryer', 'Month-to-month'],
    perks: ['Fast Wi-Fi', 'Parking'],
    rating: 4.9,
    reviewCount: 23,
  },
  {
    id: 2,
    title: 'Private room in nurse house',
    city: 'Wausau',
    state: 'WI',
    hospitalName: 'Aspirus Hospital',
    hospitalCity: 'Wausau',
    hospitalState: 'WI',
    minutesToHospital: 7,
    pricePerMonth: 1100,
    roomType: 'private-room',
    imageUrl:
      'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg',
    tags: ['Nurses only', 'All utilities', 'Fast Wi-Fi'],
    perks: ['Weekly cleaning'],
    rating: 4.8,
    reviewCount: 41,
  },
]

type BottomTab = 'home' | 'search' | 'new' | 'saved' | 'profile'

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'nurse' | 'host'>('nurse')
  const [activeCategory, setActiveCategory] = useState<
    'housing' | 'hospitals' | 'nurses'
  >('housing')
  const [activeTab, setActiveTab] = useState<BottomTab>('home')

  const [prefs, setPrefs] = useState<OnboardingPrefs | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const [hospitalOrCity, setHospitalOrCity] = useState('')
  const [maxBudget, setMaxBudget] = useState<number | ''>(2000)
  const [roomType, setRoomType] = useState<RoomTypeFilter>('any')
  const [contractStart, setContractStart] = useState('')
  const [contractEnd, setContractEnd] = useState('')

  const resultsRef = useRef<HTMLDivElement | null>(null)
  const searchHeaderRef = useRef<HTMLDivElement | null>(null)

  // ✅ On first load: if no onboarding prefs, show onboarding automatically
  useEffect(() => {
    const loaded = loadOnboardingPrefs()
    if (!loaded) {
      setViewMode('nurse')
      setActiveCategory('nurses')
      setActiveTab('profile')
      setShowOnboarding(true)
      return
    }

    setPrefs(loaded)

    if (loaded.assignmentLocation) setHospitalOrCity(loaded.assignmentLocation)
    if (typeof loaded.budget === 'number') setMaxBudget(loaded.budget)
    if (loaded.startDate) setContractStart(loaded.startDate)
    if (loaded.endDate) setContractEnd(loaded.endDate)
    setRoomType(mapRoomTypeFromOnboarding(loaded.roomType))
  }, [])

  // if you leave Nurses tab or Nurse view, close onboarding
  useEffect(() => {
    if (activeCategory !== 'nurses') {
      setShowOnboarding(false)
    }
  }, [activeCategory])

  useEffect(() => {
    if (viewMode !== 'nurse') {
      setShowOnboarding(false)
    }
  }, [viewMode])

  const filteredListings = useMemo(() => {
    return LISTINGS.filter((listing) => {
      const matchesLocation =
        !hospitalOrCity.trim() ||
        listing.hospitalName
          .toLowerCase()
          .includes(hospitalOrCity.toLowerCase()) ||
        listing.city.toLowerCase().includes(hospitalOrCity.toLowerCase())

      const matchesBudget =
        maxBudget === '' || listing.pricePerMonth <= maxBudget

      const matchesRoomType =
        roomType === 'any' ? true : listing.roomType === roomType

      return matchesLocation && matchesBudget && matchesRoomType
    })
  }, [hospitalOrCity, maxBudget, roomType])

  const listingCountText =
    filteredListings.length === 0
      ? 'No places found yet — try widening your filters.'
      : filteredListings.length === 1
      ? '1 place that matches your filters'
      : `${filteredListings.length} places that match your filters`

  const handleSearchClick = () => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleScrollToSearchBar = () => {
    if (searchHeaderRef.current) {
      searchHeaderRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  const handleClearClick = () => {
    setHospitalOrCity('')
    setMaxBudget(2000)
    setRoomType('any')
    setContractStart('')
    setContractEnd('')
  }

  const showFilters =
    activeCategory === 'housing' || activeCategory === 'hospitals'

  const closeOnboardingAndRefresh = () => {
    const updated = loadOnboardingPrefs()
    if (updated) setPrefs(updated)
    setShowOnboarding(false)
  }

  return (
    <div className="nm-shell">
      <div className="nm-phone">
        <main className="nm-screen-content nm-fade-in">
          {/* TOP: Nurse / Host pills */}
          <div
            className="nm-explore-toggle"
            style={{
              marginBottom: 6,
              justifyContent: 'center',
            }}
          >
            <div className="nm-explore-toggle-buttons">
              <button
                type="button"
                onClick={() => {
                  setViewMode('nurse')
                  setActiveTab('home')
                }}
                className={
                  'nm-pill ' + (viewMode === 'nurse' ? 'nm-pill--active' : '')
                }
                style={{ fontSize: 11 }}
              >
                Nurse view
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('host')
                  setActiveTab('home')
                }}
                className={
                  'nm-pill ' + (viewMode === 'host' ? 'nm-pill--active' : '')
                }
                style={{ fontSize: 11 }}
              >
                Host dashboard
              </button>
            </div>
          </div>

          {/* HEADER: search pill + category tabs */}
          <NeumoCard className="nm-explore-header">
            <button
              type="button"
              className="nm-search-pill"
              onClick={handleSearchClick}
            >
              <span className="nm-search-icon">🔍</span>
              <div className="nm-search-text">
                <span className="nm-search-title">Start your search</span>
                <span className="nm-search-sub">
                  Where&apos;s your next assignment?
                </span>
              </div>
            </button>

            <div className="nm-category-row">
              <button
                type="button"
                className={
                  'nm-category-item ' +
                  (activeCategory === 'housing'
                    ? 'nm-category-item--active'
                    : '')
                }
                onClick={() => {
                  setActiveCategory('housing')
                  setActiveTab('home')
                }}
              >
                <span className="nm-category-emoji">🏠</span>
                <span className="nm-category-label">Housing</span>
              </button>
              <button
                type="button"
                className={
                  'nm-category-item ' +
                  (activeCategory === 'hospitals'
                    ? 'nm-category-item--active'
                    : '')
                }
                onClick={() => {
                  setActiveCategory('hospitals')
                  setActiveTab('home')
                }}
              >
                <span className="nm-category-emoji">🏥</span>
                <span className="nm-category-label">Hospitals</span>
              </button>
              <button
                type="button"
                className={
                  'nm-category-item ' +
                  (activeCategory === 'nurses'
                    ? 'nm-category-item--active'
                    : '')
                }
                onClick={() => {
                  setActiveCategory('nurses')
                  setActiveTab('profile')
                }}
              >
                <span className="nm-category-emoji">👩‍⚕️</span>
                <span className="nm-category-label">Nurses</span>
              </button>
            </div>
          </NeumoCard>

          {viewMode === 'nurse' ? (
            activeCategory === 'nurses' ? (
              showOnboarding ? (
                <>
                  <NeumoCard>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        className="nm-pill"
                        style={{ fontSize: 12 }}
                        onClick={closeOnboardingAndRefresh}
                      >
                        ← Back to profile
                      </button>
                      <button
                        type="button"
                        className="nm-pill nm-pill--active"
                        style={{ fontSize: 12 }}
                        onClick={closeOnboardingAndRefresh}
                      >
                        Done
                      </button>
                    </div>
                  </NeumoCard>

                  {/* Full onboarding flow */}
                  <OnboardingFlow />
                </>
              ) : (
                <NursesTab
                  prefs={prefs}
                  onEdit={() => setShowOnboarding(true)}
                />
              )
            ) : (
              <>
                {/* FILTERS – only for Housing / Hospitals */}
                {showFilters && (
                  <NeumoCard>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div className="nm-field-group">
                        <label className="nm-label">Hospital or city</label>
                        <input
                          className="nm-input"
                          placeholder="Search by hospital, city, or ZIP"
                          value={hospitalOrCity}
                          onChange={(e) => setHospitalOrCity(e.target.value)}
                        />
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 10,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div className="nm-field-group" style={{ flex: 1 }}>
                          <label className="nm-label">
                            Max monthly budget
                          </label>
                          <input
                            className="nm-input"
                            inputMode="numeric"
                            value={maxBudget === '' ? '' : String(maxBudget)}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^\d]/g, '')
                              setMaxBudget(v ? Number(v) : '')
                            }}
                          />
                        </div>
                        <div className="nm-field-group" style={{ flex: 1 }}>
                          <label className="nm-label">Room type</label>
                          <div
                            style={{
                              display: 'flex',
                              gap: 6,
                              flexWrap: 'wrap',
                            }}
                          >
                            <PillButton
                              label="Any"
                              active={roomType === 'any'}
                              onClick={() => setRoomType('any')}
                            />
                            <PillButton
                              label="Private room"
                              active={roomType === 'private-room'}
                              onClick={() => setRoomType('private-room')}
                            />
                            <PillButton
                              label="Entire place"
                              active={roomType === 'entire-place'}
                              onClick={() => setRoomType('entire-place')}
                            />
                            <PillButton
                              label="Shared room"
                              active={roomType === 'shared'}
                              onClick={() => setRoomType('shared')}
                            />
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 10,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div className="nm-field-group" style={{ flex: 1 }}>
                          <label className="nm-label">Contract start</label>
                          <input
                            type="date"
                            className="nm-input"
                            value={contractStart}
                            onChange={(e) => setContractStart(e.target.value)}
                          />
                        </div>
                        <div className="nm-field-group" style={{ flex: 1 }}>
                          <label className="nm-label">Contract end</label>
                          <input
                            type="date"
                            className="nm-input"
                            value={contractEnd}
                            onChange={(e) => setContractEnd(e.target.value)}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          marginTop: 4,
                        }}
                      >
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="nm-bottom-fab nm-bounce"
                            style={{ width: 52, height: 52, fontSize: 11 }}
                            onClick={handleSearchClick}
                          >
                            🔍
                          </button>
                          <button
                            type="button"
                            className="nm-pill"
                            style={{ fontSize: 12 }}
                            onClick={handleClearClick}
                          >
                            Clear
                          </button>
                        </div>
                        <p className="nm-body" style={{ fontSize: 11 }}>
                          Showing live matches from trusted nurse hosts.
                        </p>
                      </div>
                    </div>
                  </NeumoCard>
                )}

                {/* RESULTS */}
                <div style={{ marginTop: 10 }} ref={resultsRef}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <p className="nm-body" style={{ fontSize: 12 }}>
                      {listingCountText}
                    </p>
                    <button
                      type="button"
                      className="nm-pill"
                      style={{ fontSize: 11 }}
                    >
                      ⭐ Save this search
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {filteredListings.map((listing) => (
                      <NeumoCard key={listing.id}>
                        <ListingCard listing={listing} />
                      </NeumoCard>
                    ))}
                  </div>
                </div>

                {/* SAVED TAB PLACEHOLDER */}
                {activeTab === 'saved' && (
                  <div style={{ marginTop: 12 }}>
                    <NeumoCard>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <h3 className="nm-heading-lg" style={{ fontSize: 14 }}>
                          Saved stays
                        </h3>
                        <p className="nm-body" style={{ fontSize: 12 }}>
                          You don&apos;t have any saved places yet. Tap the ⭐
                          save buttons on listings to build your shortlist.
                        </p>
                      </div>
                    </NeumoCard>
                  </div>
                )}
              </>
            )
          ) : (
            <NeumoCard>
              <HostDashboard />
            </NeumoCard>
          )}
        </main>

        {/* BOTTOM NAV */}
        <nav className="nm-bottom-nav">
          {/* HOME */}
          <button
            type="button"
            className={
              'nm-bottom-icon ' +
              (activeTab === 'home' ? 'nm-bottom-icon--active' : '')
            }
            onClick={() => {
              setViewMode('nurse')
              setActiveCategory('housing')
              setActiveTab('home')
              handleScrollToSearchBar()
            }}
          >
            🏠
          </button>

          {/* SEARCH (scroll to search/filter area) */}
          <button
            type="button"
            className={
              'nm-bottom-icon ' +
              (activeTab === 'search' ? 'nm-bottom-icon--active' : '')
            }
            onClick={() => {
              setViewMode('nurse')
              setActiveCategory('housing')
              setActiveTab('search')
              handleScrollToSearchBar()
            }}
          >
            🔍
          </button>

          {/* PLUS = quick new flow → open onboarding in Nurses profile */}
          <button
            type="button"
            className="nm-bottom-fab nm-bounce"
            onClick={() => {
              setViewMode('nurse')
              setActiveCategory('nurses')
              setActiveTab('new')
              setShowOnboarding(true)
            }}
          >
            +
          </button>

          {/* SAVED */}
          <button
            type="button"
            className={
              'nm-bottom-icon ' +
              (activeTab === 'saved' ? 'nm-bottom-icon--active' : '')
            }
            onClick={() => {
              setViewMode('nurse')
              setActiveCategory('housing')
              setActiveTab('saved')
            }}
          >
            ❤️
          </button>

          {/* PROFILE (Nurse prefs) */}
          <button
            type="button"
            className={
              'nm-bottom-icon ' +
              (activeTab === 'profile' ? 'nm-bottom-icon--active' : '')
            }
            onClick={() => {
              setViewMode('nurse')
              setActiveCategory('nurses')
              setActiveTab('profile')
              if (!prefs) {
                setShowOnboarding(true)
              }
            }}
          >
            👤
          </button>
        </nav>
      </div>
    </div>
  )
}

const ListingCard: React.FC<{ listing: Listing }> = ({ listing }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 24,
          backgroundImage: `url(${listing.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <h3
          className="nm-heading-lg"
          style={{ fontSize: 14, marginBottom: 4 }}
        >
          {listing.title}
        </h3>
        <p className="nm-body" style={{ fontSize: 11 }}>
          {listing.city}, {listing.state} · {listing.hospitalName}
        </p>
        <p className="nm-body" style={{ fontSize: 11 }}>
          ~{listing.minutesToHospital} min to hospital ·{' '}
          {listing.roomType === 'entire-place'
            ? 'Entire place'
            : listing.roomType === 'private-room'
            ? 'Private room'
            : 'Shared room'}
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 6,
          }}
        >
          {listing.tags.map((tag) => (
            <span key={tag} className="nm-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          textAlign: 'right',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            ${listing.pricePerMonth.toLocaleString()}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: 11,
              color: '#6b7280',
            }}
          >
            / month
          </span>
        </div>
        <button
          type="button"
          className="nm-pill"
          style={{ fontSize: 11, alignSelf: 'flex-end' }}
        >
          View
        </button>
      </div>
    </div>
  )
}

const NursesTab: React.FC<{
  prefs: OnboardingPrefs | null
  onEdit: () => void
}> = ({ prefs, onEdit }) => {
  const displayName =
    prefs?.name && prefs.name.trim() ? prefs.name.trim() : 'Travel nurse'

  const assignment =
    prefs?.assignmentLocation || 'Add your next assignment location'

  const dateRange =
    prefs?.startDate && prefs?.endDate
      ? `${prefs.startDate} → ${prefs.endDate}`
      : 'Add contract dates'

  const budget =
    typeof prefs?.budget === 'number'
      ? `$${prefs.budget.toLocaleString()} / month`
      : 'Set your budget'

  const room =
    prefs?.roomType === 'studio'
      ? 'Private studio'
      : prefs?.roomType === 'shared'
      ? 'Shared housing'
      : prefs?.roomType === 'entire'
      ? 'Entire place'
      : 'Any room type'

  return (
    <>
      <NeumoCard>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <h2 className="nm-heading-lg" style={{ fontSize: 18 }}>
            {displayName}&apos;s travel profile
          </h2>
          <p className="nm-body" style={{ fontSize: 12 }}>
            These preferences power your housing matches. Update them anytime
            before your next contract.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <div
              style={{
                padding: 10,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.85)',
                boxShadow:
                  '0 16px 30px rgba(45,35,80,0.15), -4px -4px 12px rgba(255,255,255,0.9)',
              }}
            >
              <div
                style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}
              >
                Next assignment
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{assignment}</div>
            </div>

            <div
              style={{
                padding: 10,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.85)',
                boxShadow:
                  '0 16px 30px rgba(45,35,80,0.15), -4px -4px 12px rgba(255,255,255,0.9)',
              }}
            >
              <div
                style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}
              >
                Contract dates
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{dateRange}</div>
            </div>

            <div
              style={{
                padding: 10,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.85)',
                boxShadow:
                  '0 16px 30px rgba(45,35,80,0.15), -4px -4px 12px rgba(255,255,255,0.9)',
              }}
            >
              <div
                style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}
              >
                Budget
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{budget}</div>
            </div>

            <div
              style={{
                padding: 10,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.85)',
                boxShadow:
                  '0 16px 30px rgba(45,35,80,0.15), -4px -4px 12px rgba(255,255,255,0.9)',
              }}
            >
              <div
                style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}
              >
                Preferred room
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{room}</div>
            </div>
          </div>

          <button
            type="button"
            className="nm-pill nm-pill--active"
            style={{ alignSelf: 'flex-start', fontSize: 13, marginTop: 4 }}
            onClick={onEdit}
          >
            Edit preferences
          </button>
        </div>
      </NeumoCard>

      <NeumoCard>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <h3 className="nm-heading-lg" style={{ fontSize: 14 }}>
            Tips for better matches
          </h3>
          <ul
            className="nm-body"
            style={{
              fontSize: 11,
              paddingLeft: 16,
              listStyle: 'disc',
            }}
          >
            <li>Keep your assignment city and hospital name specific.</li>
            <li>Set a realistic budget range for your contract length.</li>
            <li>Use “Housing” to explore listings near your saved hospital.</li>
          </ul>
        </div>
      </NeumoCard>
    </>
  )
}

export default App
