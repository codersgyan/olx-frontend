'use client'

import { useCallback, useEffect, useState } from 'react'
import { Expand, Heart, ImageOff } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: string[]
  title: string
}

const overlayButton =
  'bg-background/70 text-foreground backdrop-blur-md ring-1 ring-foreground/10 shadow-sm hover:bg-background'

export const ProductGallery = ({ images, title }: ProductGalleryProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const hasImages = images.length > 0
  const hasMultiple = images.length > 1

  // Keep the thumbnail rail in sync with the carousel. Only the carousel drives
  // `current`; thumbnails call `scrollTo`, which fires `select` and closes the loop.
  useEffect(() => {
    if (!api) return

    const handleSelect = () => setCurrent(api.selectedScrollSnap())

    handleSelect()
    api.on('select', handleSelect)
    api.on('reInit', handleSelect)

    return () => {
      api.off('select', handleSelect)
      api.off('reInit', handleSelect)
    }
  }, [api])

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index)
      setCurrent(index)
    },
    [api],
  )

  if (!hasImages) {
    return (
      <div className='bg-muted text-muted-foreground ring-foreground/5 flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-4xl ring-1'>
        <ImageOff className='size-8' strokeWidth={1.5} />
        <span className='text-sm'>No photos provided</span>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4 lg:flex-row-reverse lg:gap-5'>
      {/* Main image */}
      <div className='ring-foreground/5 relative min-w-0 flex-1 overflow-hidden rounded-4xl ring-1'>
        <Carousel setApi={setApi} opts={{ loop: hasMultiple }}>
          <CarouselContent className='ml-0'>
            {images.map((src, index) => (
              <CarouselItem key={`${src}-${index}`} className='pl-0'>
                <div className='bg-muted aspect-square w-full overflow-hidden'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${title} — photo ${index + 1} of ${images.length}`}
                    className='size-full object-cover'
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {hasMultiple && (
            <>
              <CarouselPrevious className={cn('left-3 size-9 sm:left-4', overlayButton)} />
              <CarouselNext className={cn('right-3 size-9 sm:right-4', overlayButton)} />
            </>
          )}
        </Carousel>

        {/* Top-left counter */}
        {hasMultiple && (
          <span className='bg-background/70 text-foreground ring-foreground/10 pointer-events-none absolute top-3 left-3 z-10 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ring-1 backdrop-blur-md sm:top-4 sm:left-4'>
            {current + 1} / {images.length}
          </span>
        )}

        {/* Top-right actions */}
        <div className='absolute top-3 right-3 z-10 flex items-center gap-2 sm:top-4 sm:right-4'>
          <Button
            variant='ghost'
            size='icon'
            className={cn('rounded-full', overlayButton)}
            onClick={() => setIsWishlisted(!isWishlisted)}
            aria-pressed={isWishlisted}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('size-4 transition-colors', isWishlisted && 'fill-destructive text-destructive')} />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className={cn('rounded-full', overlayButton)}
            onClick={() => setLightboxOpen(true)}
            aria-label='View photo full screen'
          >
            <Expand className='size-4' />
          </Button>
        </div>

        {/* Dots */}
        {hasMultiple && (
          <div className='absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5 sm:bottom-4'>
            {images.map((src, index) => (
              <button
                key={`dot-${src}-${index}`}
                type='button'
                onClick={() => scrollTo(index)}
                aria-label={`Go to photo ${index + 1}`}
                aria-current={current === index}
                className={cn(
                  'h-1.5 rounded-full ring-1 ring-black/5 backdrop-blur-md transition-all',
                  current === index ? 'bg-foreground w-5' : 'bg-background/70 hover:bg-background w-1.5',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail rail */}
      {hasMultiple && (
        <div className='-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-x-visible lg:px-0 lg:pb-0'>
          {images.map((src, index) => (
            <button
              key={`thumb-${src}-${index}`}
              type='button'
              onClick={() => scrollTo(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={current === index}
              className={cn(
                'ring-offset-background bg-muted size-16 shrink-0 cursor-pointer overflow-hidden rounded-2xl ring-offset-2 transition-all sm:size-20 lg:size-[72px]',
                current === index
                  ? 'ring-foreground ring-2'
                  : 'ring-foreground/10 hover:ring-foreground/30 opacity-70 ring-1 hover:opacity-100',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${title} thumbnail ${index + 1}`} className='size-full object-cover' />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className='max-w-[calc(100%-2rem)] bg-transparent p-0 shadow-none ring-0 sm:max-w-4xl'>
          <DialogTitle className='sr-only'>{title} — photo viewer</DialogTitle>
          <div className='bg-background overflow-hidden rounded-4xl'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[current]}
              alt={`${title} — photo ${current + 1} of ${images.length}`}
              className='max-h-[80vh] w-full object-contain'
            />
          </div>
          {hasMultiple && (
            <div className='flex items-center justify-center gap-2'>
              {images.map((src, index) => (
                <button
                  key={`lightbox-dot-${src}-${index}`}
                  type='button'
                  onClick={() => scrollTo(index)}
                  aria-label={`Go to photo ${index + 1}`}
                  aria-current={current === index}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    current === index ? 'bg-foreground w-5' : 'bg-foreground/30 hover:bg-foreground/60 w-1.5',
                  )}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
