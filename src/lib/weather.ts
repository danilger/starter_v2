export type CurrentWeather = {
  temperature: number
  apparentTemperature: number
  relativeHumidity: number
  windSpeed: number
  weatherCode: number
  conditionLabel: string
  observedAt: string
}

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast'
const CURRENT_FIELDS =
  'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m'

/** WMO Weather interpretation codes → short Russian labels. */
const WEATHER_CODE_LABELS: Record<number, string> = {
  0: 'Ясно',
  1: 'Преимущественно ясно',
  2: 'Переменная облачность',
  3: 'Пасмурно',
  45: 'Туман',
  48: 'Изморозь',
  51: 'Морось',
  53: 'Морось',
  55: 'Сильная морось',
  56: 'Ледяная морось',
  57: 'Сильная ледяная морось',
  61: 'Небольшой дождь',
  63: 'Дождь',
  65: 'Сильный дождь',
  66: 'Ледяной дождь',
  67: 'Сильный ледяной дождь',
  71: 'Небольшой снег',
  73: 'Снег',
  75: 'Сильный снег',
  77: 'Снежные зёрна',
  80: 'Ливень',
  81: 'Ливень',
  82: 'Сильный ливень',
  85: 'Снегопад',
  86: 'Сильный снегопад',
  95: 'Гроза',
  96: 'Гроза с градом',
  99: 'Гроза с сильным градом',
}

export function weatherCodeLabel(code: number): string {
  return WEATHER_CODE_LABELS[code] ?? `Код ${code}`
}

export function buildCurrentWeatherUrl(
  latitude: number,
  longitude: number,
): string {
  const url = new URL(OPEN_METEO_BASE)
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('current', CURRENT_FIELDS)
  url.searchParams.set('timezone', 'auto')
  return url.toString()
}

type OpenMeteoCurrentResponse = {
  current?: {
    time?: string
    temperature_2m?: number
    apparent_temperature?: number
    relative_humidity_2m?: number
    weather_code?: number
    wind_speed_10m?: number
  }
}

export function mapCurrentWeather(data: OpenMeteoCurrentResponse): CurrentWeather {
  const current = data.current
  if (
    !current ||
    typeof current.temperature_2m !== 'number' ||
    typeof current.apparent_temperature !== 'number' ||
    typeof current.relative_humidity_2m !== 'number' ||
    typeof current.weather_code !== 'number' ||
    typeof current.wind_speed_10m !== 'number' ||
    typeof current.time !== 'string'
  ) {
    throw new Error('Open-Meteo response is missing current weather fields')
  }

  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    relativeHumidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
    conditionLabel: weatherCodeLabel(current.weather_code),
    observedAt: current.time,
  }
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<CurrentWeather> {
  const url = buildCurrentWeatherUrl(latitude, longitude)
  const response = await fetchImpl(url, { signal })
  if (!response.ok) {
    throw new Error(`Failed to fetch weather (${response.status})`)
  }
  const data = (await response.json()) as OpenMeteoCurrentResponse
  return mapCurrentWeather(data)
}
