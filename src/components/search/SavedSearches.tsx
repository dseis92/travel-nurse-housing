import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { savedSearchService, type SavedSearch, type CreateSavedSearchInput, type SearchFilters } from '../../services/savedSearchService'
import toast from 'react-hot-toast'

interface SavedSearchesProps {
  currentFilters?: SearchFilters
  onApplySearch?: (filters: SearchFilters) => void
}

export function SavedSearches({ currentFilters, onApplySearch }: SavedSearchesProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSearches()
  }, [])

  const loadSearches = async () => {
    try {
      setLoading(true)
      const data = await savedSearchService.getSavedSearches()
      setSearches(data)
    } catch (error: any) {
      console.error('Error loading saved searches:', error)
      toast.error('Failed to load saved searches')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCurrentSearch = async () => {
    if (!searchName.trim()) {
      toast.error('Please enter a name for this search')
      return
    }

    if (!currentFilters) {
      toast.error('No active filters to save')
      return
    }

    try {
      setSaving(true)
      const input: CreateSavedSearchInput = {
        name: searchName.trim(),
        filters: currentFilters,
        alertEnabled: false,
      }
      await savedSearchService.createSavedSearch(input)
      toast.success('Search saved!')
      setSearchName('')
      setShowSaveModal(false)
      await loadSearches()
    } catch (error: any) {
      console.error('Error saving search:', error)
      toast.error('Failed to save search')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSearch = async (id: string, name: string) => {
    if (!confirm(`Delete saved search "${name}"?`)) return

    try {
      await savedSearchService.deleteSavedSearch(id)
      toast.success('Search deleted')
      await loadSearches()
    } catch (error: any) {
      console.error('Error deleting search:', error)
      toast.error('Failed to delete search')
    }
  }

  const handleApplySearch = async (search: SavedSearch) => {
    try {
      const filters = await savedSearchService.applySavedSearch(search.id)
      onApplySearch?.(filters)
      toast.success(`Applied "${search.name}"`)
    } catch (error: any) {
      console.error('Error applying search:', error)
      toast.error('Failed to apply search')
    }
  }

  const formatFilterSummary = (filters: SearchFilters): string => {
    const parts: string[] = []

    if (filters.city) parts.push(filters.city)
    if (filters.hospitalName) parts.push(filters.hospitalName)
    if (filters.maxBudget) parts.push(`≤ $${filters.maxBudget}`)
    if (filters.roomType) parts.push(filters.roomType.replace('-', ' '))
    if (filters.startDate && filters.endDate) {
      parts.push(`${new Date(filters.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(filters.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
    }

    return parts.length > 0 ? parts.join(' • ') : 'No filters'
  }

  if (loading) {
    return (
      <NeumoCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: 24 }}>
          <div
            style={{
              width: 24,
              height: 24,
              border: '3px solid #14B8A6',
              borderTopColor: 'transparent',
              borderRadius: 999,
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
            Loading saved searches...
          </p>
        </div>
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </NeumoCard>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 4 }}>
        <h3 className="nm-heading-lg" style={{ fontSize: 14 }}>
          Saved Searches
        </h3>
        {currentFilters && (
          <button
            className="nm-pill nm-pill--active"
            style={{ fontSize: 11 }}
            onClick={() => setShowSaveModal(true)}
          >
            💾 Save Current
          </button>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999,
            }}
            onClick={() => setShowSaveModal(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              width: '90%',
              maxWidth: 400,
            }}
          >
            <NeumoCard>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 className="nm-heading-lg" style={{ fontSize: 14 }}>
                  Save Search
                </h3>
                <div>
                  <label className="nm-body" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Search Name
                  </label>
                  <input
                    type="text"
                    className="nm-input"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="e.g., Boston MGH Private Room"
                    style={{ width: '100%' }}
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="nm-pill"
                    style={{ flex: 1, fontSize: 11 }}
                    onClick={() => setShowSaveModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="nm-pill nm-pill--active"
                    style={{ flex: 2, fontSize: 11 }}
                    onClick={handleSaveCurrentSearch}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Search'}
                  </button>
                </div>
              </div>
            </NeumoCard>
          </div>
        </>
      )}

      {/* Searches List */}
      {searches.length === 0 ? (
        <NeumoCard>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
            <p className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 6 }}>
              No saved searches
            </p>
            <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
              Save your favorite searches for quick access
            </p>
          </div>
        </NeumoCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {searches.map((search) => (
            <NeumoCard key={search.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 className="nm-heading-lg" style={{ fontSize: 13, marginBottom: 4 }}>
                      {search.name}
                    </h4>
                    <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatFilterSummary(search.filters)}
                    </p>
                  </div>
                  {search.alertEnabled && (
                    <span style={{ fontSize: 16, flexShrink: 0, marginLeft: 8 }}>
                      🔔
                    </span>
                  )}
                </div>

                {/* Result Count */}
                {search.resultCount > 0 && (
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: 'rgba(20,184,166,0.1)',
                      border: '1px solid rgba(20,184,166,0.3)',
                    }}
                  >
                    <p className="nm-body" style={{ fontSize: 10, color: '#14B8A6' }}>
                      {search.resultCount} listings found
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="nm-pill"
                    style={{ fontSize: 10, color: '#ef4444' }}
                    onClick={() => handleDeleteSearch(search.id, search.name)}
                  >
                    Delete
                  </button>
                  <button
                    className="nm-pill nm-pill--active"
                    style={{ flex: 1, fontSize: 11 }}
                    onClick={() => handleApplySearch(search)}
                  >
                    Apply Search
                  </button>
                </div>
              </div>
            </NeumoCard>
          ))}
        </div>
      )}
    </div>
  )
}
