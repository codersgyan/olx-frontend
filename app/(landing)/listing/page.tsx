import { Suspense } from 'react'
import type { Metadata } from 'next'

import { COMPANY_NAME } from '@/lib/constants'
import { AllListings } from './all-listings'
import { ListingsHeader } from './listings-header'
import { ListingsGridSkeleton } from './listings-skeleton'

export const metadata: Metadata = {
  title: `Browse listings · ${COMPANY_NAME}`,
  description: 'Search and filter gadgets and electronics listed by the community — by city, budget, or keyword.',
}

export default function Listings() {
  return (
    <>
      <ListingsHeader />
      {/* AllListings reads useSearchParams; the boundary keeps the shell static. */}
      <Suspense fallback={<ListingsGridSkeleton />}>
        <AllListings />
      </Suspense>
    </>
  )
}
