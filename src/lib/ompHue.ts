/** Pink↔red ambient hue cycle (~60s round trip), omp-style palette matrix. */

export const HUE_CYCLE_MS = 60_000
/** Approximate CSS hue degrees for the pink endpoint. */
export const HUE_PINK = 330
/** Approximate CSS hue degrees for the red endpoint. */
export const HUE_RED = 12
/** Static frame used when reduced motion is preferred. */
export const HUE_STATIC = 340

export type OmpPalette = {
  sky: [number, number, number]
  violet: [number, number, number]
  plum: [number, number, number]
  silver: [number, number, number]
  black: [number, number, number]
}

const BASE_SKY: [number, number, number] = [56, 189, 248]
const BASE_VIOLET: [number, number, number] = [192, 132, 252]
const BASE_PLUM: [number, number, number] = [70, 15, 85]
const BASE_SILVER: [number, number, number] = [250, 250, 252]
const BASE_BLACK: [number, number, number] = [9, 9, 11]

/** Short-arc span from pink toward red (crossing 0°). */
export function pinkRedHueSpan(): number {
  return (HUE_RED + 360 - HUE_PINK) % 360
}

/**
 * Smooth oscillation between pink and red over `periodMs`.
 * Uses a cosine ease so endpoints have zero derivative (no abrupt jumps).
 */
export function pinkRedHueAt(timeMs: number, periodMs = HUE_CYCLE_MS): number {
  const period = Math.max(1, periodMs)
  const phase = ((timeMs % period) + period) % period / period
  const wave = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2)
  return (HUE_PINK + wave * pinkRedHueSpan()) % 360
}

export function selectHue(options: {
  timeMs: number
  reducedMotion: boolean
  periodMs?: number
}): number {
  if (options.reducedMotion) return HUE_STATIC
  return pinkRedHueAt(options.timeMs, options.periodMs)
}

/** omp-style luminance-preserving hue rotation matrix applied to base palette. */
export function paletteForHue(hueDegrees: number): OmpPalette {
  const t = (hueDegrees * Math.PI) / 180
  const c = Math.cos(t)
  const s = Math.sin(t)
  const m = [
    [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928],
    [0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283],
    [0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072],
  ] as const

  const mul = (row: readonly number[], rgb: readonly number[]) =>
    Math.min(255, Math.max(0, row[0]! * rgb[0]! + row[1]! * rgb[1]! + row[2]! * rgb[2]!))

  const apply = (rgb: readonly [number, number, number]): [number, number, number] => [
    mul(m[0], rgb),
    mul(m[1], rgb),
    mul(m[2], rgb),
  ]

  return {
    sky: apply(BASE_SKY),
    violet: apply(BASE_VIOLET),
    plum: apply(BASE_PLUM),
    silver: apply(BASE_SILVER),
    black: apply(BASE_BLACK),
  }
}

export function isHueInPinkRedBand(hue: number, epsilon = 0.5): boolean {
  const h = ((hue % 360) + 360) % 360
  const span = pinkRedHueSpan()
  // Normalize relative to HUE_PINK along the short arc.
  const rel = (h - HUE_PINK + 360) % 360
  return rel >= -epsilon && rel <= span + epsilon
}
