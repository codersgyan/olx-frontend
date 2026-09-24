'use client'

import { Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEFAULTS, PRICE_ITEMS } from './filters'

interface ListingsToolbarProps {
  query: string
  city: string
  price: string
  cities: string[]
  onQueryChange: (value: string) => void
  onCityChange: (value: string) => void
  onPriceChange: (value: string) => void
  onClearAll: () => void
}

export const ListingsToolbar = ({
  query,
  city,
  price,
  cities,
  onQueryChange,
  onCityChange,
  onPriceChange,
  onClearAll,
}: ListingsToolbarProps) => {
  const cityItems: Record<string, string> = {
    all: 'All cities',
    ...Object.fromEntries(cities.map(name => [name, name.charAt(0).toUpperCase() + name.slice(1)])),
  }

  const activeChips = [
    query.trim() && { key: 'q', label: `"${query.trim()}"`, clear: () => onQueryChange('') },
    city !== DEFAULTS.city && { key: 'city', label: cityItems[city] ?? city, clear: () => onCityChange(DEFAULTS.city) },
    price !== DEFAULTS.price && { key: 'price', label: PRICE_ITEMS[price], clear: () => onPriceChange(DEFAULTS.price) },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[]

  return (
    <div className='flex flex-col gap-4'>
      <div className='ring-foreground/5 bg-card flex flex-col gap-3 rounded-3xl p-3 shadow-sm ring-1 sm:flex-row sm:items-center'>
        {/* Search */}
        <div className='relative flex-1'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            placeholder='Search gadgets, brands or cities…'
            aria-label='Search listings'
            className='h-10 rounded-2xl border-transparent pr-9 pl-9'
          />
          {query && (
            <button
              type='button'
              onClick={() => onQueryChange('')}
              aria-label='Clear search'
              className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors'
            >
              <X className='size-4' />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className='grid grid-cols-2 gap-2 sm:flex sm:items-center'>
          <Select value={city} onValueChange={value => onCityChange(String(value))} items={cityItems}>
            <SelectTrigger aria-label='Filter by city' className='h-10 w-full rounded-2xl sm:w-auto sm:min-w-36'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(cityItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={price} onValueChange={value => onPriceChange(String(value))} items={PRICE_ITEMS}>
            <SelectTrigger aria-label='Filter by price' className='h-10 w-full rounded-2xl sm:w-auto sm:min-w-36'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRICE_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filters */}
      {activeChips.length > 0 && (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-muted-foreground text-xs'>Filters:</span>
          {activeChips.map(chip => (
            <Badge key={chip.key} variant='secondary' className='h-7 gap-1 pr-1.5 pl-2.5'>
              <span className='max-w-40 truncate'>{chip.label}</span>
              <button
                type='button'
                onClick={chip.clear}
                aria-label={`Remove ${chip.label} filter`}
                className='hover:bg-foreground/10 rounded-full p-0.5 transition-colors'
              >
                <X className='size-3' />
              </button>
            </Badge>
          ))}
          <Button variant='ghost' size='xs' onClick={onClearAll} className='text-muted-foreground hover:text-foreground'>
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
