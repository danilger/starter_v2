# Design

## Context

See `proposal.md` for motivation. `starter_v2` is a Vite + React 19 + TypeScript SPA with `react-router-dom`, Tailwind 4, and shadcn UI (`Button`, `Card`, `Input`). Routing/nav live in `src/App.tsx`; pages under `src/pages/`. Confirmed product answers: Open-Meteo for weather; separate free full city list + client-side combobox search; current weather only; interactivity = city select + 5 s polling.

## Goals / Non-Goals

**Goals:**
- Clear split: city catalog loading/filtering vs weather fetch/polling vs presentational page.
- Client-side search over a loaded full city catalog (not curated hardcoded list, not server-side geocoding-as-search).
- Reliable 5 s polling with cleanup on unmount and restart on city change.
- Fit existing app shell and design tokens; Russian UI labels.

**Non-Goals:**
- Forecast (hourly/daily), maps, geolocation “near me”, °C/°F toggle, auth, backend proxy.
- Pixel-perfect weather-app branding.
- Offline-first city DB / IndexedDB persistence (in-memory + optional static cache is enough).

## Decisions

1. **Route `/weather` + `Weather` page**
   - Mirror Calculator: page under `src/pages/Weather.tsx`, nav link in `App.tsx`.
   - Alternative: embed widget on Home — rejected; request asks for a page and keeps Home demo intact.

2. **Cities source = GeoNames-derived full list (separate from Open-Meteo)**
   - Use GeoNames dump class **cities15000** (or cities5000 if size is acceptable): free, CC-BY, includes name, country code, lat, lon for a large worldwide city set.
   - Delivery for the SPA (pick one in apply; prefer first that works cleanly):
     1. Ship a prepared JSON under `public/data/cities.json` (built once from the GeoNames dump), fetch with `fetch('/data/cities.json')` on page mount; or
     2. Fetch a stable raw/CDN URL of the same dump/JSON at runtime.
   - Normalize to `{ id, name, countryCode, latitude, longitude }[]` in `src/lib/cities.ts` (or similar).
   - Attribute GeoNames in UI footer or comment near the loader (CC-BY).
   - Alternatives rejected:
     - Curated fixed dropdown — rejected by product.
     - Open-Meteo Geocoding API as the search — server-side search, not “load full list + filter on front”.
     - CityAPI `?search=` — same: server-side search; full dump via many pages is heavier and less reliable for “client search over complete list”.

3. **Combobox with client-side filter**
   - Load catalog once; filter in memory with case-insensitive substring on `name` and `countryCode` (debounce ~150–300 ms for typing UX).
   - Cap visible results (e.g. first 50 matches) to keep the dropdown usable; filtering still runs over the full in-memory list.
   - UI: add shadcn Combobox pattern (`Popover` + `Command` / filtered list + `Input`) if missing; reuse existing tokens.
   - Selection stores the city object (coords required for weather).

4. **Weather = Open-Meteo Forecast API, `current` only**
   - Endpoint shape: `https://api.open-meteo.com/v1/forecast?latitude=…&longitude=…&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m` (timezone optional `auto`).
   - Map `weather_code` to a short Russian label via a small local WMO code table.
   - Module: `src/lib/weather.ts` for URL build, fetch, parse, typed result.
   - No forecast fields requested in the response beyond what `current` returns.

5. **Polling every 5 seconds**
   - `useEffect` (or equivalent) keyed on selected city id/coords: immediate fetch on select, then `setInterval(5000)`; clear interval on city change and unmount.
   - Overlapping requests: ignore stale responses (generation counter / `AbortController` per poll cycle).
   - Loading: show initial loading when no data yet; soft refresh can keep last good data while a poll is in flight.
   - Errors: surface weather error without clearing city selection; next poll may recover.

6. **UI composition**
   ```
   +----------------------------------------------+
   |  Погода                                      |
   |  [ Combobox: поиск города…            v ]    |
   +----------------------------------------------+
   |  Card: город, °C, ощущается, влажность,      |
   |  ветер, условие, обновлено: HH:MM:SS         |
   +----------------------------------------------+
   ```
   - Empty state before selection; error states for cities load vs weather load.

## Risks / Trade-offs

- **[Risk] Large city JSON payload** → Mitigate with cities15000 (~25k) rather than allCountries; result cap in dropdown; load only on `/weather`.
- **[Risk] CORS / CDN availability for remote dump** → Prefer vendoring JSON under `public/data/`; document GeoNames attribution.
- **[Risk] 5 s polling vs rate limits** → Open-Meteo is permissive for light client use; one city / one tab; abort on navigate.
- **[Trade-off] Population threshold dump vs literally every hamlet** → cities15000 still “full list source” vs curated UI list; product asked for free source of all cities class, not a hand-picked 12. If later needed, swap dump class without changing UX contract.

## Migration Plan

- Additive: new route, page, lib modules, optional UI components, optional `public/data/cities.json`.
- Rollback: remove route/nav and new files/assets.

## Open Questions

- None blocking; dump class cities15000 vs cities5000 can be chosen at apply based on payload size without changing requirements.
