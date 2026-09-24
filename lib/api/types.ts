/**
 * Mirrors the DTOs in olx-api/internal/handlers. Field names are the wire names
 * (snake_case) — renaming them here would just add a mapping layer that has to
 * be kept in sync by hand.
 */

export interface ApiImage {
  id: string
  position: number
  object_key: string
}

export type ListingStatus = 'processing' | 'ready' | 'rejected' | (string & {})

export interface Listing {
  id: string
  user_id: string
  title: string
  description: string
  /** Integer paise (rupees × 100). Format with `formatPrice`. */
  price: number
  city: string
  status: ListingStatus
  images: ApiImage[]
  created_at: string
}

export interface Me {
  id: string
  name: string
  email: string
  created_at: string
}

export interface SigninResponse {
  token: string
  expiresIn: number
}

export interface SignupResponse {
  id: string
  created_at: string
}

export interface PresignedUpload {
  upload_url: string
  object_key: string
  expires_at: string
}

export interface PresignResponse {
  uploads: PresignedUpload[]
}

export interface ListListingsResponse {
  data: Listing[]
  next_cursor: string | null
}

export interface CreateListingResponse {
  id: string
  title: string
  status: ListingStatus
  created_at: string
}

const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

export const imageUrls = (listing: Listing): string[] =>
  listing.status !== 'ready' || !r2PublicUrl
    ? []
    : (listing.images ?? []).map(image => `${r2PublicUrl}/listings/${listing.id}/${image.object_key}`)
