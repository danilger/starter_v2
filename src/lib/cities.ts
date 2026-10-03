export type City = {
  id: number
  name: string
  countryCode: string
  latitude: number
  longitude: number
}

const CITIES_URL = '/data/cities.json'

function isCity(value: unknown): value is City {
  if (typeof value !== 'object' || value === null) return false
  const city = value as Record<string, unknown>
  return (
    typeof city.id === 'number' &&
    typeof city.name === 'string' &&
    typeof city.countryCode === 'string' &&
    typeof city.latitude === 'number' &&
    typeof city.longitude === 'number'
  )
}

export function normalizeCities(raw: unknown): City[] {
  if (!Array.isArray(raw)) {
    throw new Error('City catalog must be a JSON array')
  }

  const cities: City[] = []
  for (const item of raw) {
    if (!isCity(item)) {
      throw new Error('City catalog contains an invalid entry')
    }
    cities.push({
      id: item.id,
      name: item.name,
      countryCode: item.countryCode,
      latitude: item.latitude,
      longitude: item.longitude,
    })
  }

  if (cities.length === 0) {
    throw new Error('City catalog is empty')
  }

  return cities
}

export async function loadCities(
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<City[]> {
  const response = await fetchImpl(CITIES_URL, { signal })
  if (!response.ok) {
    throw new Error(`Failed to load city catalog (${response.status})`)
  }
  const data: unknown = await response.json()
  return normalizeCities(data)
}

export function cityLabel(city: City): string {
  return `${city.name}, ${city.countryCode}`
}

/** Case-insensitive substring match on name and country code. Empty query returns all. */
export function filterCities(
  cities: readonly City[],
  query: string,
  limit = 50,
): City[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return cities.slice(0, limit)
  }

  const matches: City[] = []
  for (const city of cities) {
    const haystack = `${city.name} ${city.countryCode}`.toLowerCase()
    if (haystack.includes(trimmed)) {
      matches.push(city)
      if (matches.length >= limit) break
    }
  }
  return matches
}
