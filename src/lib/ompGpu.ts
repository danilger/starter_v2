import { computePosterLayout } from './ompPoster'
import { paletteForHue } from './ompHue'

export type OmpGpuStencil = {
  resize: (width: number, height: number) => void
  render: (timeMs: number, hueDegrees: number) => void
  free: () => void
}

const SHADER = /* wgsl */ `
struct Uniforms {
  size: vec2f,
  time: f32,
  _pad: f32,
  center: vec2f,
  radius: f32,
  scale: f32,
  sky: vec4f,
  violet: vec4f,
  plum: vec4f,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs_main(@builtin(vertex_index) idx: u32) -> VSOut {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0),
  );
  var out: VSOut;
  let p = positions[idx];
  out.pos = vec4f(p, 0.0, 1.0);
  out.uv = vec2f((p.x + 1.0) * 0.5, (1.0 - p.y) * 0.5);
  return out;
}

fn hash21(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

fn sprayTint() -> vec3f {
  // Tinted for light/white base (sky + violet + bright), not pure white.
  return (u.sky.xyz * 0.28 + u.violet.xyz * 0.42 + vec3f(250.0, 250.0, 252.0) * 0.3) / 255.0;
}

@fragment
fn fs_main(inp: VSOut) -> @location(0) vec4f {
  let xy = inp.uv * u.size;
  let d = length(xy - u.center) - u.radius;
  let t = u.time * 0.001;
  let frame = floor(t * 3.0);

  // Hollow-side discrete spray (flying dots into empty space near crest).
  if (d < 0.0) {
    let depth = -d;
    let reach = 200.0 * u.scale;
    if (depth > reach) {
      return vec4f(0.0);
    }
    let fall = 1.0 - depth / reach;
    let density = fall * fall * 0.07;
    let cell = floor(xy * 0.55) + vec2f(frame);
    if (hash21(cell) < density) {
      let a = 0.35 + 0.5 * fall;
      return vec4f(sprayTint(), a);
    }
    return vec4f(0.0);
  }

  let ang = atan2(xy.y - u.center.y, xy.x - u.center.x);
  let pulse = 0.55 + 0.45 * sin(ang * 18.0 + t * 1.2);
  let band = exp(-d / (14.0 * u.scale)) * pulse;
  let mist = exp(-d / (120.0 * u.scale)) * clamp(d / (10.0 * u.scale), 0.0, 1.0) * 0.75;
  let deep = exp(-d / (600.0 * u.scale)) * clamp(d / (30.0 * u.scale), 0.0, 1.0) * 0.55;
  let n = hash21(floor(xy * 0.35) + floor(vec2f(t * 2.0)));

  var rgb = u.sky.xyz * band;
  rgb += u.violet.xyz * mist * (0.65 + 0.35 * n);
  rgb += u.plum.xyz * deep;
  var alpha = clamp(band * 0.85 + mist * 0.45 + deep * 0.35, 0.0, 0.9);

  // Sparse speckles beyond the soft mist — denser near crest, sparse farther out.
  let sprayReach = 280.0 * u.scale;
  if (d < sprayReach) {
    let fall = 1.0 - d / sprayReach;
    let density = fall * fall * fall * 0.045;
    let cell = floor(xy * 0.5) + vec2f(frame + 17.0);
    if (hash21(cell) < density) {
      let speckA = 0.4 + 0.45 * fall;
      let tint = sprayTint();
      rgb = max(rgb, tint * 255.0);
      alpha = max(alpha, speckA);
    }
  }

  if (alpha < 0.01) {
    return vec4f(0.0);
  }
  return vec4f(rgb / 255.0, alpha);
}
`

type GpuHandles = {
  device: GPUDevice
  context: GPUCanvasContext
  pipeline: GPURenderPipeline
  uniformBuffer: GPUBuffer
  bindGroup: GPUBindGroup
  width: number
  height: number
  format: GPUTextureFormat
}

function writeUniforms(
  device: GPUDevice,
  buffer: GPUBuffer,
  width: number,
  height: number,
  timeMs: number,
  hueDegrees: number,
): void {
  const layout = computePosterLayout(width, height)
  const palette = paletteForHue(hueDegrees)
  // std140-ish packing for our WGSL struct (vec2/f32/vec4 alignment).
  const data = new Float32Array(24)
  data[0] = width
  data[1] = height
  data[2] = timeMs
  data[3] = 0
  data[4] = layout.centerX
  data[5] = layout.centerY
  data[6] = layout.radius
  data[7] = layout.scale
  data[8] = palette.sky[0]
  data[9] = palette.sky[1]
  data[10] = palette.sky[2]
  data[11] = 1
  data[12] = palette.violet[0]
  data[13] = palette.violet[1]
  data[14] = palette.violet[2]
  data[15] = 1
  data[16] = palette.plum[0]
  data[17] = palette.plum[1]
  data[18] = palette.plum[2]
  data[19] = 1
  device.queue.writeBuffer(buffer, 0, data)
}

export async function createOmpGpuStencil(
  canvas: HTMLCanvasElement,
  initialHue: number,
): Promise<OmpGpuStencil | null> {
  if (!('gpu' in navigator) || !navigator.gpu) return null

  try {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) return null
    const device = await adapter.requestDevice()
    const context = canvas.getContext('webgpu') as GPUCanvasContext | null
    if (!context) return null

    const format = navigator.gpu.getPreferredCanvasFormat()
    const module = device.createShaderModule({ code: SHADER })
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'vs_main' },
      fragment: {
        module,
        entryPoint: 'fs_main',
        targets: [{
          format,
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
          },
        }],
      },
      primitive: { topology: 'triangle-list' },
    })

    // GPUBufferUsage.UNIFORM | COPY_DST — numeric fallback for TS lib gaps.
    const uniformBuffer = device.createBuffer({
      size: 96,
      usage: 0x0040 | 0x0008,
    })
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    })

    const handles: GpuHandles = {
      device,
      context,
      pipeline,
      uniformBuffer,
      bindGroup,
      width: 0,
      height: 0,
      format,
    }

    let disposed = false
    let hue = initialHue

    const configure = (width: number, height: number) => {
      handles.width = width
      handles.height = height
      canvas.width = width
      canvas.height = height
      context.configure({
        device,
        format,
        alphaMode: 'premultiplied',
      })
    }

    const render = (timeMs: number, hueDegrees: number) => {
      if (disposed || handles.width === 0) return
      hue = hueDegrees
      writeUniforms(device, uniformBuffer, handles.width, handles.height, timeMs, hue)
      const encoder = device.createCommandEncoder()
      const view = context.getCurrentTexture().createView()
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view,
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      })
      pass.setPipeline(pipeline)
      pass.setBindGroup(0, bindGroup)
      pass.draw(3)
      pass.end()
      device.queue.submit([encoder.finish()])
    }

    return {
      resize(width, height) {
        if (disposed) return
        if (width === handles.width && height === handles.height) return
        configure(width, height)
        render(0, hue)
      },
      render(timeMs, hueDegrees) {
        render(timeMs, hueDegrees)
      },
      free() {
        if (disposed) return
        disposed = true
        try {
          uniformBuffer.destroy()
          device.destroy()
        } catch {
          // ignore teardown races
        }
      },
    }
  } catch {
    return null
  }
}
