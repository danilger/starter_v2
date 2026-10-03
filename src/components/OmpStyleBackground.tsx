import { useEffect, useRef } from 'react'
import { createOmpGpuStencil, type OmpGpuStencil } from '@/lib/ompGpu'
import { HUE_STATIC, selectHue } from '@/lib/ompHue'
import { paintPosterOnCanvas, resolveCanvasSize } from '@/lib/ompPoster'

const CPU_REDRAW_MS = 400

export function OmpStyleBackground() {
  const rootRef = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLCanvasElement>(null)
  const gpuRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const poster = posterRef.current
    const gpuCanvas = gpuRef.current
    if (!root || !poster || !gpuCanvas) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let stencil: OmpGpuStencil | null = null
    let rafId: number | undefined
    let resizeRaf: number | undefined
    let cpuTimer: number | undefined
    let disposed = false
    let elapsedMs = 0
    let clockOrigin: number | undefined
    let lastHue = HUE_STATIC

    const canvasSize = () => {
      const rect = root.getBoundingClientRect()
      return resolveCanvasSize(
        Math.max(320, rect.width),
        Math.max(240, rect.height),
        window.devicePixelRatio || 1,
      )
    }

    const syncElapsed = (now = performance.now()) => {
      if (clockOrigin === undefined) clockOrigin = now - elapsedMs
      elapsedMs = now - clockOrigin
      return elapsedMs
    }

    const currentHue = (timeMs: number) =>
      selectHue({
        timeMs,
        reducedMotion: motionQuery.matches,
      })

    const paintCpu = (hue: number) => {
      if (!poster.isConnected) return
      const { width, height } = canvasSize()
      paintPosterOnCanvas(poster, width, height, hue)
      lastHue = hue
    }

    const stopRaf = () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId)
        rafId = undefined
      }
    }

    const stopCpuTimer = () => {
      if (cpuTimer !== undefined) {
        window.clearInterval(cpuTimer)
        cpuTimer = undefined
      }
    }

    const freeGpu = () => {
      if (!stencil) return
      stencil.free()
      stencil = null
    }

    const frame = (now: number) => {
      if (!stencil || disposed) return
      const t = syncElapsed(now)
      const hue = currentHue(t)
      lastHue = hue
      stencil.render(t, hue)
      if (!motionQuery.matches) {
        rafId = requestAnimationFrame(frame)
      }
    }

    const startMotion = () => {
      stopRaf()
      if (motionQuery.matches) {
        paintCpu(HUE_STATIC)
        stencil?.render(elapsedMs, HUE_STATIC)
        stopCpuTimer()
        return
      }

      if (stencil) {
        rafId = requestAnimationFrame(frame)
      }

      stopCpuTimer()
      cpuTimer = window.setInterval(() => {
        const hue = currentHue(syncElapsed())
        paintCpu(hue)
      }, CPU_REDRAW_MS)
    }

    const resize = () => {
      const { width, height } = canvasSize()
      paintCpu(lastHue)
      if (stencil) {
        stencil.resize(width, height)
        stencil.render(elapsedMs, lastHue)
      }
    }

    const onResize = () => {
      if (resizeRaf !== undefined) return
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = undefined
        resize()
      })
    }

    const onMotionChange = () => {
      startMotion()
    }

    const onPageHide = () => {
      stopRaf()
      stopCpuTimer()
    }

    paintCpu(currentHue(0))
    window.addEventListener('resize', onResize, { passive: true })
    motionQuery.addEventListener('change', onMotionChange)
    window.addEventListener('pagehide', onPageHide)

    const bootRaf = requestAnimationFrame(() => {
      void createOmpGpuStencil(gpuCanvas, lastHue)
        .then((created) => {
          if (disposed) {
            created?.free()
            return
          }
          if (!created) {
            startMotion()
            return
          }
          stencil = created
          const { width, height } = canvasSize()
          stencil.resize(width, height)
          startMotion()
        })
        .catch(() => {
          freeGpu()
          if (!disposed) startMotion()
        })
    })

    // No-GPU path still needs the color cycle.
    startMotion()

    return () => {
      disposed = true
      cancelAnimationFrame(bootRaf)
      stopRaf()
      stopCpuTimer()
      if (resizeRaf !== undefined) cancelAnimationFrame(resizeRaf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pagehide', onPageHide)
      motionQuery.removeEventListener('change', onMotionChange)
      freeGpu()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-clip"
    >
      <div className="absolute inset-0 [transform:scaleY(-1)]">
        <canvas
          ref={posterRef}
          aria-hidden
          className="absolute inset-0 h-full w-full"
          style={{ imageRendering: 'pixelated' }}
        />
        <canvas
          ref={gpuRef}
          aria-hidden
          className="absolute inset-0 h-full w-full"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <span
        aria-hidden
        className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(to_bottom,rgba(0,0,0,0.22)_0_1px,transparent_1px_3px)]"
      />
    </div>
  )
}
