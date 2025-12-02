import type { Listing } from '../types'

export function listingMatchesAvailability(
  listing: Listing,
  startDate: string,
  endDate: string,
): boolean {
  if (!startDate || !endDate) return true
  if (!listing.availability || listing.availability.length === 0) return true

  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return true

  return listing.availability.some(({ start: windowStart, end: windowEnd }) => {
    const windowStartMs = new Date(windowStart).getTime()
    const windowEndMs = new Date(windowEnd).getTime()
    if (Number.isNaN(windowStartMs) || Number.isNaN(windowEndMs)) return true
    return start >= windowStartMs && end <= windowEndMs
  })
}
