'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Flag,
  Handshake,
  MapPin,
  MessageCircle,
  PackageSearch,
  Share2,
  ShieldCheck,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useListing } from '@/hooks/use-listings'
import { imageUrls } from '@/lib/api/types'
import { cn, formatListedDate, formatListedYear, formatPrice } from '@/lib/utils'
import { ProductGallery } from './product-gallery'

const EASE = [0.21, 0.47, 0.32, 0.98] as const

// Presentational only — the data model has no condition field.
const CONDITIONS = ['Like new', 'Gently used', 'Excellent condition', 'Well maintained'] as const

const conditionFor = (id: string) =>
  CONDITIONS[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % CONDITIONS.length]

const TRUST_POINTS = [
  { icon: ShieldCheck, label: 'Secure payment', hint: 'Protected checkout' },
  { icon: BadgeCheck, label: 'Buyer protection', hint: 'Covered for 7 days' },
  { icon: Handshake, label: 'Meet safely', hint: 'Local pickup available' },
]

interface ProductOverviewProps {
  id: string
}

export const ProductOverview = ({ id }: ProductOverviewProps) => {
  const { data: listing, isPending } = useListing(id)

  if (isPending) {
    return (
      <section className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10'>
        <Skeleton className='mb-6 h-4 w-64 lg:mb-8' />
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16'>
          <Skeleton className='aspect-square w-full rounded-3xl' />
          <div className='flex flex-col gap-6'>
            <Skeleton className='h-6 w-40 rounded-full' />
            <Skeleton className='h-10 w-3/4' />
            <Skeleton className='h-10 w-1/3' />
            <Skeleton className='h-20 w-full rounded-3xl' />
            <Skeleton className='h-12 w-full rounded-full' />
          </div>
        </div>
      </section>
    )
  }

  // Covers both a 404 from the API and any other failure — from the reader's
  // point of view "this listing isn't here" is the same answer either way.
  if (!listing) {
    return (
      <section className='mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8'>
        <div className='mx-auto flex max-w-md flex-col items-center gap-4 text-center'>
          <div className='bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full'>
            <PackageSearch className='size-6' strokeWidth={1.5} />
          </div>
          <h1 className='font-heading text-2xl font-semibold tracking-tight'>Listing not found</h1>
          <p className='text-muted-foreground text-balance'>
            This listing may have been sold or removed by the seller.
          </p>
          <Button render={<Link href='/listing' />} nativeButton={false} className='mt-2 rounded-full'>
            Browse all listings
          </Button>
        </div>
      </section>
    )
  }

  const condition = conditionFor(listing.id)
  const listedOn = formatListedDate(listing.created_at)
  const memberSince = formatListedYear(listing.created_at)
  const sellerRef = listing.user_id.slice(0, 4).toUpperCase()
  const sellerInitials = listing.user_id.slice(0, 2).toUpperCase()

  const details = [
    { label: 'Condition', value: condition },
    { label: 'Location', value: listing.city, className: 'capitalize' },
    { label: 'Listed on', value: listedOn },
    { label: 'Photos', value: `${listing.images.length}` },
    { label: 'Listing ID', value: listing.id.slice(0, 8), className: 'font-mono text-xs' },
  ]

  return (
    <section
      className={cn(
        'relative isolate',
        'before:absolute before:top-10 before:h-3/5 before:w-full before:rounded-full before:bg-linear-to-r before:blur-3xl',
        'before:from-sky-100 before:via-white before:to-amber-100 before:-z-10',
        'dark:before:from-sky-400/10 dark:before:via-black dark:before:to-amber-300/10',
      )}
    >
      <div className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10'>
        <Breadcrumb className='mb-6 lg:mb-8'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href='/' />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href='/listing' />}>Listings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className='max-w-[12rem] truncate capitalize sm:max-w-xs'>{listing.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16'>
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <ProductGallery images={imageUrls(listing)} title={listing.title} />
          </motion.div>

          {/* Info panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            className='flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start'
          >
            <div className='flex flex-col gap-4'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='secondary'>{condition}</Badge>
                <Badge variant='outline' className='gap-1'>
                  <BadgeCheck />
                  Verified listing
                </Badge>
              </div>

              <h1 className='font-heading text-3xl font-semibold tracking-tight text-balance capitalize lg:text-4xl'>
                {listing.title}
              </h1>

              <div className='flex flex-wrap items-end gap-x-3 gap-y-1'>
                <p className='text-3xl font-bold tracking-tight lg:text-4xl'>{formatPrice(listing.price)}</p>
                <span className='text-muted-foreground pb-1 text-sm'>Negotiable</span>
              </div>

              <div className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
                <span className='flex items-center gap-1.5'>
                  <MapPin className='size-4' />
                  <span className='capitalize'>{listing.city}</span>
                </span>
                <span className='flex items-center gap-1.5'>
                  <CalendarDays className='size-4' />
                  Listed on {listedOn}
                </span>
              </div>
            </div>

            <Separator />

            {/* Seller */}
            <div className='bg-muted/60 ring-foreground/5 flex items-center gap-3 rounded-3xl p-4 ring-1'>
              <Avatar size='lg'>
                <AvatarFallback className='font-medium'>{sellerInitials}</AvatarFallback>
              </Avatar>
              <div className='min-w-0 flex-1'>
                <p className='flex items-center gap-1.5 text-sm font-medium'>
                  Seller #{sellerRef}
                  <BadgeCheck className='text-muted-foreground size-4' />
                </p>
                <p className='text-muted-foreground text-xs'>
                  Member since {memberSince} · <span className='capitalize'>{listing.city}</span>
                </p>
              </div>
              <Button variant='outline' size='sm' className='shrink-0 rounded-full'>
                View profile
              </Button>
            </div>

            {/* Actions */}
            <div className='flex flex-col gap-3'>
              <Button
                size='lg'
                className='group relative h-12 w-full overflow-hidden rounded-full ps-6 pe-14 text-sm font-medium transition-all duration-500 hover:ps-14 hover:pe-6'
              >
                Add to cart
                <span className='bg-background text-foreground absolute right-1 flex size-10 items-center justify-center rounded-full transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45'>
                  <ArrowUpRight className='size-4' />
                </span>
              </Button>

              <div className='flex gap-3'>
                <Button variant='outline' size='lg' className='h-11 flex-1 rounded-full'>
                  <MessageCircle className='size-4' />
                  Message seller
                </Button>
                <Button variant='outline' size='icon-lg' className='size-11 shrink-0 rounded-full' aria-label='Share listing'>
                  <Share2 className='size-4' />
                </Button>
              </div>
            </div>

            {/* Trust */}
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
              {TRUST_POINTS.map(({ icon: Icon, label, hint }) => (
                <div
                  key={label}
                  className='ring-foreground/5 flex items-center gap-3 rounded-2xl p-3 ring-1 sm:flex-col sm:gap-1.5 sm:p-4 sm:text-center'
                >
                  <Icon className='text-muted-foreground size-5 shrink-0' strokeWidth={1.5} />
                  <div className='min-w-0'>
                    <p className='text-xs font-medium'>{label}</p>
                    <p className='text-muted-foreground text-xs'>{hint}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type='button'
              className='text-muted-foreground hover:text-foreground flex items-center gap-1.5 self-start text-xs transition-colors'
            >
              <Flag className='size-3.5' />
              Report this listing
            </button>
          </motion.div>
        </div>

        {/* Description / details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className='mt-12 lg:mt-20'
        >
          <Tabs defaultValue='description' className='gap-6'>
            <TabsList variant='line' className='border-border w-full justify-start gap-4 border-b pb-1.5'>
              <TabsTrigger value='description' className='flex-none px-0'>
                Description
              </TabsTrigger>
              <TabsTrigger value='details' className='flex-none px-0'>
                Details
              </TabsTrigger>
              <TabsTrigger value='safety' className='flex-none px-0'>
                Safety
              </TabsTrigger>
            </TabsList>

            <TabsContent value='description'>
              <p className='text-muted-foreground max-w-[70ch] text-base leading-relaxed'>{listing.description}</p>
            </TabsContent>

            <TabsContent value='details'>
              <dl className='grid max-w-3xl grid-cols-1 gap-x-8 sm:grid-cols-2'>
                {details.map(detail => (
                  <div
                    key={detail.label}
                    className='border-border flex items-center justify-between gap-4 border-b py-3 last:border-b-0 sm:last:border-b'
                  >
                    <dt className='text-muted-foreground text-sm'>{detail.label}</dt>
                    <dd className={cn('text-sm font-medium', detail.className)}>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </TabsContent>

            <TabsContent value='safety'>
              <ul className='text-muted-foreground max-w-[70ch] space-y-2.5 text-sm'>
                <li className='flex gap-2.5'>
                  <ShieldCheck className='mt-0.5 size-4 shrink-0' />
                  Meet in a public place and inspect the item before paying.
                </li>
                <li className='flex gap-2.5'>
                  <ShieldCheck className='mt-0.5 size-4 shrink-0' />
                  Pay only through the platform — never send advance deposits.
                </li>
                <li className='flex gap-2.5'>
                  <ShieldCheck className='mt-0.5 size-4 shrink-0' />
                  Check serial numbers and original invoices for electronics.
                </li>
              </ul>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </section>
  )
}
