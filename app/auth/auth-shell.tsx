import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Check } from 'lucide-react'
import Logo from '@/assets/logo/logo'
import { ModeToggle } from '@/components/mode-toggle'
import { cn } from '@/lib/utils'

interface AuthShellProps {
  image: string
  imageAlt: string
  headline: string
  points: string[]
  children: React.ReactNode
}

export const AuthShell = ({ image, imageAlt, headline, points, children }: AuthShellProps) => {
  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      {/* Form column */}
      <div
        className={cn(
          'relative isolate flex flex-col gap-8 p-6 sm:p-10',
          'before:absolute before:top-0 before:h-2/3 before:w-full before:rounded-full before:bg-linear-to-r before:blur-3xl',
          'before:from-sky-100 before:via-white before:to-amber-100 before:-z-10',
          'dark:before:from-sky-400/10 dark:before:via-black dark:before:to-amber-300/10',
        )}
      >
        <header className='flex items-center justify-between gap-4'>
          <Link href='/' aria-label="Coder's Shop home" className='transition-opacity hover:opacity-80'>
            <Logo />
          </Link>
          <ModeToggle />
        </header>

        <main className='flex flex-1 items-center justify-center'>
          <div className='flex w-full max-w-md flex-col gap-6'>
            <Link
              href='/'
              className='text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm transition-colors'
            >
              <ArrowLeft className='size-4' />
              Back to home
            </Link>
            {children}
          </div>
        </main>

        <footer className='text-center'>
          <p className='text-muted-foreground text-xs'>
            By continuing you agree to our{' '}
            <Link href='/terms' className='hover:text-foreground underline underline-offset-4'>
              Terms
            </Link>{' '}
            and{' '}
            <Link href='/privacy' className='hover:text-foreground underline underline-offset-4'>
              Privacy Policy
            </Link>
            .
          </p>
        </footer>
      </div>

      {/* Brand panel */}
      <div className='relative hidden lg:block'>
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes='(min-width: 1024px) 50vw, 0px'
          className='object-cover dark:brightness-[0.7]'
        />

        <div className='absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent' />

        <div className='absolute inset-x-0 bottom-0 flex flex-col gap-5 p-10 xl:p-14'>
          <p className='font-heading max-w-[18ch] text-3xl font-semibold tracking-tight text-balance text-white xl:text-4xl'>
            {headline}
          </p>

          <ul className='flex flex-col gap-2.5'>
            {points.map(point => (
              <li key={point} className='flex items-center gap-2.5 text-sm text-white/90'>
                <span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm'>
                  <Check className='size-3' />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
