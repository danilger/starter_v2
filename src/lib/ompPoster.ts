import { paletteForHue, type OmpPalette } from './ompHue'

export const PIXEL_BUDGET = 2_200_000
const TWO_PI = Math.PI * 2
const MAX_SILVER = 30_000

export type PosterLayout = {
  scale: number
  centerX: number
  centerY: number
  radius: number
  thetaMin: number
  thetaMax: number
}

export type PosterImageData = {
  width: number
  height: number
  data: Uint8ClampedArray
}

function hashU32(n: number): number {
  let t = n >>> 0
  t = Math.imul(t ^ (t >>> 16), 2146121005)
  t = Math.imul(t ^ (t >>> 15), 2221713035)
  return (t ^ (t >>> 16)) >>> 0
}

function rand01(seed: number): number {
  return (hashU32(seed) >>> 8) / 16_777_216
}

/** Arc / lens geometry matching omp.sh poster layout. */
export function computePosterLayout(width: number, height: number): PosterLayout {
  const scale = Math.min(2, Math.max(0.5, Math.sqrt((width * height) / (1920 * 1080))))
  const r = -724 * scale + (width - 1920 * scale) * 0.4
  const i = 2000 * scale
  const a = 2500 * scale
  const o = r + Math.sqrt(a * a - i * i)
  const s = width - r
  const c = a > s ? i - Math.sqrt(a * a - s * s) : Number.POSITIVE_INFINITY
  const l = Math.min(o, width * 0.405)
  const u = Math.min(c, height * 0.585)
  const d = width - l
  const f = u
  const p = Math.hypot(d, f)
  const m = p * 0.062
  const h = (p * p) / (8 * m) + m * 0.5
  const g = ((l + width) * 0.5) - (f / p) * (h - m)
  const _ = u * 0.5 + (d / p) * (h - m)

  let thetaMin = Number.POSITIVE_INFINITY
  let thetaMax = Number.NEGATIVE_INFINITY
  for (let n = 0; n <= 32; n++) {
    const rFrac = n / 32
    for (const [px, py] of [
      [width * rFrac, 0],
      [width * rFrac, height],
      [0, height * rFrac],
      [width, height * rFrac],
    ] as const) {
      const e = Math.atan2(py - _, px - g)
      if (e < thetaMin) thetaMin = e
      if (e > thetaMax) thetaMax = e
    }
  }

  return {
    scale,
    centerX: g,
    centerY: _,
    radius: h,
    thetaMin: thetaMin - 0.04,
    thetaMax: thetaMax + 0.04,
  }
}

export function resolveCanvasSize(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  budget = PIXEL_BUDGET,
): { width: number; height: number } {
  const w = Math.max(320, cssWidth)
  const h = Math.max(240, cssHeight)
  const dpr = Math.max(1, devicePixelRatio || 1)
  const scale = Math.sqrt(budget / (w * h))
  const o = Math.max(0.55, Math.min(dpr, scale))
  return { width: Math.round(w * o), height: Math.round(h * o) }
}

/**
 * CPU ImageData poster for a light app base: arc/lens + dither/noise + silver
 * accents; outside the form is transparent so white `--background` shows through.
 */
export function renderPosterImageData(
  width: number,
  height: number,
  hueDegrees: number,
): PosterImageData {
  const palette = paletteForHue(hueDegrees)
  const layout = computePosterLayout(width, height)
  const data = new Uint8ClampedArray(width * height * 4)
  fillPoster(data, width, height, palette, layout)
  return { width, height, data }
}

export function paintPosterOnCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  hueDegrees: number,
): void {
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { data } = renderPosterImageData(width, height, hueDegrees)
  const pixels = Uint8ClampedArray.from(data)
  ctx.putImageData(new ImageData(pixels, width, height), 0, 0)
}

