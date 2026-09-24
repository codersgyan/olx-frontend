'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { ImageCarousel } from '@/components/image-carousel'
import { useListings } from '@/hooks/use-listings'
import { imageUrls, type Listing } from '@/lib/api/types'
import { formatPrice } from '@/lib/utils'

interface RelatedListingsProps {
  currentId: string
}

export const RelatedListings = ({ currentId }: RelatedListingsProps) => {
  const { data } = useListings()

  const listings = (data?.pages.flatMap(page => page.data) ?? [])
    .filter(listing => listing.id !== currentId)
    .slice(0, 3)

  // Renders nothing while the feed loads or if it fails — this is a secondary
  // section, and an error here should not intrude on the listing being viewed.
  if (listings.length === 0) return null

  return (
    <section className='mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20'>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className='flex flex-col gap-8'
      >
        <header className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
          <div className='flex flex-col gap-2'>
            <h2 className='font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>
              You might also like
            </h2>
            <p className='text-muted-foreground max-w-[55ch] text-balance'>
              More gadgets from the community, fresh off the listings board.
            </p>
          </div>
          <Button
            variant='outline'
            className='w-fit shrink-0 rounded-full'
            render={<Link href='/listing' />}
            nativeButton={false}
          >
            View all
            <ArrowRight className='size-4' />
          </Button>
        </header>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'>
          {listings.map((listing: Listing) => (
            <Link key={listing.id} href={`/listing/${listing.id}`} className='block'>
              <Card className='group h-full cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg'>
                <CardContent className='flex flex-col gap-4'>
                  <ImageCarousel
                    images={imageUrls(listing)}
                    alt={listing.title}
                    className='aspect-square w-full rounded-2xl'
                  />

                  <div className='flex flex-col gap-2'>
                    <CardTitle className='line-clamp-1 text-lg font-semibold text-balance capitalize'>
                      {listing.title}
                    </CardTitle>

                    <p className='text-muted-foreground line-clamp-2 text-sm'>{listing.description}</p>

                    <div className='text-muted-foreground flex items-center gap-1 text-sm'>
                      <MapPin className='size-4' />
                      <span className='capitalize'>{listing.city}</span>
                    </div>

                    <p className='text-lg font-semibold'>{formatPrice(listing.price)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
