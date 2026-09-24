import { Skeleton } from '@/components/ui/skeleton'

export const ListingsGridSkeleton = () => {
  return (
    <section className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12'>
      <div className='flex flex-col gap-8'>
        <Skeleton className='h-[76px] w-full rounded-3xl' />
        <Skeleton className='h-4 w-48' />

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className='flex flex-col gap-3'>
              <Skeleton className='aspect-[4/3] w-full rounded-4xl' />
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-3 w-full' />
              <Skeleton className='h-3 w-1/2' />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
