# Spec Delta

## ADDED Requirements

### Requirement: Spray / flying dots above the wave crest
The decorative omp-style background SHALL render a sparse cloud of discrete flying dots (spray) that appear outside the dense arc/lens body — visually “kicked up” above/away from the crest into the otherwise empty region — rather than only tinting pixels already inside the opaque poster form.

#### Scenario: Spray visible outside the dense form
- **WHEN** the background is displayed at a typical desktop viewport with motion allowed
- **THEN** discrete speckles are visible in the region outside the dense wave body near the crest (not only within the solid purple/pink mass)

#### Scenario: Spray density falls off away from the crest
- **WHEN** the spray layer is rendered
- **THEN** speckles are denser near the crest and become sparser farther away, reading as spray rather than a second solid band

#### Scenario: CPU path paints spray on transparent exterior
- **WHEN** the CPU poster renderer places spray/silver accents
- **THEN** it may write discrete dots onto previously transparent exterior pixels (it MUST NOT skip all exterior pixels solely because alpha was 0)

#### Scenario: GPU path includes discrete speckles
- **WHEN** the GPU animated layer is active
- **THEN** the shader includes a sparse discrete-speckle contribution beyond the soft mist/band, so flying dots remain visible when WebGPU is used

#### Scenario: Spray remains readable on the white base
- **WHEN** the app base background is white/light
- **THEN** spray dots use tinted/opaque-enough colors (palette family) so they remain visible against white (pure white-on-white spray is not required)
