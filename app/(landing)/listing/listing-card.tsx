'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Heart, MapPin } from 'lucide-react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { ImageCarousel } from '@/components/image-carousel'
import { imageUrls, type Listing } from '@/lib/api/types'
import { cn, formatListedDate, formatPrice } from '@/lib/utils'

interface ListingCardProps {
  listing: Listing
  isNew?: boolean
}

export const ListingCard = ({ listing, isNew = false }: ListingCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false)

  const toggleWishlist = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsWishlisted(current => !current)
  }

  return (
    <Link href={`/listing/${listing.id}`} className='group block h-full'>
      <Card className='h-full gap-0 overflow-hidden py-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
        {/* Media */}
        <div className='relative overflow-hidden'>
          <ImageCarousel
            images={imageUrls(listing)}
            alt={listing.title}
            className='aspect-[4/3] w-full rounded-none'
            imageClassName='transition-transform duration-500 group-hover:scale-105'
          />

          {/* Scrim so the overlaid price stays legible on light photos */}
          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black/75 via-black/25 to-transparent' />

          {isNew && (
            <span className='bg-background/85 text-foreground ring-foreground/10 absolute top-3 left-3 z-10 rounded-full px-2.5 py-1 text-xs font-medium ring-1 backdrop-blur-md'>
              New
            </span>
          )}

          <button
            type='button'
            onClick={toggleWishlist}
            aria-pressed={isWishlisted}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={cn(
              'bg-background/85 text-foreground ring-foreground/10 absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full ring-1 backdrop-blur-md transition-all',
              'hover:bg-background focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
              isWishlisted && 'opacity-100 sm:opacity-100',
            )}
          >
            <Heart className={cn('size-4', isWishlisted && 'fill-destructive text-destructive')} />
          </button>

          <p className='pointer-events-none absolute bottom-3 left-4 z-10 text-lg font-semibold text-white drop-shadow-sm'>
            {formatPrice(listing.price)}
          </p>
        </div>

        {/* Meta */}
        <CardContent className='flex flex-col gap-2 py-4'>
          <CardTitle className='line-clamp-1 text-base font-semibold capitalize'>{listing.title}</CardTitle>

          <p className='text-muted-foreground line-clamp-2 text-sm'>{listing.description}</p>

          <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
            <span className='flex items-center gap-1'>
              <MapPin className='size-3.5' />
              <span className='capitalize'>{listing.city}</span>
            </span>
            <span className='flex items-center gap-1'>
              <CalendarDays className='size-3.5' />
              {formatListedDate(listing.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
