# Tasks

## 1. CPU exterior spray

- [x] 1.1 Update `src/lib/ompPoster.ts` silver/spray stamping so particles can write discrete tinted dots onto previously transparent exterior pixels near the crest (remove the hard `alpha === 0 → skip` barrier for spray stamps); verify with a Vitest/node check that a small rendered poster has opaque-ish exterior speckles outside the dense core
- [x] 1.2 Keep in-form silver accents readable and ensure spray density falls off away from the crest; verify unit coverage for “some exterior spray pixels exist” and that interior form still renders

## 2. GPU discrete speckles

- [x] 2.1 Extend WGSL in `src/lib/ompGpu.ts` with a sparse hash-threshold speckle term beyond the soft mist/band, tinted for light backgrounds; verify GPU path still builds/types and does not regress when WebGPU is unavailable (CPU-only still works)
- [x] 2.2 Confirm under motion that speckles read as flying dots near the crest (manual smoke on a WebGPU browser) without forming a second solid band

## 3. Integration

- [x] 3.1 Run `npm run test`, `npm run build`, `npm run lint` and fix regressions
- [x] 3.2 Visual smoke vs omp reference: Home (white base) shows spray above the wave; reduced-motion still shows static spray; no omp.sh asset fetches
