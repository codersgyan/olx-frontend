import type { ListingsFilters } from '@/hooks/use-listings'
import type { Listing } from '@/lib/api/types'

export const PRICE_ITEMS: Record<string, string> = {
  all: 'Any price',
  'under-10k': 'Under ₹10,000',
  '10k-50k': '₹10,000 – ₹50,000',
  'over-50k': 'Over ₹50,000',
}

export const DEFAULTS = { q: '', city: 'all', price: 'all' } as const

// Prices are stored in paise (rupees × 100). Bounds are inclusive, matching
// the backend's `min_price`/`max_price` (`price >= min AND price <= max`).
const PRICE_RANGES: Record<string, ListingsFilters> = {
  'under-10k': { maxPrice: 999_999 },
  '10k-50k': { minPrice: 1_000_000, maxPrice: 4_999_999 },
  'over-50k': { minPrice: 5_000_000 },
}

/** Turns the toolbar's `city`/`price` selections into server query filters. */
export const toListingsFilters = (city: string, price: string): ListingsFilters => ({
  ...(city !== DEFAULTS.city && { city }),
  ...PRICE_RANGES[price],
})

/**
 * Ids of the most recently created listings, used for the "New" chip. The
 * API already orders newest-first, so this just takes the lead of whatever
 * page is passed in.
 */
export const getNewestIds = (listings: Listing[], count = 3): Set<string> =>
  new Set(listings.slice(0, count).map(listing => listing.id))

export const getCities = (listings: Listing[]): string[] =>
  [...new Set(listings.map(listing => listing.city))].sort()

/**
 * The backend has no full-text search, so the query box only filters
 * whatever pages have already been loaded — it will not reach into listings
 * behind an unfetched cursor.
 */
export const filterListings = (listings: Listing[], query: string): Listing[] => {
  const term = query.trim().toLowerCase()
  if (!term) return listings

  return listings.filter(listing =>
    `${listing.title} ${listing.description} ${listing.city}`.toLowerCase().includes(term),
  )
}
