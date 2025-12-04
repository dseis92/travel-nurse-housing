import { useState, useEffect } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import { savedSearchService, type SavedSearch } from '../../services/savedSearchService'
import toast from 'react-hot-toast'

export function SearchAlerts() {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

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
      toast.error('Failed to load search alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAlert = async (searchId: string, currentEnabled: boolean) => {
    try {
      setUpdating(searchId)
      await savedSearchService.updateSavedSearch(searchId, {
        alertEnabled: !currentEnabled,
      })
      toast.success(currentEnabled ? 'Alert disabled' : 'Alert enabled')
      await loadSearches()
    } catch (error: any) {
      console.error('Error toggling alert:', error)
      toast.error('Failed to update alert')
    } finally {
      setUpdating(null)
    }
  }

  const handleUpdateFrequency = async (
    searchId: string,
    frequency: 'instant' | 'daily' | 'weekly'
  ) => {
    try {
      setUpdating(searchId)
      await savedSearchService.updateSavedSearch(searchId, {
        alertFrequency: frequency,
      })
      toast.success('Alert frequency updated')
      await loadSearches()
    } catch (error: any) {
      console.error('Error updating frequency:', error)
      toast.error('Failed to update frequency')
    } finally {
      setUpdating(null)
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'instant':
        return '⚡ Instant'
      case 'daily':
        return '📅 Daily'
      case 'weekly':
        return '📆 Weekly'
      default:
        return frequency
    }
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
            Loading alerts...
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

  const alertCount = searches.filter(s => s.alertEnabled).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ paddingLeft: 4 }}>
        <h3 className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 2 }}>
          Search Alerts
        </h3>
        <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
          {alertCount > 0
            ? `${alertCount} active alert${alertCount !== 1 ? 's' : ''}`
            : 'Get notified when new listings match your searches'}
        </p>
      </div>

      {/* Alerts List */}
      {searches.length === 0 ? (
        <NeumoCard>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🔔</p>
            <p className="nm-heading-lg" style={{ fontSize: 14, marginBottom: 6 }}>
              No saved searches
            </p>
            <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
              Save a search first to enable alerts
            </p>
          </div>
        </NeumoCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {searches.map((search) => (
            <NeumoCard key={search.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Header with Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 className="nm-heading-lg" style={{ fontSize: 12, marginBottom: 4 }}>
                      {search.name}
                    </h4>
                    <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                      {search.alertEnabled
                        ? `Receiving ${search.alertFrequency} alerts`
                        : 'Alerts disabled'}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <label
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: 44,
                      height: 24,
                      flexShrink: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={search.alertEnabled}
                      onChange={() => handleToggleAlert(search.id, search.alertEnabled)}
                      disabled={updating === search.id}
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0,
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        cursor: updating === search.id ? 'not-allowed' : 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: search.alertEnabled
                          ? 'linear-gradient(135deg, #14B8A6, #10b981)'
                          : '#cbd5e1',
                        borderRadius: 24,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          content: '',
                          height: 18,
                          width: 18,
                          left: search.alertEnabled ? 23 : 3,
                          bottom: 3,
                          background: 'white',
                          borderRadius: '50%',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      />
                    </span>
                  </label>
                </div>

                {/* Frequency Selector */}
                {search.alertEnabled && (
                  <div>
                    <p className="nm-body" style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>
                      Alert Frequency
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(['instant', 'daily', 'weekly'] as const).map((freq) => (
                        <button
                          key={freq}
                          className={`nm-pill ${search.alertFrequency === freq ? 'nm-pill--active' : ''}`}
                          style={{ fontSize: 10 }}
                          onClick={() => handleUpdateFrequency(search.id, freq)}
                          disabled={updating === search.id}
                        >
                          {getFrequencyLabel(freq)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Alert Info */}
                {search.alertEnabled && search.lastAlertSentAt && (
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: 'rgba(148,163,184,0.05)',
                      border: '1px solid rgba(148,163,184,0.15)',
                    }}
                  >
                    <p className="nm-body" style={{ fontSize: 9, color: '#6b7280' }}>
                      Last alert sent:{' '}
                      {new Date(search.lastAlertSentAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </NeumoCard>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div
        style={{
          padding: 12,
          borderRadius: 12,
          background: 'rgba(251,146,60,0.1)',
          border: '1px solid rgba(251,146,60,0.3)',
        }}
      >
        <p className="nm-body" style={{ fontSize: 10, color: '#f97316', lineHeight: 1.5 }}>
          💡 <strong>Tip:</strong> Alerts will notify you via email when new listings match your saved search criteria.
        </p>
      </div>
    </div>
  )
}
