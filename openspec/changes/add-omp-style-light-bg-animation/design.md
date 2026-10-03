# Design

## Context

See `proposal.md` for motivation and confirmed product answers (everywhere, fidelity A, keep omp form/palette character, same flip, reduced-motion static OK, slow pink→red cycle). `starter_v2` is a Vite + React 19 + TypeScript SPA with `react-router-dom`, Tailwind 4, shadcn; white `--background` in `src/index.css`. Shell is currently `src/App.tsx` (nav + `Routes`) with no background layer. Reference omp.sh uses: dual pixelated canvases (CPU `ImageData` poster + WebGPU `create_stencil`), `scaleY(-1)`, scanlines, dark `#09090b` base, palette sky/violet/plum/silver/black with hue matrix.

## Goals / Non-Goals

**Goals:**
- One app-shell background shared by all routes.
- Visual character close to omp (poster geometry + animated layer + scanlines + flip).
- Keep white app base; adapt compositing so the effect reads on light UI.
- Slow continuous pink↔red tint cycle.
- Robust fallbacks: no WebGPU, reduced motion, resize, unmount cleanup.
- Own the runtime code in-repo (no hotlink to omp.sh).

**Non-Goals:**
- Pixel-perfect clone of omp marketing layout/typography/content.
- Shipping omp’s proprietary WASM/JS as a black-box dependency without understanding.
- Dark-mode redesign of the whole app.
- Per-route different backgrounds or user-facing animation settings UI.
- Blocking feature work behind perfect shader parity on day one — CPU poster + best-effort GPU is acceptable if visual character holds.

## Decisions

1. **Mount point = shared app shell in `App.tsx`**
   - Wrap nav + routes in a relative full-min-height container; place `OmpStyleBackground` as an absolutely positioned, `pointer-events: none`, `aria-hidden` layer behind content (`z-index` below nav/main).
   - Alternative rejected: per-page backgrounds — product asked for everywhere and would duplicate lifecycle.

2. **Layer stack (light base)**
   ```
   body white background
   └─ App shell (relative)
      ├─ Background root (absolute inset-0, pointer-events:none, overflow:clip)
      │  ├─ flipped group (scaleY(-1))
      │  │  ├─ canvas poster (CPU ImageData)
      │  │  └─ canvas animated (WebGPU if available)
      │  └─ scanlines overlay (CSS repeating-linear-gradient, tuned for light)
      ├─ nav (relative, higher z)
      └─ routes / main (relative, higher z)
   ```
   - Do **not** paint a solid `#09090b` full-bleed fill; keep white showing through. Poster/animation paint the arc/lens and accents; outside the form stays transparent or near-white so the page remains light.
   - Alternative rejected: invert entire omp dark scene — conflicts with “белый фон как сейчас”.

3. **Reproduce omp poster algorithm in-repo (CPU path)**
   - Port the observed geometry (arc center/radius, dither/noise, silver speckles, palette + hue matrix) into a TypeScript module under `src/lib/` (e.g. `ompPoster.ts`) and a React component under `src/components/` (e.g. `OmpStyleBackground.tsx`).
   - Use low-res internal canvas with `image-rendering: pixelated` and a pixel budget similar to omp (~2.2e6) for resize.
   - This is the always-on fallback and the reduced-motion static frame.

4. **GPU animated layer: WebGPU preferred, optional**
   - If `navigator.gpu` exists, implement or vendor a small WGSL stencil animator owned by this repo (inspired by omp’s `create_stencil`, not fetched from omp.sh at runtime).
   - If WebGPU is missing/fails: keep CPU poster only; still apply slow hue cycling on the CPU palette so the pink→red requirement holds without GPU.
   - Alternative rejected: CSS-only glow (fidelity C) — product chose A.
   - Alternative rejected: runtime import from `https://omp.sh/assets/...` — violates ownership/availability.

5. **Pink→red cycle = slow oscillating hue**
   - Drive a hue parameter over time with `requestAnimationFrame` (or GPU uniform clock).
   - Map time → hue in a pink→red band (approx. magenta/pink toward red; e.g. oscillate with period **~60s** full round trip). Record the constant in code; tweakable.
   - Apply via the same hue-rotation matrix omp uses on palette channels so sky/violet/plum accents shift together.
   - On reduced motion: freeze hue at a pleasant mid/pink frame; no rAF color loop.

6. **Scanlines**
   - CSS overlay matching omp’s repeating horizontal lines; lower opacity / lighter ink so it doesn’t dirty the white UI.
   - Remains visible in reduced-motion mode (static texture, not motion).

7. **Accessibility & performance**
   - `aria-hidden` on decorative layer; never steal focus.
   - Listen to `prefers-reduced-motion` media query changes.
   - Pause/cleanup on unmount and `pagehide`; debounce resize redraws.
   - Prefer one background instance for the whole SPA lifetime.

8. **Testing approach**
   - Unit-test pure helpers (hue oscillation bounds, palette matrix, reduced-motion branch selection) with Vitest where practical.
   - Manual smoke: all routes show background; controls clickable; reduced-motion static; no network calls to omp.sh in Network panel.

## Risks / Trade-offs

- **[Risk] WebGPU shader parity hard to match exactly** → Mitigate with strong CPU poster first; GPU as progressive enhancement; accept slight motion differences if form/palette/cycle read correctly.
- **[Risk] Light-background compositing looks washed out or too loud** → Keep transparency outside the arc; tune scanline opacity; preserve accent saturation via hue cycle rather than dark fill.
- **[Risk] CPU ImageData cost on large viewports / low-end devices** → Pixel budget + DPR clamp; redraw on resize only; freeze under reduced motion.
- **[Risk] Legal/ethics of copying omp assets** → Reimplement algorithm/visual approach in-repo; do not hotlink or copy-minified opaque blobs without review; reference is public site behavior.
- **[Trade-off] ~60s cycle assumption** → Product said “медленно” without exact seconds; 60s is the default assumption recorded here — adjust if review asks.

## Migration Plan

- Additive files + small `App.tsx` / CSS wiring.
- Rollback: remove background component from shell and delete new modules.

## Open Questions

- None blocking. Exact pink/red hue endpoints and cycle seconds can be tuned during apply/visual QA without changing the requirement set.
