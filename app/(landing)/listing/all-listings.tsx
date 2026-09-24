'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { SearchX, ServerCrash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useListings } from '@/hooks/use-listings'
import { DEFAULTS, filterListings, getCities, getNewestIds, toListingsFilters } from './filters'
import { ListingCard } from './listing-card'
import { ListingsGridSkeleton } from './listings-skeleton'
import { ListingsToolbar } from './listings-toolbar'

export const AllListings = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const city = searchParams.get('city') ?? DEFAULTS.city
  const price = searchParams.get('price') ?? DEFAULTS.price

  const filters = useMemo(() => toListingsFilters(city, price), [city, price])
  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useListings(filters)

  // City and price are filtered server-side (see `filters`). The search box
  // stays client-side, scoped to whatever pages have already loaded — the
  // backend has no full-text search.
  const listings = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data])

  // A separate, unfiltered sample just to populate the city dropdown — the
  // backend has no "list distinct cities" endpoint, so this asks for a plain
  // page of listings and derives the options from it.
  const { data: citySample } = useListings()
  const cities = useMemo(() => getCities(citySample?.pages.flatMap(page => page.data) ?? []), [citySample])

  // The search box stays local so typing filters instantly; the URL is mirrored
  // on a debounce. (Back/forward will not rewrite this input — accepted tradeoff,
  // since re-syncing it would require setState inside an effect, which this
  // repo's eslint config rejects.)
  const [query, setQuery] = useState(() => searchParams.get('q') ?? DEFAULTS.q)

  const commit = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === DEFAULTS[key as keyof typeof DEFAULTS]) params.delete(key)
        else params.set(key, value)
      }

      const search = params.toString()
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  // Debounce the URL write so every keystroke doesn't push a history entry.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => commit({ q: value }), 300)
    },
    [commit],
  )

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const handleClearAll = useCallback(() => {
    setQuery(DEFAULTS.q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.replace(pathname, { scroll: false })
  }, [pathname, router])

  const newestIds = useMemo(() => getNewestIds(listings), [listings])
  const results = useMemo(() => filterListings(listings, query), [listings, query])

  const isFiltered = Boolean(query.trim()) || city !== DEFAULTS.city || price !== DEFAULTS.price

  if (isPending) {
    return <ListingsGridSkeleton />
  }

  if (isError) {
    return (
      <section className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12'>
        <Empty className='border-border bg-card/50 border'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <ServerCrash />
            </EmptyMedia>
            <EmptyTitle>Couldn&apos;t load listings</EmptyTitle>
            <EmptyDescription>{error.message}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant='outline' className='rounded-full' onClick={() => refetch()}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      </section>
    )
  }

  return (
    <section className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12'>
      <div className='flex flex-col gap-6'>
        <ListingsToolbar
          query={query}
          city={city}
          price={price}
          cities={cities}
          onQueryChange={handleQueryChange}
          onCityChange={value => commit({ city: value })}
          onPriceChange={value => commit({ price: value })}
          onClearAll={handleClearAll}
        />

        <p className='text-muted-foreground text-sm' aria-live='polite'>
          {results.length === 0
            ? 'No listings match your filters'
            : isFiltered
              ? `Showing ${results.length} of ${listings.length} loaded listings`
              : `Showing ${listings.length} listings`}
        </p>

        {results.length === 0 ? (
          <Empty className='border-border bg-card/50 border'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>No listings found</EmptyTitle>
              <EmptyDescription>
                Nothing matches your current search and filters. Try a different keyword or widen your budget.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant='outline' className='rounded-full' onClick={handleClearAll}>
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4'>
              {results.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98], delay: Math.min(index * 0.04, 0.4) }}
                >
                  <ListingCard listing={listing} isNew={newestIds.has(listing.id)} />
                </motion.div>
              ))}
            </div>

            {hasNextPage && (
              <div className='flex justify-center'>
                <Button
                  variant='outline'
                  className='rounded-full'
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
