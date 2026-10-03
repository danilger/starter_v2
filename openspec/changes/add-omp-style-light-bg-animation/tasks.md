# Tasks

## 1. Poster math and color cycle (CPU)

- [x] 1.1 Implement pure TypeScript helpers for omp-style palette + hue matrix and slow pink↔red oscillation (~60s round trip) under `src/lib/` (e.g. `ompPoster.ts` / `ompHue.ts`); verify with Vitest that hue stays within the pink–red band and oscillates over a full period sample
- [x] 1.2 Implement CPU `ImageData` poster renderer (arc/lens geometry, dither/noise, silver accents, transparent/near-white outside the form for light base) and verify a node/canvas or Vitest smoke that writing ImageData for a small size succeeds and non-transparent pixels exist inside the form
- [x] 1.3 Add reduced-motion selection helper (static hue/frame when `prefers-reduced-motion: reduce`) and verify unit tests cover motion-allowed vs reduced branches

## 2. Background component and app-shell wiring

- [x] 2.1 Create `OmpStyleBackground` React component with dual pixelated canvases, `scaleY(-1)`, scanline overlay, resize + pixel-budget handling, `pointer-events: none`, `aria-hidden`; verify it mounts in isolation without throwing and canvases fill the container
- [x] 2.2 Wire GPU animated layer when `navigator.gpu` is available (in-repo WGSL/module, no runtime fetch from omp.sh) and ensure CPU poster remains when GPU is missing/fails; verify both paths in browser (or mocked GPU absence) without blank background
- [x] 2.3 Drive slow pink→red cycling via rAF/uniform while motion is allowed and freeze under reduced motion; verify visually that tint drifts slowly and stops changing when reduced-motion is emulated
- [x] 2.4 Mount the background once in the shared `App` shell behind nav + routes with correct stacking on white base; verify Home/About/Calculator/Weather all show the background and nav/controls remain clickable

## 3. Integration checks

- [x] 3.1 Confirm DevTools Network has no requests to `omp.sh` for animation assets during `npm run dev` / preview of the background
- [x] 3.2 Run `npm run test`, `npm run build`, and `npm run lint` and fix any issues introduced by this change
- [x] 3.3 Smoke-check: navigate all routes, toggle/emulate `prefers-reduced-motion`, resize the viewport, leave the page and confirm no leftover rAF/GPU work after unmount
