'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { LayoutGrid } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const ListingsHeader = () => {
  return (
    <section
      className={cn(
        'relative isolate',
        'before:absolute before:top-0 before:h-full before:w-full before:rounded-full before:bg-linear-to-r before:blur-3xl',
        'before:from-sky-100 before:via-white before:to-amber-100 before:-z-10',
        'dark:before:from-sky-400/10 dark:before:via-black dark:before:to-amber-300/10',
      )}
    >
      <div className='mx-auto w-full max-w-7xl px-4 pt-6 pb-2 sm:px-6 lg:px-8 lg:pt-10'>
        <Breadcrumb className='mb-6'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href='/' />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Listings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
          className='flex flex-col justify-between gap-6 sm:flex-row sm:items-end'
        >
          <div className='flex flex-col gap-3'>
            <h1 className='font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl'>
              Browse listings
            </h1>
            <p className='text-muted-foreground max-w-[55ch] text-balance'>
              Gadgets and electronics listed by the community. Search, filter by city or budget, and find your next
              upgrade.
            </p>
          </div>

          <Button
            variant='outline'
            className='w-fit shrink-0 rounded-full'
            render={<Link href='/my-listings' />}
            nativeButton={false}
          >
            <LayoutGrid className='size-4' />
            My listings
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
