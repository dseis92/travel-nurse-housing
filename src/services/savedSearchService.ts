import { supabase } from '../lib/supabaseClient'

export interface SearchFilters {
  city?: string
  state?: string
  hospitalName?: string
  maxBudget?: number
  roomType?: 'private-room' | 'entire-place' | 'shared'
  startDate?: string
  endDate?: string
  amenities?: string[]
  mapBounds?: {
    north: number
    south: number
    east: number
    west: number
  }
}

export interface SavedSearch {
  id: string
  userId: string
  name: string
  filters: SearchFilters
  alertEnabled: boolean
  alertFrequency: 'instant' | 'daily' | 'weekly'
  lastAlertSentAt?: string
  resultCount: number
  lastCheckedAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateSavedSearchInput {
  name: string
  filters: SearchFilters
  alertEnabled?: boolean
  alertFrequency?: 'instant' | 'daily' | 'weekly'
}

export interface UpdateSavedSearchInput {
  name?: string
  filters?: SearchFilters
  alertEnabled?: boolean
  alertFrequency?: 'instant' | 'daily' | 'weekly'
}

export const savedSearchService = {
  /**
   * Get all saved searches for current user
   */
  async getSavedSearches(): Promise<SavedSearch[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      filters: row.filters as SearchFilters,
      alertEnabled: row.alert_enabled,
      alertFrequency: row.alert_frequency,
      lastAlertSentAt: row.last_alert_sent_at,
      resultCount: row.result_count,
      lastCheckedAt: row.last_checked_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  },

  /**
   * Create a new saved search
   */
  async createSavedSearch(input: CreateSavedSearchInput): Promise<SavedSearch> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: user.id,
        name: input.name,
        filters: input.filters,
        alert_enabled: input.alertEnabled || false,
        alert_frequency: input.alertFrequency || 'daily',
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      filters: data.filters as SearchFilters,
      alertEnabled: data.alert_enabled,
      alertFrequency: data.alert_frequency,
      lastAlertSentAt: data.last_alert_sent_at,
      resultCount: data.result_count,
      lastCheckedAt: data.last_checked_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  /**
   * Update a saved search
   */
  async updateSavedSearch(id: string, input: UpdateSavedSearchInput): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const updateData: any = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.filters !== undefined) updateData.filters = input.filters
    if (input.alertEnabled !== undefined) updateData.alert_enabled = input.alertEnabled
    if (input.alertFrequency !== undefined) updateData.alert_frequency = input.alertFrequency

    const { error } = await supabase
      .from('saved_searches')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  /**
   * Update result count for a saved search
   */
  async updateResultCount(id: string, count: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('saved_searches')
      .update({
        result_count: count,
        last_checked_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  /**
   * Apply a saved search (returns filters to use)
   */
  async applySavedSearch(id: string): Promise<SearchFilters> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('saved_searches')
      .select('filters')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    if (!data) throw new Error('Saved search not found')

    return data.filters as SearchFilters
  },
}
