import { describe, expect, it } from 'vitest'
import {
  HUE_CYCLE_MS,
  HUE_PINK,
  HUE_RED,
  HUE_STATIC,
  isHueInPinkRedBand,
  paletteForHue,
  pinkRedHueAt,
  pinkRedHueSpan,
  selectHue,
} from './ompHue'

describe('ompHue', () => {
  it('keeps oscillation within the pink–red band over a full period', () => {
    const samples = 64
    const hues: number[] = []
    for (let i = 0; i <= samples; i++) {
      const hue = pinkRedHueAt((i / samples) * HUE_CYCLE_MS)
      hues.push(hue)
      expect(isHueInPinkRedBand(hue)).toBe(true)
    }

    const min = Math.min(...hues.map((h) => (h - HUE_PINK + 360) % 360))
    const max = Math.max(...hues.map((h) => (h - HUE_PINK + 360) % 360))
    expect(min).toBeLessThan(1)
    expect(max).toBeGreaterThan(pinkRedHueSpan() - 1)

    // Endpoints of the cosine cycle land on pink; midpoint leans red.
    expect(pinkRedHueAt(0)).toBeCloseTo(HUE_PINK, 5)
    expect(pinkRedHueAt(HUE_CYCLE_MS / 2)).toBeCloseTo(HUE_RED, 5)
    expect(pinkRedHueAt(HUE_CYCLE_MS)).toBeCloseTo(HUE_PINK, 5)
  })

  it('produces a transformed palette via the hue matrix', () => {
    const pink = paletteForHue(HUE_PINK)
    const red = paletteForHue(HUE_RED)
    expect(pink.sky.every((c) => c >= 0 && c <= 255)).toBe(true)
    expect(red.violet).not.toEqual(pink.violet)
  })

  it('selects static hue under reduced motion and animated otherwise', () => {
    expect(selectHue({ timeMs: 12_000, reducedMotion: true })).toBe(HUE_STATIC)
    const moving = selectHue({ timeMs: 12_000, reducedMotion: false })
    expect(isHueInPinkRedBand(moving)).toBe(true)
    expect(moving).not.toBe(HUE_STATIC)
  })
})
