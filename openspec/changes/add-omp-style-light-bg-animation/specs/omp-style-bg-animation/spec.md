# Spec Delta

## Purpose

Provides an app-wide decorative background animation in the visual style of omp.sh on the existing white app background, with a slow pink-to-red color cycle, without blocking page interaction.

## ADDED Requirements

### Requirement: Background appears on every route
The system SHALL render the decorative omp-style background behind page content on all primary application routes (Home, About, Calculator, Weather, and any other routes that use the shared app shell).

#### Scenario: Background visible on Home
- **WHEN** the user opens the Home route
- **THEN** the decorative background is visible behind the page content

#### Scenario: Background persists across navigation
- **WHEN** the user navigates between routes in the main app shell
- **THEN** the decorative background remains present without requiring a page-specific remount of the whole app shell

### Requirement: White base background is preserved
The application base background MUST remain white (the existing light theme background). The decorative animation SHALL sit as a non-interactive layer above that base and below interactive page content.

#### Scenario: Base stays light
- **WHEN** any route in the app shell is displayed
- **THEN** the page base remains a white/light theme background and is not replaced by a solid dark full-page fill like the omp.sh marketing hero

### Requirement: Visual fidelity matches omp.sh character
The decorative background SHALL reproduce the omp.sh background character: a pixelated dual-canvas stencil/poster composition with an animated layer and a scanline overlay, including the vertical flip used on the reference (`scaleY(-1)`), and SHALL preserve the reference shape family (arc/lens) and color-family character (sky/violet/plum/silver accents) rather than reducing to a soft CSS-only glow.

#### Scenario: Pixelated canvas background is present
- **WHEN** the app shell loads and canvas rendering is available
- **THEN** the background includes one or more full-bleed pixelated canvas layers forming the stencil/poster look

#### Scenario: Scanlines and flip match reference orientation
- **WHEN** the background is displayed
- **THEN** a scanline overlay is present and the canvas composition uses the same vertical flip orientation as omp.sh

### Requirement: GPU animation with CPU fallback
The system SHOULD use a GPU-accelerated animated layer when WebGPU (or the chosen GPU path) is available. If GPU animation is unavailable, the system MUST still show a CPU-rendered poster/static-or-limited animated background so the page is not left without the decorative effect.

#### Scenario: GPU path available
- **WHEN** the browser supports the GPU animation path
- **THEN** the animated layer runs in addition to the poster canvas

#### Scenario: GPU path unavailable
- **WHEN** the browser does not support the GPU animation path
- **THEN** the CPU poster (or equivalent non-GPU canvas) still renders and the UI remains usable

### Requirement: Slow pink-to-red color cycle
While motion is allowed, the background animation SHALL smoothly and slowly cycle its tint/hue between pink and red. The cycle MUST be continuous and slow enough to read as ambient (on the order of tens of seconds per full pink↔red round trip, not rapid flashing).

#### Scenario: Color drifts from pink toward red
- **WHEN** the animated background runs for a prolonged period with motion enabled
- **THEN** the dominant tint visibly transitions between pink and red ranges without abrupt jumps

#### Scenario: Cycle continues while staying on a page
- **WHEN** the user remains on a route with the background mounted
- **THEN** the pink↔red cycle continues looping smoothly

### Requirement: Reduced motion uses a static frame
When the user prefers reduced motion, the system MUST NOT run the animated GPU/color cycle and MUST show a static decorative frame instead.

#### Scenario: Reduced motion preference honored
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** the background shows a static frame without continuous motion or continuous color cycling

### Requirement: Background does not block UI
The decorative background MUST NOT capture pointer events and MUST NOT prevent reading or interacting with navigation and page controls.

#### Scenario: Controls remain clickable
- **WHEN** the background is rendered
- **THEN** the user can activate main navigation links and interactive controls on the current page

### Requirement: No production hotlink to omp.sh assets
The implementation MUST NOT load runtime animation assets directly from `omp.sh` in production. Any shader/poster logic used at runtime SHALL be owned by this repository (reimplemented or vendored).

#### Scenario: App loads without omp.sh asset requests
- **WHEN** the application runs in a normal local or production build
- **THEN** the decorative background does not fetch JS/WASM/image assets from `https://omp.sh`
