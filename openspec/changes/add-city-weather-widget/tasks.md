# Tasks

## 1. City catalog and weather clients

- [x] 1.1 Add GeoNames-derived cities JSON (cities15000 or cities5000) under `public/data/cities.json` (or equivalent fetchable asset) with fields usable as id/name/countryCode/latitude/longitude, and verify the file loads via `fetch` in the browser or a quick node/fetch check
- [x] 1.2 Implement `src/lib/cities.ts` to load and normalize the catalog plus a pure client-side filter helper (case-insensitive substring on name/country); verify with Vitest unit tests for filter matching and empty-query behavior
- [x] 1.3 Implement `src/lib/weather.ts` to build the Open-Meteo current-weather URL, fetch/parse `current` fields, and map weather codes to Russian labels; verify with Vitest for URL/query params and response mapping (mock fetch)

## 2. Weather page UI and route

- [x] 2.1 Add combobox UI (shadcn Popover/Command or equivalent) that loads the city catalog once, filters on the client as the user types, caps visible matches, and emits the selected city; verify typing a known city name shows it and selection sets the active city
- [x] 2.2 Create `src/pages/Weather.tsx` with Russian labels: combobox, current-weather card (temperature, apparent, humidity, wind, condition, last updated), and empty/loading/error states for catalog vs weather; verify manual walkthrough of happy path and error messaging
- [x] 2.3 Wire 5 s polling for the selected city’s coordinates (immediate fetch on select, interval refresh, abort/ignore stale, clear on unmount/city change); verify in devtools that requests repeat ~every 5 s only while the city stays selected on `/weather`
- [x] 2.4 Register `/weather` route and Weather nav link in `src/App.tsx`; verify navigation opens the weather page

## 3. Integration checks

- [x] 3.1 Run `npm run test`, `npm run build`, and `npm run lint` and fix any issues introduced by this change
- [x] 3.2 Smoke-check: load `/weather`, search and select a city, confirm current weather renders, wait for at least one poll update, change city, leave the page and confirm polling stops
