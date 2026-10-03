import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildCurrentWeatherUrl,
  fetchCurrentWeather,
  mapCurrentWeather,
  weatherCodeLabel,
} from './weather'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('buildCurrentWeatherUrl', () => {
  it('includes latitude, longitude, current fields, and timezone', () => {
    const url = new URL(buildCurrentWeatherUrl(55.75, 37.62))
    expect(url.origin + url.pathname).toBe(
      'https://api.open-meteo.com/v1/forecast',
    )
    expect(url.searchParams.get('latitude')).toBe('55.75')
    expect(url.searchParams.get('longitude')).toBe('37.62')
    expect(url.searchParams.get('current')).toContain('temperature_2m')
    expect(url.searchParams.get('current')).toContain('weather_code')
    expect(url.searchParams.get('timezone')).toBe('auto')
  })
})

describe('weatherCodeLabel', () => {
  it('maps known WMO codes to Russian labels', () => {
    expect(weatherCodeLabel(0)).toBe('Ясно')
    expect(weatherCodeLabel(61)).toBe('Небольшой дождь')
  })

  it('falls back for unknown codes', () => {
    expect(weatherCodeLabel(12345)).toBe('Код 12345')
  })
})

describe('mapCurrentWeather', () => {
  it('maps Open-Meteo current payload', () => {
    const weather = mapCurrentWeather({
      current: {
        time: '2026-10-03T12:00',
        temperature_2m: 12.5,
        apparent_temperature: 11.1,
        relative_humidity_2m: 70,
        weather_code: 3,
        wind_speed_10m: 4.2,
      },
    })
    expect(weather).toEqual({
      temperature: 12.5,
      apparentTemperature: 11.1,
      relativeHumidity: 70,
      windSpeed: 4.2,
      weatherCode: 3,
      conditionLabel: 'Пасмурно',
      observedAt: '2026-10-03T12:00',
    })
  })

  it('throws when current fields are missing', () => {
    expect(() => mapCurrentWeather({})).toThrow(/missing/i)
  })
})

describe('fetchCurrentWeather', () => {
  it('fetches and maps the response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          time: '2026-10-03T12:00',
          temperature_2m: 5,
          apparent_temperature: 3,
          relative_humidity_2m: 80,
          weather_code: 0,
          wind_speed_10m: 2,
        },
      }),
    })

    const weather = await fetchCurrentWeather(1, 2, fetchImpl as typeof fetch)
    expect(fetchImpl).toHaveBeenCalledOnce()
    const calledUrl = String(fetchImpl.mock.calls[0]?.[0])
    expect(calledUrl).toContain('latitude=1')
    expect(calledUrl).toContain('longitude=2')
    expect(weather.temperature).toBe(5)
    expect(weather.conditionLabel).toBe('Ясно')
  })

  it('throws on non-OK HTTP', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    await expect(
      fetchCurrentWeather(1, 2, fetchImpl as typeof fetch),
    ).rejects.toThrow(/500/)
  })
})
