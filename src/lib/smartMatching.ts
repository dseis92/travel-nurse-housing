import type { Listing } from '../types'

export interface MatchScore {
  overall: number // 0-100
  breakdown: {
    location: number // 0-25
    price: number // 0-25
    amenities: number // 0-25
    availability: number // 0-25
  }
  reasons: string[]
  isPerfectMatch: boolean // 90+ score
}

export interface UserPreferences {
  location?: string
  maxBudget?: number
  roomType?: string
  startDate?: string
  endDate?: string
  preferredAmenities?: string[]
  maxDistance?: number // miles to hospital
}

/**
 * Calculate how well a listing matches user preferences
 * Returns a score from 0-100 with breakdown
 */
export function calculateMatchScore(
  listing: Listing,
  prefs: UserPreferences
): MatchScore {
  const breakdown = {
    location: 0,
    price: 0,
    amenities: 0,
    availability: 0,
  }
  const reasons: string[] = []

  // LOCATION SCORE (0-25 points)
  if (prefs.location) {
    const searchLocation = prefs.location.toLowerCase()
    const listingCity = listing.city.toLowerCase()
    const listingState = listing.state.toLowerCase()
    const listingHospital = listing.hospitalName.toLowerCase()

    if (
      listingCity.includes(searchLocation) ||
      searchLocation.includes(listingCity) ||
      listingHospital.includes(searchLocation) ||
      searchLocation.includes(listingHospital)
    ) {
      breakdown.location = 25
      reasons.push(`Perfect location match near ${listing.hospitalName}`)
    } else if (listingState.includes(searchLocation)) {
      breakdown.location = 15
      reasons.push(`Located in your search area`)
    } else {
      breakdown.location = 5
    }
  } else {
    breakdown.location = 15 // neutral if no preference
  }

  // Distance bonus/penalty
  if (listing.minutesToHospital <= 10) {
    breakdown.location = Math.min(25, breakdown.location + 5)
    reasons.push(`Only ${listing.minutesToHospital} min to hospital`)
  }

  // PRICE SCORE (0-25 points)
  if (typeof prefs.maxBudget === 'number') {
    const budgetRatio = listing.pricePerMonth / prefs.maxBudget

    if (budgetRatio <= 0.7) {
      breakdown.price = 25
      const savings = prefs.maxBudget - listing.pricePerMonth
      reasons.push(`Great value - $${savings.toLocaleString()} under budget`)
    } else if (budgetRatio <= 0.85) {
      breakdown.price = 20
      reasons.push(`Affordable and within budget`)
    } else if (budgetRatio <= 1.0) {
      breakdown.price = 15
      reasons.push(`Within your budget`)
    } else if (budgetRatio <= 1.15) {
      breakdown.price = 5
    } else {
      breakdown.price = 0
    }
  } else {
    breakdown.price = 15 // neutral if no budget set
  }

  // AMENITIES SCORE (0-25 points)
  const desiredAmenities = prefs.preferredAmenities || []
  const listingTags = listing.tags.map((t) => t.toLowerCase())

  if (desiredAmenities.length > 0) {
    const matchedAmenities = desiredAmenities.filter((amenity) =>
      listingTags.some((tag) => tag.includes(amenity.toLowerCase()))
    )
    const amenityRatio = matchedAmenities.length / desiredAmenities.length
    breakdown.amenities = Math.round(amenityRatio * 25)

    if (amenityRatio >= 0.75) {
      reasons.push(`Has ${matchedAmenities.length} of your preferred amenities`)
    }
  } else {
    // Award points for valuable amenities even without explicit preference
    const valuableAmenities = [
      'wifi',
      'parking',
      'washer',
      'furnished',
      'gym',
      'pool',
    ]
    const hasValuable = listingTags.filter((tag) =>
      valuableAmenities.some((v) => tag.includes(v))
    )
    breakdown.amenities = Math.min(20, hasValuable.length * 4)
  }

  // Room type match bonus
  if (prefs.roomType && listing.roomType === prefs.roomType) {
    breakdown.amenities = Math.min(25, breakdown.amenities + 5)
    reasons.push(`Perfect room type match`)
  }

  // AVAILABILITY SCORE (0-25 points)
  if (prefs.startDate && prefs.endDate) {
    // Check if listing is available for the dates
    const isAvailable = listingMatchesAvailability(
      listing,
      prefs.startDate,
      prefs.endDate
    )

    if (isAvailable) {
      breakdown.availability = 25
      reasons.push(`Available for your dates`)
    } else {
      breakdown.availability = 0
    }
  } else {
    breakdown.availability = 15 // neutral if no dates
  }

  // Rating bonus
  if (listing.rating && listing.rating >= 4.8) {
    breakdown.amenities = Math.min(25, breakdown.amenities + 3)
    reasons.push(`Highly rated (${listing.rating.toFixed(1)} ⭐)`)
  }

  // "Guest favorite" bonus
  if (listing.rating && listing.reviewCount && listing.reviewCount > 10) {
    reasons.push(`Popular choice with ${listing.reviewCount} reviews`)
  }

  const overall = Math.round(
    breakdown.location +
      breakdown.price +
      breakdown.amenities +
      breakdown.availability
  )

  const isPerfectMatch = overall >= 90

  if (isPerfectMatch) {
    reasons.unshift('🎯 Perfect match for you!')
  }

  return {
    overall,
    breakdown,
    reasons: reasons.slice(0, 3), // Top 3 reasons
    isPerfectMatch,
  }
}

/**
 * Check if listing is available for given date range
 */
function listingMatchesAvailability(
  listing: Listing,
  startDate: string,
  endDate: string
): boolean {
  if (!listing.availableFrom || !listing.availableTo) {
    return true // Assume available if no dates specified
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const availFrom = new Date(listing.availableFrom)
  const availTo = new Date(listing.availableTo)

  return start >= availFrom && end <= availTo
}

/**
 * Sort listings by match score (highest first)
 */
export function sortByMatchScore(
  listings: Listing[],
  prefs: UserPreferences
): Array<Listing & { matchScore: MatchScore }> {
  return listings
    .map((listing) => ({
      ...listing,
      matchScore: calculateMatchScore(listing, prefs),
    }))
    .sort((a, b) => b.matchScore.overall - a.matchScore.overall)
}

/**
 * Get top matches (90+ score)
 */
export function getTopMatches(
  listings: Listing[],
  prefs: UserPreferences
): Array<Listing & { matchScore: MatchScore }> {
  return sortByMatchScore(listings, prefs).filter(
    (listing) => listing.matchScore.overall >= 90
  )
}

/**
 * Get match quality label
 */
export function getMatchLabel(score: number): string {
  if (score >= 90) return 'Perfect Match'
  if (score >= 75) return 'Great Match'
  if (score >= 60) return 'Good Match'
  if (score >= 40) return 'Decent Match'
  return 'Consider'
}

/**
 * Get match color
 */
export function getMatchColor(score: number): string {
  if (score >= 90) return '#10B981' // green
  if (score >= 75) return '#14B8A6' // teal
  if (score >= 60) return '#3B82F6' // blue
  if (score >= 40) return '#F59E0B' // amber
  return '#6B7280' // gray
}
