import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { OnboardingFlow } from './onboarding/OnboardingFlow'
import { NeumoCard } from './neumo/NeumoKit'
import { HostDashboard } from './HostDashboard'
import { SearchFlow, type SearchFlowResult } from './search/SearchFlow'
import { demoListings } from './data/demoListings'
import { type Listing } from './types'
import { listingMatchesAvailability } from './lib/availability'
import { platformServices } from './services/platform'
import { useAuthStore } from './stores/authStore'
import { authService } from './services/authService'
import { AuthModal } from './components/auth/AuthModal'
import { NurseVerification } from './components/verification/NurseVerification'

type RoomTypeFilter = 'any' | 'private-room' | 'entire-place' | 'shared'

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

const LISTINGS: Listing[] = demoListings

const App: React.FC = () => {
  // Auth state
  const { profile, loading: authLoading, initialized } = useAuthStore()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup')

  // Debug: Log modal state
  console.log('🎭 Modal state:', { showAuthModal, authModalMode });

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
  const [, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Listing[]>(LISTINGS)

  const [isSearchFlowOpen, setIsSearchFlowOpen] = useState(false)

  // Favorites + bottom tab state
  const [favorites, setFavorites] = useState<number[]>([])
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'favorites'>(
    'home',
  )

  // NEW: list vs map layout for the feed
  const [viewLayout, setViewLayout] = useState<'list' | 'map'>('list')

  // selected listing for detail modal
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)

  const resultsRef = useRef<HTMLDivElement | null>(null)

  // Initialize auth on mount (only once)
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      if (mounted) {
        await authService.initialize();
        authService.setupAuthListener();

        // Failsafe: Force initialized after 3 seconds if it hasn't happened
        timeoutId = setTimeout(() => {
          const { initialized } = useAuthStore.getState();
          if (!initialized && mounted) {
            console.warn('⚠️ Auth initialization timed out, forcing initialized state');
            useAuthStore.getState().setInitialized(true);
            useAuthStore.getState().setLoading(false);
          }
        }, 3000);
      }
    };

    initAuth();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [])

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

  // Run platform search whenever user-facing filters change.
  useEffect(() => {
    let cancelled = false
    async function runSearch() {
      setIsSearching(true)
      const results = await platformServices.searchListings({
        location: hospitalOrCity,
        maxBudget: typeof maxBudget === 'number' ? maxBudget : undefined,
        roomType,
        startDate: contractStart,
        endDate: contractEnd,
      })
      if (!cancelled) {
        setSearchResults(results)
        setIsSearching(false)
      }
    }
    runSearch()
    return () => {
      cancelled = true
    }
  }, [hospitalOrCity, maxBudget, roomType, contractStart, contractEnd])

  // FILTERED LISTINGS (never returns an empty list – falls back to all)
  const filteredListings = useMemo(() => {
    let next = searchResults

    const q = hospitalOrCity.trim().toLowerCase()
    if (q) {
      next = next.filter((l) => {
        const city = l.city.toLowerCase()
        const state = l.state.toLowerCase()
        const hospital = l.hospitalName.toLowerCase()
        const cityState = `${l.city}, ${l.state}`.toLowerCase()
        return (
          city.includes(q) ||
          state.includes(q) ||
          hospital.includes(q) ||
          cityState.includes(q)
        )
      })
    }

    if (typeof maxBudget === 'number') {
      next = next.filter((l) => l.pricePerMonth <= maxBudget)
    }

    if (roomType !== 'any') {
      next = next.filter((l) => l.roomType === roomType)
    }

    if (contractStart && contractEnd) {
      next = next.filter((l) =>
        listingMatchesAvailability(l, contractStart, contractEnd),
      )
    }

    // if filters wipe everything out, show all listings instead of empty
    if (next.length === 0) {
      return LISTINGS
    }

    return next
  }, [searchResults, hospitalOrCity, maxBudget, roomType, contractStart, contractEnd])

  // Listings actually shown, depending on bottom tab (All vs Favorites)
  const displayedListings = useMemo(() => {
    if (activeBottomTab === 'favorites') {
      if (favorites.length === 0) return []
      return filteredListings.filter((l) => favorites.includes(l.id))
    }
    return filteredListings
  }, [filteredListings, favorites, activeBottomTab])

  const groupedListings = useMemo(() => {
    const map = new Map<string, Listing[]>()
    for (const l of displayedListings) {
      const key = l.section || 'Stays for you'
      const arr = map.get(key) ?? []
      arr.push(l)
      map.set(key, arr)
    }
    return Array.from(map.entries()).map(([title, items]) => ({
      title,
      items,
    }))
  }, [displayedListings])

  const listingCountText =
    activeBottomTab === 'favorites' && displayedListings.length === 0
      ? 'You haven’t saved any favorites yet.'
      : displayedListings.length === 0
      ? 'No places found yet — try widening your filters.'
      : displayedListings.length === 1
      ? '1 place that matches your filters'
      : `${displayedListings.length} places that match your filters`

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

  const handleToggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleOpenListing = (listing: Listing) => {
    setSelectedListing(listing)
  }

  const handleCloseListing = () => {
    setSelectedListing(null)
  }

  const handleSignOut = async () => {
    const result = await authService.signOut()
    if (result.success) {
      // Reset to home view
      setActiveBottomTab('home')
      setActiveCategory('housing')
    }
  }

  const handleRoleSelect = () => {
    setAuthModalMode('signup')
    setShowAuthModal(true)
  }

  // Debug: Log auth state
  console.log('🔍 Auth State:', { initialized, authLoading, hasProfile: !!profile });

  // Loading state
  if (!initialized || authLoading) {
    return (
      <div className="nm-shell">
        <div className="nm-phone">
          <main className="nm-screen-content nm-fade-in flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
              <p className="text-xs text-gray-400 mt-2">
                initialized: {initialized ? 'yes' : 'no'}, loading: {authLoading ? 'yes' : 'no'}
              </p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Not authenticated - show role selector
  if (!profile) {
    return (
      <>
        <Toaster position="top-center" />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
        />

        <div className="nm-shell">
          <div className="nm-phone">
            <main className="nm-screen-content nm-fade-in">
              <NeumoCard className="nm-explore-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: '#9ca3af',
                      marginBottom: 4,
                    }}>
                      NightShift Housing
                    </div>
                    <h1 className="nm-heading-lg" style={{ fontSize: 22, marginBottom: 4 }}>
                      Who&apos;s signing in?
                    </h1>
                    <p className="nm-body" style={{ fontSize: 13 }}>
                      Choose your role to see the right dashboard and tools.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="nm-pill nm-pill--active"
                    onClick={handleRoleSelect}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <span>👩‍⚕️ I&apos;m a travel nurse</span>
                    <span style={{ fontSize: 16 }}>→</span>
                  </button>

                  <button
                    type="button"
                    className="nm-pill"
                    onClick={handleRoleSelect}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <span>🏡 I&apos;m a host</span>
                    <span style={{ fontSize: 16 }}>→</span>
                  </button>

                  <div style={{
                    marginTop: 8,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(148,163,184,0.2)',
                    textAlign: 'center',
                  }}>
                    <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode('signin');
                          setShowAuthModal(true);
                        }}
                        className="nm-body"
                        style={{
                          fontSize: 12,
                          color: '#6366f1',
                          fontWeight: 600,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </div>
              </NeumoCard>
            </main>
          </div>
        </div>
      </>
    )
  }

  // User is authenticated - get their role
  const viewMode = profile.role

  // MAIN APP
  return (
    <>
      <Toaster position="top-center" />
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

        {/* Listing detail modal */}
        {selectedListing && (
          <ListingDetailModal
            listing={selectedListing}
            onClose={handleCloseListing}
            isFavorite={favorites.includes(selectedListing.id)}
            onToggleFavorite={() => handleToggleFavorite(selectedListing.id)}
          />
        )}

      <div className="nm-phone">
        <main className="nm-screen-content nm-fade-in">
          {/* HEADER: search pill + category tabs */}
          <NeumoCard className="nm-explore-header">
            <button
              type="button"
              className="nm-search-pill"
              onClick={() => {
                setActiveBottomTab('home')
                handleSearchPillClick()
              }}
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
                {/* RESULTS FEED (list or map) */}
                <div style={{ marginTop: 16 }} ref={resultsRef}>
                  {/* Top row: result count + save search */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                      gap: 8,
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

                  {/* View toggle: List / Map */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <button
                      type="button"
                      className={
                        'nm-pill ' +
                        (viewLayout === 'list' ? 'nm-pill--active' : '')
                      }
                      style={{
                        fontSize: 11,
                        paddingInline: 12,
                        paddingBlock: 6,
                      }}
                      onClick={() => setViewLayout('list')}
                    >
                      List
                    </button>
                    <button
                      type="button"
                      className={
                        'nm-pill ' +
                        (viewLayout === 'map' ? 'nm-pill--active' : '')
                      }
                      style={{
                        fontSize: 11,
                        paddingInline: 12,
                        paddingBlock: 6,
                      }}
                      onClick={() => setViewLayout('map')}
                    >
                      Map
                    </button>
                  </div>

                  {/* Empty state for Favorites tab in list view */}
                  {activeBottomTab === 'favorites' &&
                    displayedListings.length === 0 &&
                    viewLayout === 'list' && (
                      <NeumoCard>
                        <p
                          className="nm-body"
                          style={{ fontSize: 12, textAlign: 'center' }}
                        >
                          Tap the heart on any place to save it here.
                        </p>
                      </NeumoCard>
                    )}

                  {viewLayout === 'list' ? (
                    // Original LIST VIEW (unchanged)
                    <>
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
                                  isFavorite={favorites.includes(listing.id)}
                                  onToggleFavorite={() =>
                                    handleToggleFavorite(listing.id)
                                  }
                                  onOpen={() => handleOpenListing(listing)}
                                />
                              </NeumoCard>
                            ))}
                          </div>
                        </section>
                      ))}
                    </>
                  ) : (
                    // MAP VIEW
                    <NeumoCard>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <h2
                            className="nm-heading-lg"
                            style={{ fontSize: 16 }}
                          >
                            Map view
                          </h2>
                          <span
                            className="nm-body"
                            style={{
                              fontSize: 11,
                              color: '#6b7280',
                            }}
                          >
                            Tap a pin or card to open details.
                          </span>
                        </div>

                        {/* Fake map background with pins */}
                        <div
                          style={{
                            position: 'relative',
                            borderRadius: 24,
                            overflow: 'hidden',
                            height: 260,
                            background:
                              'radial-gradient(circle at 20% 0%, #dbeafe 0, #a5b4fc 30%, #0f172a 100%)',
                            boxShadow:
                              '0 18px 40px rgba(15,23,42,0.45), -4px -4px 12px rgba(255,255,255,0.9)',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundImage:
                                'radial-gradient(circle at 20% 30%, rgba(56,189,248,0.35) 0, transparent 55%), radial-gradient(circle at 80% 70%, rgba(52,211,153,0.35) 0, transparent 55%)',
                              opacity: 0.85,
                            }}
                          />
                          {displayedListings.length === 0 ? (
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: 12,
                                textAlign: 'center',
                                paddingInline: 24,
                              }}
                            >
                              No places match these filters yet. Try switching
                              back to list view or widening your search.
                            </div>
                          ) : (
                            displayedListings
                              .slice(0, 12)
                              .map((listing, idx) => {
                                const row = Math.floor(idx / 4)
                                const col = idx % 4
                                const top = 18 + row * 18
                                const left = 10 + col * 20
                                return (
                                  <button
                                    key={listing.id}
                                    type="button"
                                    onClick={() => handleOpenListing(listing)}
                                    style={{
                                      position: 'absolute',
                                      top: `${top}%`,
                                      left: `${left}%`,
                                      transform: 'translate(-50%, -50%)',
                                      borderRadius: 999,
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '6px 10px',
                                      background:
                                        'linear-gradient(135deg,#6366f1,#ec4899)',
                                      color: 'white',
                                      fontSize: 10,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      boxShadow:
                                        '0 12px 26px rgba(15,23,42,0.6)',
                                    }}
                                  >
                                    <span>📍</span>
                                    <span
                                      style={{
                                        maxWidth: 80,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {listing.city}
                                    </span>
                                  </button>
                                )
                              })
                          )}
                        </div>

                        {/* Horizontal scroll of cards under map */}
                        {displayedListings.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              gap: 10,
                              overflowX: 'auto',
                              paddingBottom: 4,
                              marginTop: 4,
                            }}
                          >
                            {displayedListings.map((listing) => (
                              <button
                                key={listing.id}
                                type="button"
                                onClick={() => handleOpenListing(listing)}
                                style={{
                                  minWidth: 160,
                                  borderRadius: 16,
                                  border: 'none',
                                  padding: 8,
                                  background: 'rgba(255,255,255,0.9)',
                                  boxShadow:
                                    '0 12px 22px rgba(148,163,184,0.35)',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                }}
                              >
                                <div
                                  style={{
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    height: 80,
                                    marginBottom: 6,
                                    backgroundImage: `url(${listing.imageUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                  }}
                                />
                                <p
                                  className="nm-body"
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    marginBottom: 2,
                                  }}
                                >
                                  {listing.city}, {listing.state}
                                </p>
                                <p
                                  className="nm-body"
                                  style={{ fontSize: 10, marginBottom: 2 }}
                                >
                                  ~{listing.minutesToHospital} min to{' '}
                                  {listing.hospitalName}
                                </p>
                                <p
                                  className="nm-body"
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                  }}
                                >
                                  ${listing.pricePerMonth.toLocaleString()}{' '}
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 400,
                                      color: '#6b7280',
                                    }}
                                  >
                                    / month
                                  </span>
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </NeumoCard>
                  )}
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
            className={
              'nm-bottom-icon ' +
              (activeBottomTab === 'home' ? 'nm-bottom-icon--active' : '')
            }
            type="button"
            onClick={() => {
              setActiveBottomTab('home')
              setViewLayout('list')
            }}
          >
            🏠
          </button>
          <button
            className="nm-bottom-icon"
            type="button"
            onClick={() => {
              setActiveBottomTab('home')
              handleSearchPillClick()
            }}
          >
            🔍
          </button>
          <button
            className={
              'nm-bottom-icon ' +
              (activeBottomTab === 'favorites'
                ? 'nm-bottom-icon--active'
                : '')
            }
            type="button"
            onClick={() => {
              setActiveBottomTab('favorites')
              setViewLayout('list')
            }}
          >
            ❤️
          </button>
          <button
            className="nm-bottom-icon"
            type="button"
            onClick={handleSignOut}
          >
            👤
          </button>
        </nav>
      </div>
    </div>
    </>
  )
}

const ListingCard: React.FC<{
  listing: Listing
  isFavorite: boolean
  onToggleFavorite: () => void
  onOpen: () => void
}> = ({ listing, isFavorite, onToggleFavorite, onOpen }) => {
  return (
    <button
      type="button"
      onClick={onOpen}
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
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 30,
            height: 30,
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            background: isFavorite
              ? 'linear-gradient(135deg, #ff66c4, #ff9f4c)'
              : 'rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            boxShadow: isFavorite
              ? '0 8px 18px rgba(255,102,196,0.4)'
              : '0 8px 18px rgba(0,0,0,0.12)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <span
            style={{
              transform: isFavorite ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {isFavorite ? '💜' : '🤍'}
          </span>
        </button>
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

const ListingDetailModal: React.FC<{
  listing: Listing
  isFavorite: boolean
  onToggleFavorite: () => void
  onClose: () => void
}> = ({ listing, isFavorite, onToggleFavorite, onClose }) => {
  const roomLabel =
    listing.roomType === 'entire-place'
      ? 'Entire place'
      : listing.roomType === 'private-room'
      ? 'Private room'
      : 'Shared room'

  // Local state for enter/exit animation
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // kick off enter animation on mount
    setIsVisible(true)
  }, [])

  const handleRequestClose = () => {
    // play exit animation, then call parent onClose
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 220)
  }

  return (
    <div
      onClick={handleRequestClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        zIndex: 50,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.22s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          maxHeight: '90vh',
          background:
            'radial-gradient(circle at top, #fdf2ff 0, #f9fafb 35%, #eef2ff 100%)',
          borderRadius: 32,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(15,23,42,0.4)',
          display: 'flex',
          flexDirection: 'column',
          transform: isVisible
            ? 'translateY(0px) scale(1)'
            : 'translateY(24px) scale(0.96)',
          opacity: isVisible ? 1 : 0.4,
          transition:
            'transform 0.24s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.24s ease-out',
        }}
      >
        {/* Image */}
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
            onClick={handleRequestClose}
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              borderRadius: 999,
              border: 'none',
              padding: '6px 10px',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(15,23,42,0.75)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={onToggleFavorite}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 34,
              height: 34,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: isFavorite
                ? 'linear-gradient(135deg, #ff66c4, #ff9f4c)'
                : 'rgba(255,255,255,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              boxShadow: isFavorite
                ? '0 10px 24px rgba(255,102,196,0.45)'
                : '0 10px 24px rgba(15,23,42,0.3)',
            }}
          >
            {isFavorite ? '💜' : '🤍'}
          </button>

          {listing.rating && (
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(15,23,42,0.85)',
                color: 'white',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>⭐ {listing.rating.toFixed(2)}</span>
              {listing.reviewCount && (
                <span style={{ opacity: 0.85 }}>
                  ({listing.reviewCount} reviews)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            padding: 18,
            paddingBottom: 12,
            overflowY: 'auto',
          }}
        >
          <h2
            className="nm-heading-lg"
            style={{ fontSize: 18, marginBottom: 4 }}
          >
            {listing.title}
          </h2>
          <p className="nm-body" style={{ fontSize: 12, marginBottom: 4 }}>
            {listing.city}, {listing.state} · {roomLabel}
          </p>
          <p className="nm-body" style={{ fontSize: 12, marginBottom: 10 }}>
            ~{listing.minutesToHospital} min to {listing.hospitalName}
          </p>

          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            {listing.tags.map((tag) => (
              <span key={tag} className="nm-tag">
                {tag}
              </span>
            ))}
          </div>

          {/* Price block */}
          <div
            style={{
              padding: 12,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.9)',
              boxShadow:
                '0 12px 24px rgba(148,163,184,0.28), -4px -4px 12px rgba(255,255,255,0.9)',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                ${listing.pricePerMonth.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: '#6b7280',
                }}
              >
                / month · no extra fees
              </span>
            </div>
            <p
              className="nm-body"
              style={{
                fontSize: 11,
                color: '#4b5563',
              }}
            >
              Perfect for 13-week contracts. Ask the host about flexible
              extensions or shorter stays.
            </p>
          </div>

          {/* Amenities grid */}
          <div style={{ marginBottom: 14 }}>
            <h3
              className="nm-heading-lg"
              style={{ fontSize: 14, marginBottom: 6 }}
            >
              Amenities
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 8,
                fontSize: 11,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📶</span>
                <span>Fast Wi-Fi</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🧺</span>
                <span>Washer & dryer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🚗</span>
                <span>Free parking</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🍳</span>
                <span>Stocked kitchen</span>
              </div>
            </div>
          </div>

          {/* What you get (perks) */}
          <div style={{ marginBottom: 14 }}>
            <h3
              className="nm-heading-lg"
              style={{ fontSize: 14, marginBottom: 4 }}
            >
              What you get
            </h3>
            <ul
              className="nm-body"
              style={{ fontSize: 11, paddingLeft: 18, listStyle: 'disc' }}
            >
              {listing.perks.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
              <li>Quiet hours ideal for night shifters</li>
              <li>Simple, nurse-first communication</li>
            </ul>
          </div>

          {/* NightShift tip */}
          <div
            style={{
              marginTop: 4,
              marginBottom: 14,
              padding: 12,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.85)',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background:
                  'radial-gradient(circle at 30% 0%, #f97316 0, #facc15 40%, #f97316 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              🩺
            </div>
            <div>
              <p
                className="nm-body"
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                NightShift tip
              </p>
              <p className="nm-body" style={{ fontSize: 11 }}>
                Tell the host your shift schedule so they can help keep things
                quiet when you need sleep.
              </p>
            </div>
          </div>

          {/* Fake calendar + Select dates CTA */}
          <div
            style={{
              padding: 12,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.9)',
              boxShadow:
                '0 10px 22px rgba(148,163,184,0.25), -4px -4px 10px rgba(255,255,255,0.9)',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <div>
                <p
                  className="nm-body"
                  style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}
                >
                  Dates
                </p>
                <p
                  className="nm-body"
                  style={{ fontSize: 12, fontWeight: 600 }}
                >
                  Add your contract dates
                </p>
              </div>
              <button
                type="button"
                style={{
                  borderRadius: 999,
                  border: 'none',
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background:
                    'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                  color: 'white',
                  boxShadow: '0 8px 18px rgba(129,140,248,0.45)',
                }}
              >
                Select dates
              </button>
            </div>
            <div
              style={{
                borderRadius: 14,
                border: '1px dashed rgba(148,163,184,0.7)',
                padding: 8,
                fontSize: 10,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: 4,
                  textAlign: 'center',
                  marginBottom: 4,
                }}
              >
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
                  <span
                    key={d}
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: 0.3,
                      color: '#9ca3af',
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: 4,
                  textAlign: 'center',
                }}
              >
                {Array.from({ length: 14 }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      height: 18,
                      borderRadius: 999,
                      background:
                        idx >= 3 && idx <= 9
                          ? 'linear-gradient(135deg, #6366f1, #ec4899)'
                          : 'rgba(249,250,251,1)',
                      opacity: idx >= 3 && idx <= 9 ? 0.85 : 1,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Static map stub */}
          <div
            style={{
              borderRadius: 18,
              overflow: 'hidden',
              background:
                'linear-gradient(135deg, #0f172a, #1d4ed8, #22c55e)',
              padding: 10,
              color: 'white',
              fontSize: 11,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ opacity: 0.9 }}>Map preview</span>
              <span
                style={{
                  borderRadius: 999,
                  padding: '2px 8px',
                  background: 'rgba(15,23,42,0.65)',
                  fontSize: 10,
                }}
              >
                Exact location after booking
              </span>
            </div>
            <div
              style={{
                borderRadius: 14,
                background:
                  'radial-gradient(circle at 20% 0%, #bae6fd 0, #38bdf8 30%, #0f172a 90%)',
                height: 90,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'radial-gradient(circle at 20% 30%, rgba(56,189,248,0.35) 0, transparent 50%), radial-gradient(circle at 80% 70%, rgba(52,211,153,0.35) 0, transparent 55%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '55%',
                  top: '45%',
                  transform: 'translate(-50%, -50%)',
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 25px rgba(15,23,42,0.65)',
                  fontSize: 14,
                }}
              >
                📍
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: 10,
                  bottom: 10,
                  borderRadius: 999,
                  padding: '4px 10px',
                  background: 'rgba(15,23,42,0.75)',
                  color: 'white',
                  fontSize: 10,
                }}
              >
                Near {listing.hospitalName}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom reserve bar */}
        <div
          style={{
            padding: 12,
            borderTop: '1px solid rgba(148,163,184,0.25)',
            background:
              'linear-gradient(to top, rgba(249,250,251,0.95), rgba(249,250,251,0.7))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              ${listing.pricePerMonth.toLocaleString()}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  marginLeft: 4,
                  color: '#6b7280',
                }}
              >
                / month
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>
              Save now, ask questions later.
            </div>
          </div>
          <button
            type="button"
            style={{
              border: 'none',
              borderRadius: 999,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background:
                'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
              color: 'white',
              boxShadow: '0 12px 28px rgba(129,140,248,0.5)',
            }}
          >
            Request to book
          </button>
        </div>
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
      {/* Nurse Verification Section */}
      <NurseVerification />

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
