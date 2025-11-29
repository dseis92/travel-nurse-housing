import React, { useEffect, useMemo, useRef, useState } from 'react'
import { OnboardingFlow } from './onboarding/OnboardingFlow'
import { NeumoCard } from './neumo/NeumoKit'
import { HostDashboard } from './HostDashboard'
import { SearchFlow, type SearchFlowResult } from './search/SearchFlow'

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
  section: string
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

/** Demo listings so feed feels like Airbnb */
const LISTINGS: Listing[] = [
  // -------- Minneapolis: Popular homes --------
  {
    id: 1,
    title: 'Place to stay in Whittier',
    city: 'Minneapolis',
    state: 'MN',
    hospitalName: 'Abbott Northwestern Hospital',
    hospitalCity: 'Minneapolis',
    hospitalState: 'MN',
    minutesToHospital: 8,
    pricePerMonth: 2400,
    roomType: 'entire-place',
    imageUrl:
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
    tags: ['Guest favorite', '2 nights min', 'Self check-in'],
    perks: ['Fast Wi-Fi', 'Free parking'],
    rating: 4.92,
    reviewCount: 128,
    section: 'Popular homes in Minneapolis',
  },
  {
    id: 2,
    title: 'Home in Minneapolis',
    city: 'Minneapolis',
    state: 'MN',
    hospitalName: 'Hennepin County Medical Center',
    hospitalCity: 'Minneapolis',
    hospitalState: 'MN',
    minutesToHospital: 10,
    pricePerMonth: 2600,
    roomType: 'entire-place',
    imageUrl:
      'https://images.pexels.com/photos/1396125/pexels-photo-1396125.jpeg',
    tags: ['Bright & modern', 'Dedicated workspace'],
    perks: ['Washer / dryer'],
    rating: 4.76,
    reviewCount: 86,
    section: 'Popular homes in Minneapolis',
  },
  {
    id: 3,
    title: 'Cozy walk-up near U of M',
    city: 'Minneapolis',
    state: 'MN',
    hospitalName: 'M Health Fairview University',
    hospitalCity: 'Minneapolis',
    hospitalState: 'MN',
    minutesToHospital: 12,
    pricePerMonth: 2200,
    roomType: 'entire-place',
    imageUrl:
      'https://images.pexels.com/photos/259580/pexels-photo-259580.jpeg',
    tags: ['Near light rail', 'Private balcony'],
    perks: ['Garage parking'],
    rating: 4.88,
    reviewCount: 64,
    section: 'Popular homes in Minneapolis',
  },

  // -------- Milwaukee: Available this weekend --------
  {
    id: 4,
    title: 'Room in Avenues West',
    city: 'Milwaukee',
    state: 'WI',
    hospitalName: 'Froedtert Hospital',
    hospitalCity: 'Milwaukee',
    hospitalState: 'WI',
    minutesToHospital: 6,
    pricePerMonth: 1550,
    roomType: 'private-room',
    imageUrl:
      'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg',
    tags: ['Private room', 'Shared kitchen'],
    perks: ['Street parking'],
    rating: 4.85,
    reviewCount: 64,
    section: 'Available in Milwaukee this weekend',
  },
  {
    id: 5,
    title: 'Apartment in Milwaukee',
    city: 'Milwaukee',
    state: 'WI',
    hospitalName: 'Aurora St. Luke’s',
    hospitalCity: 'Milwaukee',
    hospitalState: 'WI',
    minutesToHospital: 9,
    pricePerMonth: 1900,
    roomType: 'entire-place',
    imageUrl:
      'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg',
    tags: ['Guest favorite', 'City view'],
    perks: ['Garage parking'],
    rating: 4.83,
    reviewCount: 72,
    section: 'Available in Milwaukee this weekend',
  },
  {
    id: 6,
    title: 'Sunlit loft near lakefront',
    city: 'Milwaukee',
    state: 'WI',
    hospitalName: 'Children’s Wisconsin',
    hospitalCity: 'Milwaukee',
    hospitalState: 'WI',
    minutesToHospital: 11,
    pricePerMonth: 2100,
    roomType: 'entire-place',
    imageUrl:
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
    tags: ['Walk to lake', 'In-unit laundry'],
    perks: ['Fast Wi-Fi'],
    rating: 4.9,
    reviewCount: 39,
    section: 'Available in Milwaukee this weekend',
  },

  // -------- Wausau: nurse-favorite --------
  {
    id: 7,
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
    section: 'Nurse-favorite stays in Wausau',
  },
  {
    id: 8,
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
    section: 'Nurse-favorite stays in Wausau',
  },

  // -------- Green Bay --------
  {
    id: 9,
    title: 'Townhome near Bellin Hospital',
    city: 'Green Bay',
    state: 'WI',
    hospitalName: 'Bellin Hospital',
    hospitalCity: 'Green Bay',
    hospitalState: 'WI',
    minutesToHospital: 6,
    pricePerMonth: 2100,
    roomType: 'entire-place',
    imageUrl:
      'https://images.pexels.com/photos/259580/pexels-photo-259580.jpeg',
    tags: ['Driveway parking', 'Backyard'],
    perks: ['Pet friendly'],
    rating: 4.7,
    reviewCount: 31,
    section: 'Stay in Green Bay',
  },
  {
    id: 10,
    title: 'Basement suite for night shifters',
    city: 'Green Bay',
    state: 'WI',
    hospitalName: 'St. Vincent Hospital',
    hospitalCity: 'Green Bay',
    hospitalState: 'WI',
    minutesToHospital: 9,
    pricePerMonth: 1400,
    roomType: 'private-room',
    imageUrl:
      'https://images.pexels.com/photos/751204/pexels-photo-751204.jpeg',
    tags: ['Blackout curtains', 'Quiet hours enforced'],
    perks: ['Off-street parking'],
    rating: 4.82,
    reviewCount: 45,
    section: 'Stay in Green Bay',
  },

  // -------- Madison --------
  {
    id: 11,
    title: 'Capitol view studio',
    city: 'Madison',
    state: 'WI',
    hospitalName: 'UW Health University Hospital',
    hospitalCity: 'Madison',
    hospitalState: 'WI',
    minutesToHospital: 12,
    pricePerMonth: 2300,
    roomType: 'entire-place',
    imageUrl:
      'https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg',
    tags: ['Walkable', 'City view'],
    perks: ['In-building gym'],
    rating: 4.9,
    reviewCount: 52,
    section: 'Stays near Madison hospitals',
  },
  {
    id: 12,
    title: 'Room in shared nurse flat',
    city: 'Madison',
    state: 'WI',
    hospitalName: 'SSM Health St. Mary’s',
    hospitalCity: 'Madison',
    hospitalState: 'WI',
    minutesToHospital: 8,
    pricePerMonth: 1250,
    roomType: 'private-room',
    imageUrl:
      'https://images.pexels.com/photos/1571467/pexels-photo-1571467.jpeg',
    tags: ['Nurses only', 'All-female household'],
    perks: ['Fast Wi-Fi'],
    rating: 4.78,
    reviewCount: 29,
    section: 'Stays near Madison hospitals',
  },

  // -------- Chicago --------
  {
    id: 13,
    title: 'High-rise studio near Rush',
    city: 'Chicago',
    state: 'IL',
    hospitalName: 'Rush University Medical Center',
    hospitalCity: 'Chicago',
    hospitalState: 'IL',
    minutesToHospital: 7,
    pricePerMonth: 3200,
    roomType: 'entire-place',
    imageUrl:
      'https://images.pexels.com/photos/439227/pexels-photo-439227.jpeg',
    tags: ['Downtown', '24/7 concierge'],
    perks: ['Gym & pool'],
    rating: 4.88,
    reviewCount: 91,
    section: 'Longer stays in Chicago',
  },
  {
    id: 14,
    title: 'Garden unit near Loyola',
    city: 'Chicago',
    state: 'IL',
    hospitalName: 'Loyola University Medical Center',
    hospitalCity: 'Maywood',
    hospitalState: 'IL',
    minutesToHospital: 16,
    pricePerMonth: 2100,
    roomType: 'entire-place',
    imageUrl:
      'https://images.pexels.com/photos/259580/pexels-photo-259580.jpeg',
    tags: ['Quiet neighborhood', 'On-site laundry'],
    perks: ['Street parking'],
    rating: 4.7,
    reviewCount: 38,
    section: 'Longer stays in Chicago',
  },

  // -------- Denver --------
  {
    id: 15,
    title: 'Studio near Swedish Medical Center',
    city: 'Englewood',
    state: 'CO',
    hospitalName: 'Swedish Medical Center',
    hospitalCity: 'Englewood',
    hospitalState: 'CO',
    minutesToHospital: 4,
    pricePerMonth: 2450,
    roomType: 'entire-place',
    imageUrl:
      'https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg',
    tags: ['Walk to hospital', 'Mountain views'],
    perks: ['Garage parking', 'Fast Wi-Fi'],
    rating: 4.93,
    reviewCount: 57,
    section: 'Stays around Denver metro',
  },
  {
    id: 16,
    title: 'Shared house near UCHealth',
    city: 'Aurora',
    state: 'CO',
    hospitalName:
      'UCHealth University of Colorado Hospital',
    hospitalCity: 'Aurora',
    hospitalState: 'CO',
    minutesToHospital: 9,
    pricePerMonth: 1350,
    roomType: 'private-room',
    imageUrl:
      'https://images.pexels.com/photos/1571467/pexels-photo-1571467.jpeg',
    tags: ['Nurses only', 'Backyard'],
    perks: ['Driveway parking'],
    rating: 4.8,
    reviewCount: 34,
    section: 'Stays around Denver metro',
  },
]

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<'nurse' | 'host' | null>(null)
  const [activeCategory, setActiveCategory] = useState<
    'housing' | 'hospitals' | 'nurses'
  >('housing')

  const [prefs, setPrefs] = useState<OnboardingPrefs | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const [hospitalOrCity, setHospitalOrCity] = useState('')
  const [maxBudget, setMaxBudget] = useState<number | ''>(4000)
  const [roomType, setRoomType] = useState<RoomTypeFilter>('any')
  const [contractStart, setContractStart] = useState('')
  const [contractEnd, setContractEnd] = useState('')

  const [isSearchFlowOpen, setIsSearchFlowOpen] = useState(false)

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)

  const resultsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const loaded = loadOnboardingPrefs()
    if (!loaded) return

    setPrefs(loaded)

    if (loaded.assignmentLocation) setHospitalOrCity(loaded.assignmentLocation)
    if (typeof loaded.budget === 'number') setMaxBudget(loaded.budget)
    if (loaded.startDate) setContractStart(loaded.startDate)
    if (loaded.endDate) setContractEnd(loaded.endDate)
    setRoomType(mapRoomTypeFromOnboarding(loaded.roomType))
  }, [])

  useEffect(() => {
    if (activeCategory !== 'nurses') {
      setShowOnboarding(false)
    }
  }, [activeCategory])

  const filteredListings = useMemo(() => {
    // For now: ALWAYS show all demo listings,
    // ignore filters so feed is never empty.
    return LISTINGS
  }, [hospitalOrCity, maxBudget, roomType, contractStart, contractEnd])

  const groupedListings = useMemo(() => {
    const map = new Map<string, Listing[]>()
    for (const l of filteredListings) {
      const key = l.section || 'Stays for you'
      const arr = map.get(key) ?? []
      arr.push(l)
      map.set(key, arr)
    }
    return Array.from(map.entries()).map(([title, items]) => ({
      title,
      items,
    }))
  }, [filteredListings])

  const listingCountText =
    filteredListings.length === 0
      ? 'No places found yet — try widening your filters.'
      : filteredListings.length === 1
      ? '1 place that matches your filters'
      : `${filteredListings.length} places that match your filters`

  const handleSearchPillClick = () => {
    setIsSearchFlowOpen(true)
  }

  const handleSearchComplete = (result: SearchFlowResult) => {
    setIsSearchFlowOpen(false)

    if (result.location) setHospitalOrCity(result.location)
    if (result.startDate) setContractStart(result.startDate)
    if (result.endDate) setContractEnd(result.endDate)

    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  const closeOnboardingAndRefresh = () => {
    const updated = loadOnboardingPrefs()
    if (updated) setPrefs(updated)
    setShowOnboarding(false)
  }

  // WHO'S SIGNING IN
  if (currentRole === null) {
    return (
      <div className="nm-shell">
        <div className="nm-phone">
          <main className="nm-screen-content nm-fade-in">
            <NeumoCard className="nm-explore-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: '#9ca3af',
                      marginBottom: 4,
                    }}
                  >
                    NightShift Housing
                  </div>
                  <h1
                    className="nm-heading-lg"
                    style={{ fontSize: 22, marginBottom: 4 }}
                  >
                    Who&apos;s signing in?
                  </h1>
                  <p className="nm-body" style={{ fontSize: 13 }}>
                    Choose your role to see the right dashboard and tools.
                  </p>
                </div>

                <button
                  type="button"
                  className="nm-pill nm-pill--active"
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    display: 'flex',
                    alignItems: 'center',
                    paddingInline: 18,
                    fontSize: 14,
                  }}
                  onClick={() => setCurrentRole('nurse')}
                >
                  <span>👩‍⚕️ I&apos;m a travel nurse</span>
                  <span style={{ fontSize: 16 }}>→</span>
                </button>

                <button
                  type="button"
                  className="nm-pill"
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    display: 'flex',
                    alignItems: 'center',
                    paddingInline: 18,
                    fontSize: 14,
                  }}
                  onClick={() => setCurrentRole('host')}
                >
                  <span>🏡 I&apos;m a host</span>
                  <span style={{ fontSize: 16 }}>→</span>
                </button>

                <p
                  className="nm-body"
                  style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}
                >
                  You can switch between Nurse and Host anytime from the profile
                  tab.
                </p>
              </div>
            </NeumoCard>
          </main>
        </div>
      </div>
    )
  }

  // At this point TS knows currentRole is 'nurse' | 'host', but we assert it
  const viewMode = currentRole as 'nurse' | 'host'

  // MAIN APP
  return (
    <div className="nm-shell">
      {isSearchFlowOpen && (
        <SearchFlow
          initialLocation={hospitalOrCity}
          initialStartDate={contractStart}
          initialEndDate={contractEnd}
          onClose={() => setIsSearchFlowOpen(false)}
          onComplete={handleSearchComplete}
        />
      )}

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}

      <div className="nm-phone">
        <main className="nm-screen-content nm-fade-in">
          {/* HEADER: search pill + category tabs */}
          <NeumoCard className="nm-explore-header">
            <button
              type="button"
              className="nm-search-pill"
              onClick={handleSearchPillClick}
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
                onClick={() => setActiveCategory('housing')}
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
                onClick={() => setActiveCategory('hospitals')}
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
                onClick={() => setActiveCategory('nurses')}
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
                {/* RESULTS FEED */}
                <div style={{ marginTop: 16 }} ref={resultsRef}>
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

                  {groupedListings.map((group) => (
                    <section key={group.title} style={{ marginBottom: 18 }}>
                      <h2
                        className="nm-heading-lg"
                        style={{ fontSize: 16, marginBottom: 8 }}
                      >
                        {group.title}
                      </h2>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        {group.items.map((listing) => (
                          <NeumoCard key={listing.id}>
                            <ListingCard
                              listing={listing}
                              onSelect={setSelectedListing}
                            />
                          </NeumoCard>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </>
            )
          ) : (
            <NeumoCard>
              <HostDashboard />
            </NeumoCard>
          )}
        </main>

        <nav className="nm-bottom-nav">
          <button
            className="nm-bottom-icon nm-bottom-icon--active"
            type="button"
          >
            🏠
          </button>
          <button
            className="nm-bottom-icon"
            type="button"
            onClick={handleSearchPillClick}
          >
            🔍
          </button>
          <button className="nm-bottom-icon" type="button">
            ❤️
          </button>
          <button
            className="nm-bottom-icon"
            type="button"
            onClick={() => setCurrentRole(null)}
          >
            👤
          </button>
        </nav>
      </div>
    </div>
  )
}

const ListingCard: React.FC<{
  listing: Listing
  onSelect: (listing: Listing) => void
}> = ({ listing, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(listing)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          borderRadius: 26,
          overflow: 'hidden',
          height: 180,
          backgroundImage: `url(${listing.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {listing.rating && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.9)',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Guest favorite
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 30,
            height: 30,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}
        >
          🤍
        </div>
      </div>

      <div>
        <h3
          className="nm-heading-lg"
          style={{ fontSize: 14, marginBottom: 2 }}
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
        <p
          className="nm-body"
          style={{ fontSize: 11, marginTop: 4, fontWeight: 600 }}
        >
          ${listing.pricePerMonth.toLocaleString()} / month
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
    </button>
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

const ListingDetailModal: React.FC<{
  listing: Listing
  onClose: () => void
}> = ({ listing, onClose }) => {
  const roomLabel =
    listing.roomType === 'entire-place'
      ? 'Entire place'
      : listing.roomType === 'private-room'
      ? 'Private room'
      : 'Shared room'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <div
        style={{
          width: 380,
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: 40,
          overflow: 'hidden',
          background:
            'linear-gradient(145deg, #f9fafb, #eef2ff, #e0f2fe, #fef9c3)',
          boxShadow:
            '0 30px 60px rgba(15,23,42,0.45), -6px -6px 20px rgba(255,255,255,0.9)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* HERO IMAGE / TOP BAR */}
        <div
          style={{
            position: 'relative',
            height: 220,
            backgroundImage: `url(${listing.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              width: 36,
              height: 36,
              borderRadius: 999,
              border: 'none',
              background: 'rgba(255,255,255,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ←
          </button>

          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              display: 'flex',
              gap: 10,
            }}
          >
            <button
              type="button"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                cursor: 'pointer',
              }}
            >
              ⤴️
            </button>
            <button
              type="button"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                cursor: 'pointer',
              }}
            >
              🤍
            </button>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 14,
              right: 18,
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(15,23,42,0.85)',
              color: 'white',
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            1 / 12
          </div>
        </div>

        {/* SCROLLABLE DETAILS */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 18px 96px 18px',
          }}
        >
          <section style={{ marginBottom: 16 }}>
            <h1
              className="nm-heading-lg"
              style={{ fontSize: 20, marginBottom: 4 }}
            >
              {listing.title}
            </h1>
            <p className="nm-body" style={{ fontSize: 13, marginBottom: 4 }}>
              Entire home in {listing.city}, {listing.state}
            </p>
            <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
              For travel nurses near{' '}
              <strong>{listing.hospitalName}</strong> · ~
              {listing.minutesToHospital} min commute
            </p>

            {listing.rating && (
              <p
                className="nm-body"
                style={{
                  fontSize: 12,
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>⭐ {listing.rating.toFixed(2)}</span>
                {listing.reviewCount && (
                  <span style={{ color: '#6b7280' }}>
                    · {listing.reviewCount} reviews
                  </span>
                )}
              </p>
            )}
          </section>

          <section
            style={{
              borderRadius: 20,
              padding: 14,
              marginBottom: 16,
              background: 'rgba(255,255,255,0.9)',
              boxShadow:
                '0 18px 30px rgba(148,163,184,0.30), -4px -4px 14px rgba(255,255,255,0.9)',
            }}
          >
            <h2
              className="nm-heading-lg"
              style={{ fontSize: 15, marginBottom: 8 }}
            >
              What this place offers
            </h2>
            <ul
              className="nm-body"
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <li>🏡 {roomLabel}</li>
              <li>🏥 {listing.hospitalName}</li>
              <li>🕒 ~{listing.minutesToHospital} min to hospital</li>
              {listing.perks.map((perk) => (
                <li key={perk}>✅ {perk}</li>
              ))}
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2
              className="nm-heading-lg"
              style={{ fontSize: 15, marginBottom: 8 }}
            >
              Stay details
            </h2>
            <p className="nm-body" style={{ fontSize: 12, lineHeight: 1.5 }}>
              This home is set up with travel clinicians in mind: quiet hours,
              fast Wi-Fi, and a comfortable space to actually rest between
              shifts. Flexible month–to–month options available, with simple
              move-in and move-out.
            </p>
          </section>

          <section
            style={{
              borderRadius: 18,
              padding: 14,
              background: 'rgba(255,255,255,0.95)',
              boxShadow:
                '0 16px 28px rgba(148,163,184,0.25), -4px -4px 12px rgba(255,255,255,0.95)',
            }}
          >
            <h2
              className="nm-heading-lg"
              style={{ fontSize: 15, marginBottom: 10 }}
            >
              Meet your host
            </h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background:
                    'radial-gradient(circle at top left, #a855f7, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 22,
                }}
              >
                🏡
              </div>
              <div>
                <p
                  className="nm-heading-lg"
                  style={{ fontSize: 14, marginBottom: 2 }}
                >
                  NightShift host
                </p>
                <p
                  className="nm-body"
                  style={{ fontSize: 11, color: '#6b7280' }}
                >
                  3+ years hosting travel professionals
                </p>
              </div>
            </div>
            <button
              type="button"
              className="nm-pill"
              style={{ fontSize: 12 }}
            >
              Message host
            </button>
          </section>
        </div>

        {/* BOTTOM RESERVE BAR */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '12px 18px 18px 18px',
          }}
        >
          <div
            style={{
              borderRadius: 999,
              background:
                'linear-gradient(135deg, #111827, #1f2937, #be185d)',
              padding: 4,
              boxShadow:
                '0 18px 35px rgba(15,23,42,0.7), -4px -4px 14px rgba(255,255,255,0.6)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: 999,
                background: 'white',
                padding: '10px 14px',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div>
                <div
                  className="nm-body"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 2,
                  }}
                >
                  ${listing.pricePerMonth.toLocaleString()} / month
                </div>
                <div
                  className="nm-body"
                  style={{ fontSize: 11, color: '#6b7280' }}
                >
                  No platform fees · flexible terms
                </div>
              </div>
              <button
                type="button"
                style={{
                  padding: '9px 20px',
                  borderRadius: 999,
                  border: 'none',
                  background:
                    'linear-gradient(135deg, #ec4899, #f97316, #facc15)',
                  color: '#111827',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Reserve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
