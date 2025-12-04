export type ListingRow = {
  id: number
  title: string
  city: string
  state: string
  hospital_name: string
  hospital_city: string
  hospital_state: string
  minutes_to_hospital: number
  price_per_month: number
  room_type: 'private-room' | 'entire-place' | 'shared'
  rating: number | null
  review_count: number | null
  image_url: string | null
  tags: string[] | null
  perks: string[] | null
  is_verified_host: boolean | null
  available_from: string | null
  ideal_contract_lengths: string[] | null
  host_id: string | null
}

export type BookingRow = {
  id: number
  listing_id: number
  guest_name: string | null
  guest_email: string
  guest_phone: string | null
  start_date: string
  end_date: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  created_at: string
}

// Domain-level models used throughout the app and in service scaffolding.
export type UserRole = 'nurse' | 'host'

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

export type UserProfile = {
  id: string
  role: UserRole
  name: string
  email: string
  phone?: string
  licenseStatus?: VerificationStatus
  hostVerificationStatus?: VerificationStatus
  avatarUrl?: string
  specialties?: string[]
  preferredCities?: string[]
  bio?: string
  createdAt?: string
  lastActiveAt?: string
}

export type Listing = {
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
  hostId?: string
  // New attributes for upcoming features
  verifiedHost?: boolean
  allowsPets?: boolean
  parking?: 'street' | 'garage' | 'driveway' | 'none'
  safetyFeatures?: string[]
  coordinates?: { lat: number; lng: number }
  latitude?: number
  longitude?: number
  contractLengths?: number[]
  availability?: Array<{ start: string; end: string }>
  availableFrom?: string
  availableTo?: string
  // Smart matching
  matchScore?: {
    overall: number
    breakdown: {
      location: number
      price: number
      amenities: number
      availability: number
    }
    reasons: string[]
    isPerfectMatch: boolean
  }
}

export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export type Booking = {
  id: string
  listingId: number
  guestId: string
  startDate: string
  endDate: string
  status: BookingStatus
  createdAt: string
  holdExpiresAt?: string
  totalPrice?: number
  payout?: number
}

export type Message = {
  id: string
  threadId: string
  senderId: string
  body: string
  createdAt: string
  attachments?: string[]
  isSystem?: boolean
}

export type MessageThread = {
  id: string
  listingId?: number
  participantIds: string[]
  lastMessage?: Message
  unreadCount?: number
}

export type PaymentQuote = {
  subtotal: number
  platformFee: number
  hostPayout: number
  currency: string
}

export type Hospital = {
  id: number
  name: string
  city: string
  state: string
  address: string
  latitude: number
  longitude: number
  traumaLevel?: 'I' | 'II' | 'III' | 'IV' | 'V'
  bedCount?: number
  facilityType: 'Academic Medical Center' | 'Community Hospital' | 'Critical Access' | 'Specialty Hospital'
  specialties: string[]
  isTeachingHospital: boolean
  rating?: number
  reviewCount?: number
  openPositions?: number
  averagePayRate?: number
  imageUrl?: string
}

export type HospitalReview = {
  id: string
  hospitalId: number
  nurseName: string
  rating: number
  specialty: string
  contractLength: string
  createdAt: string
  wouldRecommend: boolean
  pros: string[]
  cons: string[]
  comment?: string
}
