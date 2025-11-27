import { create } from 'zustand'

export type RoomType = 'any' | 'private-room' | 'entire-place' | 'shared'
export type ContractLength = 'any' | 4 | 8 | 13
export type Amenity =
  | 'parking'
  | 'pets'
  | 'washer-dryer'
  | 'wifi'
  | 'private-bath'
  | 'desk'
  | 'cleaning'
  | 'kitchenette'
  | 'security'

export interface SearchFilters {
  location: string
  startDate: string
  endDate: string
  maxBudget: number | null
  roomType: RoomType
  maxMinutes: number | null
  onlyVerified: boolean
  contractLength: ContractLength
  guests: number
  amenities: Amenity[]
}

interface SearchState {
  filters: SearchFilters
  setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void
  setFilters: (filters: SearchFilters) => void
  resetFilters: () => void
}

const defaultFilters: SearchFilters = {
  location: '',
  startDate: '',
  endDate: '',
  maxBudget: null,
  roomType: 'any',
  maxMinutes: 20,
  onlyVerified: false,
  contractLength: 'any',
  guests: 1,
  amenities: [],
}

export const useSearchStore = create<SearchState>((set) => ({
  filters: { ...defaultFilters },
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}))
