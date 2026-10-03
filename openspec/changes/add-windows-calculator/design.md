# Design

## Context

See `proposal.md` for motivation. `starter_v2` is a Vite + React 19 + TypeScript SPA with `react-router-dom`, Tailwind 4, and shadcn-style UI (`Button`, `Card`, `Input`). Routing and nav live in `src/App.tsx`; pages are under `src/pages/`. There is no calculator code or OpenSpec main specs yet.

## Goals / Non-Goals

**Goals:**
- Separate pure calculator engine from React UI so behavior is unit-testable.
- Match Standard Windows Calculator key set, left-to-right evaluation, and clear/memory/unary semantics closely enough for everyday use.
- Fit the existing app shell (nav + route) and design tokens without new runtime dependencies.

**Non-Goals:**
- Scientific / Programmer / Graphing modes, currency converter, or history flyout.
- Pixel-perfect WinUI / Fluent skin.
- Server-side persistence of memory or history.
- Exact IEEE edge-case parity with Windows Calculator binary floating-point quirks beyond sensible JS `number` handling and clear error states.

## Decisions

1. **Route `/calculator` + page component**
   - Add `Calculator` page and a nav link in `App.tsx`.
   - Alternative: replace Home — rejected to keep the starter demo intact.

2. **Pure engine module (`src/lib/calculator.ts` or similar)**
   - State machine style: `display`, `expression`, `accumulator`, `pendingOperator`, `memory`, `error`, `overwrite` flags.
   - UI dispatches actions (`digit`, `operator`, `equals`, `clear`, `clearEntry`, `backspace`, unary, memory).
   - Alternative: logic inside React component — rejected; harder to test and reuse.

3. **Evaluation model = Standard (immediate / left-to-right)**
   - On operator press after a second operand, evaluate the pending binary op before setting the new operator (Windows Standard behavior), not algebraic precedence.
   - Repeat `=` reapplies the last operator and operand when applicable.

4. **UI layout as CSS grid mirroring Standard pad**
   ```
   +------------------------------------------+
   |  expression                              |
   |                              display     |
   +------------------------------------------+
   | MC | MR | M+ | M- | MS                   |
   | %  | CE | C  | ⌫  |                      |
   | 1/x| x² | √x | ÷  |                      |
   | 7  | 8  | 9  | ×  |                      |
   | 4  | 5  | 6  | −  |                      |
   | 1  | 2  | 3  | +  |                      |
   | ±  | 0  | .  | =  |                      |
   +------------------------------------------+
   ```
   - Use existing `Button` variants / Tailwind for digit vs operator vs function styling; memory indicator via subtle marker near display or disabled/opacity state on MC when empty.
   - Alternative: third-party calculator widget — rejected to keep control and match project stack.

5. **Keyboard handling on the page container**
   - `window`/`document` keydown while the Calculator route is mounted; map keys to the same engine actions as buttons.
   - Ignore events when focus is in unrelated editable fields (none expected on this page).

6. **Errors**
   - Division by zero and √ of negative set an error display string; further input except C/CE/clearing keys is ignored or only C recovers (match Standard: need C to continue). Prefer C to fully reset.

7. **Formatting**
   - Display with reasonable trimming of floating noise; keep implementation simple (no arbitrary-precision library).

## Risks / Trade-offs

- **[Risk] JS floating-point surprises** → Mitigate with display formatting and documented non-goal of bit-identical Windows results.
- **[Risk] Subtle Standard-mode edge cases (percent, chained unary)** → Mitigate by encoding scenarios in the spec and covering them with unit tests on the engine.
- **[Trade-off] Approximate visual skin** → Faster delivery and consistent with shadcn/Tailwind; not a Windows clone.

## Migration Plan

- Additive only: new route, page, components, and lib module; existing Home/About unchanged.
- Rollback: remove route/nav and new files.

## Open Questions

- None blocking planning; if product later wants Scientific mode or history panel, that would be a separate change.
