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
