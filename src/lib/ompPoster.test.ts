import { describe, expect, it } from 'vitest'
import { HUE_STATIC } from './ompHue'
import { computePosterLayout, renderPosterImageData, resolveCanvasSize } from './ompPoster'

describe('ompPoster', () => {
  it('writes ImageData for a small size with opaque pixels inside the form', () => {
    const { width, height, data } = renderPosterImageData(160, 120, HUE_STATIC)
    expect(width).toBe(160)
    expect(height).toBe(120)
    expect(data.length).toBe(160 * 120 * 4)

    let opaque = 0
    let transparent = 0
    for (let i = 3; i < data.length; i += 4) {
      if (data[i]! > 0) opaque++
      else transparent++
    }
    expect(opaque).toBeGreaterThan(50)
    expect(transparent).toBeGreaterThan(50)
  })

  it('computes a finite arc layout and respects the pixel budget helper', () => {
    const layout = computePosterLayout(960, 540)
    expect(Number.isFinite(layout.centerX)).toBe(true)
    expect(Number.isFinite(layout.centerY)).toBe(true)
    expect(layout.radius).toBeGreaterThan(0)
    expect(layout.thetaMax).toBeGreaterThan(layout.thetaMin)

    const size = resolveCanvasSize(1920, 1080, 2)
    expect(size.width * size.height).toBeLessThanOrEqual(2_200_000 * 1.05)
  })
})
