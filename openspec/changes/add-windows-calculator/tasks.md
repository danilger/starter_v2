# Tasks

## 1. Calculator engine

- [x] 1.1 Add pure calculator state module under `src/lib/` (digits, operators, equals, CE/C/Backspace, unary, memory, errors) and verify `npm run build` typechecks with the module exported
- [x] 1.2 Add Vitest (or equivalent) and unit tests covering spec scenarios: addition, left-to-right chain, divide-by-zero, CE vs C, Backspace, negate, square, √ negative error, MS/MR/MC, and verify tests pass via the new npm test script

## 2. Calculator UI and route

- [x] 2.1 Create Calculator page with expression + primary display and Standard key grid (memory, functions, digits, operators, equals) wired to the engine; verify all required keys render on `/calculator`
- [x] 2.2 Style keys with existing Button/Tailwind tokens and show a memory indicator when memory is non-zero; verify visually in `npm run dev`
- [x] 2.3 Register `/calculator` route and Calculator nav link in `src/App.tsx`; verify navigation from nav opens the calculator page

## 3. Keyboard and integration

- [x] 3.1 Bind keyboard input on the calculator page (digits, `.`, `+−*/`, Enter/`=`, Escape→C, Backspace) to engine actions; verify typing `7+1` then Enter shows `8`
- [x] 3.2 Smoke-check build and lint (`npm run build`, `npm run lint`) and manually walk through clear/memory/error recovery paths from the spec
