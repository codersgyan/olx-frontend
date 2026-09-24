import type { Metadata } from 'next'

import { ProductOverview } from '@/app/(landing)/listing/[id]/product-overview'
import { RelatedListings } from '@/app/(landing)/listing/[id]/related-listings'
import { API_BASE_URL } from '@/lib/api/client'
import { imageUrls, type Listing } from '@/lib/api/types'
import { COMPANY_NAME } from '@/lib/constants'

interface ListingDetailsPageProps {
  params: Promise<{ id: string }>
}

// Runs on the server, where the auth store does not exist — which is fine, since
// GET /listings/{id} is public. Crawlers and link unfurlers only ever see this,
// so it fetches independently of the client-side query below.
export async function generateMetadata({ params }: ListingDetailsPageProps): Promise<Metadata> {
  const { id } = await params

  let listing: Listing | null = null
  try {
    const response = await fetch(`${API_BASE_URL}/listings/${id}`, { cache: 'no-store' })
    if (response.ok) listing = (await response.json()) as Listing
  } catch {
    // Metadata is not worth failing a page render over. A 404, a malformed id,
    // or an API that is simply down all fall through to the generic title.
  }

  if (!listing) {
    return { title: `Listing · ${COMPANY_NAME}` }
  }

  return {
    title: `${listing.title} · ${COMPANY_NAME}`,
    description: listing.description,
    openGraph: {
      title: listing.title,
      description: listing.description,
      images: imageUrls(listing).slice(0, 1),
    },
  }
}

export default async function ListingDetails({ params }: ListingDetailsPageProps) {
  const { id } = await params

  return (
    <>
      <ProductOverview id={id} />
      <RelatedListings currentId={id} />
    </>
  )
}
