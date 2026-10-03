import { useEffect, useRef, useState } from 'react'
import { CityCombobox } from '@/components/CityCombobox'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { loadCities, type City } from '@/lib/cities'
import {
  fetchCurrentWeather,
  type CurrentWeather,
} from '@/lib/weather'

const POLL_INTERVAL_MS = 5000

function formatUpdatedAt(iso: string, fetchedAt: Date): string {
  const fromApi = Date.parse(iso)
  const date = Number.isNaN(fromApi) ? fetchedAt : new Date(fromApi)
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function Weather() {
  const [cities, setCities] = useState<City[]>([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [citiesError, setCitiesError] = useState<string | null>(null)

  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null)
  const hasWeatherRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    setCitiesLoading(true)
    setCitiesError(null)

    loadCities(fetch, controller.signal)
      .then((catalog) => {
        setCities(catalog)
        setCitiesLoading(false)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message =
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить список городов'
        setCitiesError(message)
        setCities([])
        setSelectedCity(null)
        setCitiesLoading(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!selectedCity) {
      hasWeatherRef.current = false
      setWeather(null)
      setWeatherError(null)
      setWeatherLoading(false)
      setLastFetchedAt(null)
      return
    }

    hasWeatherRef.current = false
    setWeather(null)
    setWeatherError(null)

    const { latitude, longitude } = selectedCity
    let cancelled = false
    let generation = 0
    let activeController: AbortController | null = null

    async function poll() {
      const currentGeneration = ++generation
      activeController?.abort()
      const controller = new AbortController()
      activeController = controller

      if (!hasWeatherRef.current) {
        setWeatherLoading(true)
      }

      try {
        const next = await fetchCurrentWeather(
          latitude,
          longitude,
          fetch,
          controller.signal,
        )
        if (cancelled || currentGeneration !== generation) return
        hasWeatherRef.current = true
        setWeather(next)
        setWeatherError(null)
        setLastFetchedAt(new Date())
      } catch (error: unknown) {
        if (controller.signal.aborted || cancelled || currentGeneration !== generation) {
          return
        }
        const message =
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить погоду'
        setWeatherError(message)
      } finally {
        if (!cancelled && currentGeneration === generation) {
          setWeatherLoading(false)
        }
      }
    }

    void poll()
    const intervalId = window.setInterval(() => {
      void poll()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      generation += 1
      activeController?.abort()
      window.clearInterval(intervalId)
    }
  }, [selectedCity])

  return (
    <main className="mx-auto flex min-h-[calc(100svh-3.25rem)] w-full max-w-xl flex-col gap-4 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Погода</h1>
        <p className="text-sm text-muted-foreground">
          Выберите город и следите за текущей погодой — обновление каждые 5
          секунд.
        </p>
      </header>

      <section className="space-y-2" aria-label="Выбор города">
        <CityCombobox
          cities={cities}
          value={selectedCity}
          onChange={setSelectedCity}
          disabled={Boolean(citiesError) || cities.length === 0}
          loading={citiesLoading}
        />
        {citiesError ? (
          <p className="text-sm text-destructive" role="alert">
            Ошибка списка городов: {citiesError}
          </p>
        ) : null}
      </section>

      {!selectedCity && !citiesError ? (
        <Card>
          <CardHeader>
            <CardTitle>Город не выбран</CardTitle>
            <CardDescription>
              Найдите город в списке выше, чтобы увидеть текущую погоду.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {selectedCity ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCity.name}, {selectedCity.countryCode}
            </CardTitle>
            <CardDescription>
              Текущие условия по данным Open-Meteo
              {weatherLoading && weather
                ? ' · обновление…'
                : weatherLoading
                  ? ' · загрузка…'
                  : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {weatherError ? (
              <p className="text-sm text-destructive" role="alert">
                Ошибка погоды: {weatherError}
              </p>
            ) : null}

            {!weather && weatherLoading ? (
              <p className="text-sm text-muted-foreground">Загрузка погоды…</p>
            ) : null}

            {weather ? (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Температура</dt>
                  <dd className="text-2xl font-semibold">
                    {weather.temperature.toFixed(1)} °C
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ощущается</dt>
                  <dd className="text-lg font-medium">
                    {weather.apparentTemperature.toFixed(1)} °C
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Влажность</dt>
                  <dd>{weather.relativeHumidity}%</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ветер</dt>
                  <dd>{weather.windSpeed.toFixed(1)} км/ч</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Условие</dt>
                  <dd>{weather.conditionLabel}</dd>
                </div>
              </dl>
            ) : null}
          </CardContent>
          <CardFooter className="justify-between text-xs text-muted-foreground">
            <span>
              Обновлено:{' '}
              {weather && lastFetchedAt
                ? formatUpdatedAt(weather.observedAt, lastFetchedAt)
                : '—'}
            </span>
            <span>Города: GeoNames (CC-BY)</span>
          </CardFooter>
        </Card>
      ) : null}
    </main>
  )
}
