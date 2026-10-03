# Design

## Context

See `proposal.md`. Existing implementation from `add-omp-style-light-bg-animation`:
- CPU poster: `src/lib/ompPoster.ts` (`fillPoster` + silver loop)
- GPU: `src/lib/ompGpu.ts` WGSL soft `band` / `mist` / `deep`
- Shell: `OmpStyleBackground` dual canvas + `scaleY(-1)` + scanlines

**Observed gap (code + screenshots):**
1. CPU silver pass stamps only where `g[idx+3] !== 0` → accents never leave the opaque form → no flying spray into empty space.
2. GPU is a continuous soft field + mild hash noise → reads as a sharp/soft edge, not a discrete particle spray like omp.sh’s bright cloud above the crest.
3. omp reference spray is bright on dark; our base is white → spray must be tinted (violet/plum/sky/silver) with enough alpha to read on light.

## Goals / Non-Goals

**Goals:**
- Minimal surgical fix: exterior spray dots on CPU + discrete speckles on GPU.
- Keep geometry, flip, hue cycle, reduced-motion, no omp.sh hotlink.

**Non-Goals:**
- Rewriting poster math / palette / app shell.
- Pixel-perfect clone of omp particle counts.
- Dark full-page fill to make white spray work.

## Decisions

1. **CPU: exterior spray pass (primary fix)**
   - Keep existing in-form silver accents OR extend the same loop.
   - Critical change: when stamping a spray particle whose center is outside the opaque mask, **write RGBA onto transparent pixels** (small 1–2px stamp, tinted silver/sky, alpha ~0.35–0.9).
   - Place particles in a band just outside the crest (`dist` / radial offset past `radius`), with count ≈ existing `silverCount` order, density falloff via `cbrt`/distance (same spirit as current silver sampling).
   - Unit-test: for a small canvas, after render, at least N exterior pixels (`alpha>0` outside the dense core heuristic) exist.

2. **GPU: sparse discrete speckles**
   - In WGSL `fs_main`, after mist/band, add a hash-thresholded speck term at larger `d` (e.g. spray radius tens–hundreds of `scale` px): if `hash21(floor(xy)+frameBucket) < density(d)` emit bright tinted RGB with low alpha.
   - Animate lightly via `floor(t * …)` so speckles shimmer without becoming a second solid band.
   - Keep soft mist; speckles are additive character, not a replacement.

3. **Light-base color**
   - Prefer `palette.silver` / bright sky mixed toward white at ~70–90% luminance, not `#fff` only — must contrast on `--background` white.

4. **Reduced motion**
   - Static CPU frame still includes spray stamps; GPU frozen frame may show speckles at frozen time — no extra motion required.

## Risks / Trade-offs

- **[Risk] Too many exterior dots dirty UI** → Cap count; keep spray near crest; `pointer-events: none` unchanged.
- **[Risk] GPU speckles look noisy** → Low density threshold + distance falloff; tune in apply smoke.
- **[Trade-off] Not bit-identical to omp WASM particles** → Match character (flying discrete spray), not proprietary particle sim.

## Migration Plan

- Patch `ompPoster.ts` / `ompGpu.ts` (+ tests); no API change to `OmpStyleBackground`.
- Rollback: revert those two modules.

## Open Questions

- None blocking; exact spray count/opacity tunable in apply without changing the requirement.
