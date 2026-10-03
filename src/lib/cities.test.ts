import { describe, expect, it } from 'vitest'
import { cityLabel, filterCities, normalizeCities, type City } from './cities'

const sample: City[] = [
  {
    id: 1,
    name: 'Moscow',
    countryCode: 'RU',
    latitude: 55.75,
    longitude: 37.62,
  },
  {
    id: 2,
    name: 'Berlin',
    countryCode: 'DE',
    latitude: 52.52,
    longitude: 13.4,
  },
  {
    id: 3,
    name: 'Paris',
    countryCode: 'FR',
    latitude: 48.85,
    longitude: 2.35,
  },
]

describe('normalizeCities', () => {
  it('accepts a valid catalog', () => {
    expect(normalizeCities(sample)).toHaveLength(3)
  })

  it('rejects non-arrays and empty catalogs', () => {
    expect(() => normalizeCities({})).toThrow(/array/i)
    expect(() => normalizeCities([])).toThrow(/empty/i)
  })
})

describe('filterCities', () => {
  it('returns capped full list for empty query', () => {
    expect(filterCities(sample, '', 2)).toEqual(sample.slice(0, 2))
    expect(filterCities(sample, '   ')).toHaveLength(3)
  })

  it('matches city name case-insensitively', () => {
    expect(filterCities(sample, 'mos')).toEqual([sample[0]])
    expect(filterCities(sample, 'BERLIN')).toEqual([sample[1]])
  })

  it('matches country code', () => {
    expect(filterCities(sample, 'fr')).toEqual([sample[2]])
  })

  it('respects result limit', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      name: `City${i}`,
      countryCode: 'XX',
      latitude: 0,
      longitude: 0,
    }))
    expect(filterCities(many, 'city', 50)).toHaveLength(50)
  })
})

describe('cityLabel', () => {
  it('formats name and country', () => {
    expect(cityLabel(sample[0])).toBe('Moscow, RU')
  })
})
