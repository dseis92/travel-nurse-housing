import { supabase } from '../lib/supabaseClient'
import type { Listing } from '../types'

export interface ListingRow {
  id: string
  created_at: string
  updated_at: string
  host_id: string
  title: string
  description: string | null
  city: string
  state: string
  address: string | null
  latitude: number | null
  longitude: number | null
  hospital_name: string
  hospital_city: string
  hospital_state: string
  minutes_to_hospital: number
  price_per_month: number
  room_type: 'private-room' | 'entire-place' | 'shared'
  bedrooms: number | null
  bathrooms: number | null
  max_guests: number
  tags: string[]
  perks: string[]
  safety_features: string[]
  verified_host: boolean
  allows_pets: boolean
  parking: 'street' | 'garage' | 'driveway' | 'none' | null
  available_from: string | null
  available_to: string | null
  ideal_contract_lengths: number[]
  image_url: string | null
  image_urls: string[]
  rating: number | null
  review_count: number
  is_active: boolean
  is_published: boolean
  section: string
}

export interface CreateListingInput {
  title: string
  description?: string
  city: string
  state: string
  address?: string
  latitude?: number
  longitude?: number
  hospital_name: string
  hospital_city: string
  hospital_state: string
  minutes_to_hospital: number
  price_per_month: number
  room_type: 'private-room' | 'entire-place' | 'shared'
  bedrooms?: number
  bathrooms?: number
  max_guests?: number
  tags?: string[]
  perks?: string[]
  safety_features?: string[]
  allows_pets?: boolean
  parking?: 'street' | 'garage' | 'driveway' | 'none'
  available_from?: string
  available_to?: string
  ideal_contract_lengths?: number[]
  image_url?: string
  image_urls?: string[]
  section?: string
}

export interface UpdateListingInput extends Partial<CreateListingInput> {
  is_published?: boolean
  is_active?: boolean
}

/**
 * Convert database row to Listing type
 */
function rowToListing(row: ListingRow): Listing {
  return {
    id: parseInt(row.id.replace(/-/g, '').slice(0, 8), 16), // Convert UUID to number for compatibility
    title: row.title,
    city: row.city,
    state: row.state,
    hospitalName: row.hospital_name,
    hospitalCity: row.hospital_city,
    hospitalState: row.hospital_state,
    minutesToHospital: row.minutes_to_hospital,
    pricePerMonth: row.price_per_month,
    roomType: row.room_type,
    imageUrl: row.image_url || '',
    tags: row.tags,
    perks: row.perks,
    rating: row.rating || undefined,
    reviewCount: row.review_count || undefined,
    section: row.section,
    hostId: row.host_id,
    verifiedHost: row.verified_host,
    allowsPets: row.allows_pets,
    parking: row.parking || undefined,
    safetyFeatures: row.safety_features,
    latitude: row.latitude || undefined,
    longitude: row.longitude || undefined,
    availableFrom: row.available_from || undefined,
    availableTo: row.available_to || undefined,
    contractLengths: row.ideal_contract_lengths,
  }
}

/**
 * Fetch all published, active listings
 */
export async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('is_published', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching listings:', error)
    throw error
  }

  return (data || []).map(rowToListing)
}

/**
 * Fetch a single listing by ID
 */
export async function fetchListingById(id: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching listing:', error)
    return null
  }

  return data ? rowToListing(data) : null
}

/**
 * Fetch all listings for the current host
 */
export async function fetchHostListings(): Promise<Listing[]> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching host listings:', error)
    throw error
  }

  return (data || []).map(rowToListing)
}

/**
 * Create a new listing
 */
export async function createListing(input: CreateListingInput): Promise<Listing> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      host_id: user.id,
      ...input,
      is_published: false, // Default to unpublished
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating listing:', error)
    throw error
  }

  return rowToListing(data)
}

/**
 * Update an existing listing
 */
export async function updateListing(
  listingId: string,
  input: UpdateListingInput
): Promise<Listing> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('listings')
    .update(input)
    .eq('id', listingId)
    .eq('host_id', user.id) // Ensure user owns the listing
    .select()
    .single()

  if (error) {
    console.error('Error updating listing:', error)
    throw error
  }

  return rowToListing(data)
}

/**
 * Publish a listing (make it visible to nurses)
 */
export async function publishListing(listingId: string): Promise<Listing> {
  return updateListing(listingId, { is_published: true })
}

/**
 * Unpublish a listing (hide from nurses)
 */
export async function unpublishListing(listingId: string): Promise<Listing> {
  return updateListing(listingId, { is_published: false })
}

/**
 * Deactivate a listing (soft delete)
 */
export async function deactivateListing(listingId: string): Promise<Listing> {
  return updateListing(listingId, { is_active: false })
}

/**
 * Delete a listing permanently
 */
export async function deleteListing(listingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('host_id', user.id) // Ensure user owns the listing

  if (error) {
    console.error('Error deleting listing:', error)
    throw error
  }
}

/**
 * Upload a listing image
 */
export async function uploadListingImage(
  file: File,
  listingId?: string
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Create unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${listingId || 'temp'}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('listing-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Error uploading image:', error)
    throw error
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('listing-images')
    .getPublicUrl(data.path)

  return publicUrl
}

/**
 * Delete a listing image
 */
export async function deleteListingImage(imageUrl: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Extract path from URL
  const path = imageUrl.split('/listing-images/')[1]

  if (!path) {
    throw new Error('Invalid image URL')
  }

  const { error } = await supabase.storage
    .from('listing-images')
    .remove([path])

  if (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

/**
 * Search listings by location, hospital, or other criteria
 */
export async function searchListings(query: {
  location?: string
  hospitalName?: string
  minPrice?: number
  maxPrice?: number
  roomType?: string
}): Promise<Listing[]> {
  let supabaseQuery = supabase
    .from('listings')
    .select('*')
    .eq('is_published', true)
    .eq('is_active', true)

  if (query.location) {
    supabaseQuery = supabaseQuery.or(
      `city.ilike.%${query.location}%,state.ilike.%${query.location}%`
    )
  }

  if (query.hospitalName) {
    supabaseQuery = supabaseQuery.ilike('hospital_name', `%${query.hospitalName}%`)
  }

  if (query.minPrice !== undefined) {
    supabaseQuery = supabaseQuery.gte('price_per_month', query.minPrice)
  }

  if (query.maxPrice !== undefined) {
    supabaseQuery = supabaseQuery.lte('price_per_month', query.maxPrice)
  }

  if (query.roomType) {
    supabaseQuery = supabaseQuery.eq('room_type', query.roomType)
  }

  const { data, error } = await supabaseQuery.order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching listings:', error)
    throw error
  }

  return (data || []).map(rowToListing)
}
