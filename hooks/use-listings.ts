'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'
import type { CreateListingResponse, Listing, ListListingsResponse } from '@/lib/api/types'
import { useAuthStore } from '@/store/auth-store'

export const listingsQueryKey = ['listings'] as const
export const myListingsQueryKey = ['my-listings'] as const

export interface ListingsFilters {
  city?: string
  minPrice?: number
  maxPrice?: number
}

const buildListingsUrl = (filters: ListingsFilters, cursor?: string) => {
  const params = new URLSearchParams()
  if (filters.city) params.set('city', filters.city)
  if (filters.minPrice !== undefined) params.set('min_price', String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set('max_price', String(filters.maxPrice))
  if (cursor) params.set('after', cursor)

  const query = params.toString()
  return query ? `/listings?${query}` : '/listings'
}

/** The public feed, paginated with the backend's cursor (`next_cursor`/`after`). */
export function useListings(filters: ListingsFilters = {}) {
  return useInfiniteQuery({
    queryKey: [...listingsQueryKey, filters],
    queryFn: ({ pageParam }: { pageParam?: string }) => apiFetch<ListListingsResponse>(buildListingsUrl(filters, pageParam)),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.next_cursor ?? undefined,
  })
}

/** One listing. Public, so a detail page stays shareable. */
export function useListing(id: string) {
  return useQuery({
    queryKey: [...listingsQueryKey, id],
    queryFn: () => apiFetch<Listing>(`/listings/${id}`),
    enabled: Boolean(id),
  })
}

/** The caller's own listings, including ones still `processing`. */
export function useMyListings() {
  const token = useAuthStore(state => state.token)
  const hasHydrated = useAuthStore(state => state.hasHydrated)

  return useQuery({
    queryKey: myListingsQueryKey,
    queryFn: async () => {
      const page = await apiFetch<ListListingsResponse>('/me/listings', { token })
      return page.data
    },
    enabled: hasHydrated && Boolean(token),
  })
}

export interface CreateListingInput {
  title: string
  description: string
  city: string
  /** Integer paise — the caller converts from rupees. */
  price: number
  /** R2 keys of photos already uploaded by `useImageUploads`. */
  imageKeys: string[]
}

/**
 * Finalise: the last of the three upload steps.
 *
 * Presign and PUT already happened — `useImageUploads` runs them the moment the
 * user picks a photo, so the bytes are in R2 well before Submit and all that is
 * left here is one JSON POST carrying the keys. The API HEADs every object
 * before writing anything, so a half-finished upload cannot become a listing.
 */
export function useCreateListing() {
  const token = useAuthStore(state => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ title, description, city, price, imageKeys }: CreateListingInput) =>
      apiFetch<CreateListingResponse>('/listings', {
        method: 'POST',
        token,
        body: {
          title,
          description,
          city,
          price,
          image_keys: imageKeys,
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listingsQueryKey }),
        queryClient.invalidateQueries({ queryKey: myListingsQueryKey }),
      ])
    },
  })
}

export function useDeleteListing() {
  const token = useAuthStore(state => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiFetch<null>(`/listings/${id}`, { method: 'DELETE', token }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listingsQueryKey }),
        queryClient.invalidateQueries({ queryKey: myListingsQueryKey }),
      ])
    },
  })
}
