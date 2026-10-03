import { useEffect, useMemo, useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  cityLabel,
  filterCities,
  type City,
} from '@/lib/cities'

type CityComboboxProps = {
  cities: readonly City[]
  value: City | null
  onChange: (city: City) => void
  disabled?: boolean
  loading?: boolean
}

export function CityCombobox({
  cities,
  value,
  onChange,
  disabled = false,
  loading = false,
}: CityComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 200)
    return () => window.clearTimeout(timer)
  }, [query])

  const matches = useMemo(
    () => filterCities(cities, debouncedQuery, 50),
    [cities, debouncedQuery],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Выбор города"
          disabled={disabled || loading}
          className="h-10 w-full justify-between px-3 font-normal"
        >
          <span className="truncate">
            {loading
              ? 'Загрузка списка городов…'
              : value
                ? cityLabel(value)
                : 'Выберите город…'}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-2"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск города…"
          aria-label="Поиск города"
        />
        <ul
          className="mt-2 max-h-60 overflow-auto rounded-md border border-border"
          role="listbox"
          aria-label="Результаты поиска городов"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Ничего не найдено
            </li>
          ) : (
            matches.map((city) => (
              <li key={city.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value?.id === city.id}
                  className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                  onClick={() => {
                    onChange(city)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  {cityLabel(city)}
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