function fillPoster(
  g: Uint8ClampedArray,
  width: number,
  height: number,
  palette: OmpPalette,
  layout: PosterLayout,
): void {
  const { scale, centerX: o, centerY: s, radius: c, thetaMin: l, thetaMax: u } = layout
  const d = (TWO_PI * 2.2) / (u - l)
  const f = 500 * scale
  const silverCount = Math.min(
    MAX_SILVER,
    Math.round(0.1 * 0.25 * (u - l) * (c - f / 2) * f * 0.25),
  )

  const halfW = Math.ceil(width / 2)
  const halfH = Math.ceil(height / 2)
  const accum = new Float32Array(halfW * halfH * 3)
  const mask = new Uint8Array(halfW * halfH)

  const C = 14 * scale
  const ne = 120 * scale
  const re = 600 * scale
  const ie = 10 * scale
  const ae = 30 * scale
  const oe = 5 * scale

  for (let ey = 0; ey < halfH; ey++) {
    const t = ey * 2
    const n = t - s
    for (let rx = 0; rx < halfW; rx++) {
      const a = rx * 2
      const dx = a - o
      const dist = Math.hypot(dx, n) - c
      if (dist < 0) continue

      let strength = 1
      let color: [number, number, number] | null = null

      if (dist < oe) {
        strength *= 1 + 0.16 * Math.sin(Math.atan2(n, dx) * d)
        color = palette.sky
      } else {
        const tSky = Math.exp(-dist / C)
        const tViolet = Math.exp(-dist / ne) * Math.min(1, dist / ie) * 0.85
        const tPlum = Math.exp(-dist / re) * Math.min(1, dist / ae) * 0.7
        const total = Math.min(1, tSky + tViolet + tPlum)
        if (total > 0.003) {
          const roll = rand01(ey * halfW + rx ^ 539_363_090)
          if (roll < tSky) {
            strength *= 1 + 0.16 * Math.sin(Math.atan2(n, dx) * d)
            color = palette.sky
          } else if (roll < tSky + tViolet) {
            color = palette.violet
          } else if (roll < total) {
            color = palette.plum
          }
        }
      }

      if (color) {
        const idx = ey * halfW + rx
        mask[idx] = 1
        accum[idx * 3] = color[0] * strength
        accum[idx * 3 + 1] = color[1] * strength
        accum[idx * 3 + 2] = color[2] * strength
      }
    }
  }

  let se = 0
  let w = 0
  for (let y = 0; y < height; y++) {
    const row = (y >> 1) * halfW
    for (let x = 0; x < width; x++, se++, w += 4) {
      const noise = (rand01(se ^ 2_654_435_769) - 0.5) * 24
      const cell = row + (x >> 1)
      if (mask[cell]) {
        g[w] = accum[cell * 3]! + noise
        g[w + 1] = accum[cell * 3 + 1]! + noise
        g[w + 2] = accum[cell * 3 + 2]! + noise
        g[w + 3] = 255
      } else {
        // Transparent outside the form — white app base shows through.
        g[w] = 0
        g[w + 1] = 0
        g[w + 2] = 0
        g[w + 3] = 0
      }
    }
  }

  for (let e = 0; e < silverCount; e++) {
    const r = hashU32(e ^ 2_769_414_579)
    const theta = l + (u - l) * rand01(r)
    const band = f * (1 - Math.cbrt(rand01(r ^ 1_675_113_877)))
    const m = Math.max(band, 14 * scale)
    const h = rand01(r ^ 3_266_489_909) * m
    const _ = c - h
    const v = 0.004 + rand01(r ^ 668_265_263) * 0.011
    const y = rand01(r ^ 374_761_393) * TWO_PI
    const xAng = theta + (-(0.06 * scale) / v) * (Math.cos(y) / Math.max(_, 1))
    const ee = o + _ * Math.cos(xAng)
    const S = s + _ * Math.sin(xAng)
    const te = Math.max(0, Math.min(h / 3, (m - h) / (m * 0.25)))
    if (te <= 0) continue

    const neX = Math.ceil(ee - 1.5)
    const reY = Math.ceil(S - 1.5)
    for (let py = reY; py < reY + 2; py++) {
      if (py < 0 || py >= height) continue
      for (let px = neX; px < neX + 2; px++) {
        if (px < 0 || px >= width) continue
        const idx = (py * width + px) * 4
        if (g[idx + 3]! === 0) continue
        g[idx]! += (palette.silver[0] - g[idx]!) * te
        g[idx + 1]! += (palette.silver[1] - g[idx + 1]!) * te
        g[idx + 2]! += (palette.silver[2] - g[idx + 2]!) * te
      }
    }
  }

  w = 0
  for (let y = 0; y < height; y++) {
    const n = (y & 511) * 512
    for (let x = 0; x < width; x++, w += 4) {
      if (g[w + 3]! === 0) continue
      const t = rand01(n + (x & 511) ^ 3_266_489_909)
      if (t < 0.045) {
        const target = t < 0.023 ? 0 : 255
        const mix = 10 / 255
        g[w]! += (target - g[w]!) * mix
        g[w + 1]! += (target - g[w + 1]!) * mix
        g[w + 2]! += (target - g[w + 2]!) * mix
      }
    }
  }
}
