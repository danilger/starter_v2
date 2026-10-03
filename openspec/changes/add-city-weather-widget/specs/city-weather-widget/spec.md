# Spec Delta

## Purpose

Lets users open a weather page, pick any city from a full searchable list loaded on the client, and watch current weather for that city refresh automatically every five seconds via Open-Meteo.

## ADDED Requirements

### Requirement: Weather page is reachable
The system SHALL expose a dedicated weather page reachable from the main navigation.

#### Scenario: Open weather from nav
- **WHEN** the user selects the Weather navigation item
- **THEN** the weather page is displayed

### Requirement: Full city list loads from a separate free source
The weather page SHALL load a complete (or population-threshold GeoNames-class) city catalog from a free open source that is separate from the weather API, and SHALL retain that catalog in the client for searching.

#### Scenario: City catalog becomes available
- **WHEN** the weather page loads and the city source responds successfully
- **THEN** the city combobox is enabled and can present cities from the loaded catalog

#### Scenario: City catalog load failure
- **WHEN** the city source request fails or returns unusable data
- **THEN** the page shows an error about the city list and does not pretend a city is selected

### Requirement: Combobox searches cities on the client
The weather page MUST provide a combobox that filters the already-loaded city catalog on the client by the user's typed query (no server-side city search for filtering).

#### Scenario: Filter by typed query
- **WHEN** the city catalog is loaded and the user types a non-empty query into the combobox
- **THEN** the dropdown shows only cities whose display label matches the query (case-insensitive substring on city name and/or country)

#### Scenario: Select a city
- **WHEN** the user chooses a city from the filtered results
- **THEN** that city becomes the active selection and its label is shown in the combobox

### Requirement: Current weather for selected city
After a city is selected, the system SHALL fetch current weather for that city's coordinates from Open-Meteo and display at least: temperature, apparent temperature, relative humidity, wind speed, weather condition (code or human-readable label), and the timestamp of the last successful update.

#### Scenario: Successful current weather fetch
- **WHEN** a city is selected and Open-Meteo returns current weather
- **THEN** the widget shows the required current-weather fields for that city

#### Scenario: Weather fetch failure
- **WHEN** a city is selected and the weather request fails
- **THEN** the widget shows an error state for weather without clearing the selected city

### Requirement: Poll current weather every 5 seconds
While a city remains selected on the weather page, the system SHALL refresh current weather from Open-Meteo every 5 seconds. Changing the selected city SHALL restart polling for the new city. Leaving the page SHALL stop polling.

#### Scenario: Automatic refresh while city selected
- **WHEN** a city stays selected for more than 5 seconds
- **THEN** the widget issues another current-weather request and updates the displayed data and last-updated time on success

#### Scenario: City change restarts polling
- **WHEN** the user selects a different city
- **THEN** the widget fetches weather for the new city immediately and subsequent polls use the new city's coordinates

#### Scenario: Leave page stops polling
- **WHEN** the user navigates away from the weather page
- **THEN** no further weather poll requests are started for that page instance

### Requirement: Current weather only
The weather widget MUST display only current conditions and MUST NOT present a multi-day or hourly forecast as part of this capability.

#### Scenario: No forecast section
- **WHEN** the weather page shows data for a selected city
- **THEN** the UI does not include a forecast list or forecast chart
