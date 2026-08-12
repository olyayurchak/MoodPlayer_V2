export type NormalizedPoint = { x: number; y: number }

/** A single mesh connector — an edge between two landmark indices. Typed
 *  locally rather than imported from `@mediapipe/tasks-vision` so this
 *  module never statically imports that package: `useFaceLandmarker`
 *  already loads it via a dynamic `import()` (only once camera access is
 *  granted), and a static import anywhere else would pull the whole
 *  vision bundle back into the main chunk regardless — confirmed by a
 *  Vite `INEFFECTIVE_DYNAMIC_IMPORT` build warning before this was split
 *  out. */
export type Connector = { start: number; end: number }

/**
 * Optional per-layer far-side fade — see `useHeadPose.ts` for where the
 * inputs come from. Applied as a smooth canvas gradient across the whole
 * layer (see `buildFadeGradient`), not a per-point/per-edge decision, so
 * the fade has no hard edge anywhere: every point on the near→far axis
 * gets its own interpolated opacity for free from the gradient itself.
 */
export type FarSideFade = {
  /** Landmark index anchoring the gradient's near-side edge — this and
   *  `farAnchorIndex` should be a genuine left/right mirror pair (not
   *  just visually similar positions); they only anchor the gradient's
   *  physical placement in canvas-pixel space, nothing about them is
   *  redrawn or restyled by this fade itself. */
  nearAnchorIndex: number
  farAnchorIndex: number
  /** 0 = no fade (both sides render at the layer's normal opacity); 1 =
   *  the far side is scaled down to `minOpacityScale` of its normal
   *  opacity. Values between interpolate the fade's *strength*, not the
   *  underlying line/point styling. */
  intensity: number
  /** How much of the layer's own opacity survives at the far anchor when
   *  `intensity` is 1 — e.g. `0.12` fades the far side down to 12% of its
   *  normal opacity rather than fully to zero, so a genuinely-tracked
   *  far-side edge never disappears outright while still in range. */
  minOpacityScale: number
}

/**
 * One visually-distinct pass of the mesh — its own connector list plus its
 * own line/point styling. `drawFaceMesh` draws layers in array order, so
 * earlier layers sit visually underneath later ones (e.g. a faint dense
 * mesh first, crisp feature contours on top, the lips emphasized last).
 *
 * `strokeStyle`/`lineWidth` are optional: omit both (or pass an empty
 * `connectors` list) for a points-only accent pass — e.g. a small set of
 * "key" landmarks drawn slightly larger/brighter than the rest of a mesh,
 * without also drawing a redundant duplicate of that mesh's own lines.
 *
 * `pointRadius` is optional: omit it to draw a layer as lines only.
 * `pointIndices` is optional: when omitted, points are drawn at every
 * landmark index touched by this layer's own `connectors` (the original
 * behavior); when provided, points are drawn at exactly those indices
 * instead — used for the key-landmark accent pass above, which has no
 * connectors of its own to derive points from.
 *
 * `farSideFade` is optional: omit it (or pass `intensity: 0`) for the
 * layer's exact previous, unfaded behavior — the fade adds zero overhead
 * and zero visual change on a front-facing pose.
 */
export type MeshLayer = {
  connectors: Connector[]
  strokeStyle?: string
  lineWidth?: number
  pointRadius?: number
  pointFillStyle?: string
  pointIndices?: number[]
  farSideFade?: FarSideFade
}

/**
 * Maps a normalized (0–1, video-space) landmark point to the overlay
 * canvas's own pixel coordinates, replicating the same crop CSS
 * `object-fit: cover` applies whenever the camera's native stream
 * dimensions don't match the square preview box — otherwise the mesh
 * would drift off the visible, cropped video the moment the two aspect
 * ratios differ (true for essentially every real webcam).
 */
export function mapObjectCoverPoint(
  point: NormalizedPoint,
  videoWidth: number,
  videoHeight: number,
  boxWidth: number,
  boxHeight: number,
): NormalizedPoint {
  const videoAspect = videoWidth / videoHeight
  const boxAspect = boxWidth / boxHeight

  let scale: number
  let offsetX = 0
  let offsetY = 0

  if (videoAspect > boxAspect) {
    // Video is relatively wider than the box → cropped on the left/right.
    scale = boxHeight / videoHeight
    offsetX = (videoWidth * scale - boxWidth) / 2
  } else {
    // Video is relatively taller than the box → cropped top/bottom.
    scale = boxWidth / videoWidth
    offsetY = (videoHeight * scale - boxHeight) / 2
  }

  return {
    x: point.x * videoWidth * scale - offsetX,
    y: point.y * videoHeight * scale - offsetY,
  }
}

/** Scales an `rgba(r, g, b, a)` (or `rgb(r, g, b)`) color string's own
 *  alpha component by `scale`, keeping its RGB unchanged. Falls back to
 *  returning `color` unmodified if it isn't in that form — every color
 *  this module actually uses is an `rgba(...)` literal, so this is only a
 *  defensive fallback, never expected to trigger in practice. */
function scaleColorAlpha(color: string, scale: number): string {
  const match = color.match(/^rgba?\(([^)]+)\)$/)
  if (!match) return color
  const parts = match[1].split(",").map((part) => part.trim())
  const [r, g, b] = parts
  const baseAlpha = parts.length > 3 ? Number.parseFloat(parts[3]) : 1
  const alpha = Math.min(1, Math.max(0, baseAlpha * scale))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Builds a two-stop linear gradient running from a layer's near-side
 * anchor to its far-side anchor (both already mapped to canvas-pixel
 * space), at full `baseColor` opacity near and `baseColor` scaled down by
 * the fade's strength far. Used as `strokeStyle`/`fillStyle` in place of a
 * plain color string, so the whole layer fades smoothly and continuously
 * across the face with no hard edge anywhere along that axis — canvas
 * gradients interpolate every pixel along it, not just the two anchors.
 *
 * The gradient's axis is extended a bit beyond the two anchor points
 * (`extend`) so the fade reaches close to its lowest opacity by roughly
 * the true face edge, rather than stopping exactly at the anchor
 * landmarks themselves (which sit a little inboard of the actual
 * temple/cheekbone edge).
 *
 * Returns `null` (meaning: use the plain color, no fade) if either
 * anchor's mapped position is unavailable this frame or the fade's
 * `intensity` is 0.
 */
function buildFadeGradient(
  ctx: CanvasRenderingContext2D,
  mapped: NormalizedPoint[],
  fade: FarSideFade,
  baseColor: string,
): CanvasGradient | null {
  if (fade.intensity <= 0) return null
  const near = mapped[fade.nearAnchorIndex]
  const far = mapped[fade.farAnchorIndex]
  if (!near || !far) return null

  const extend = 0.35
  const dx = far.x - near.x
  const dy = far.y - near.y
  const x0 = near.x - dx * extend
  const y0 = near.y - dy * extend
  const x1 = far.x + dx * extend
  const y1 = far.y + dy * extend

  const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
  const farAlphaScale = 1 - fade.intensity * (1 - fade.minOpacityScale)
  gradient.addColorStop(0, baseColor)
  gradient.addColorStop(1, scaleColorAlpha(baseColor, farAlphaScale))
  return gradient
}

/**
 * Draws the live face-scanning mesh onto `ctx` as a stack of styled
 * `layers` — thin connector lines, with small dots layered on top for
 * layers that opt into them. Draws in the video's own natural (unmirrored)
 * coordinate space; the caller mirrors the whole video+canvas layer
 * together via a single CSS transform, so this function never needs to
 * flip coordinates itself.
 */
export function drawFaceMesh(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedPoint[],
  layers: MeshLayer[],
  videoWidth: number,
  videoHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  if (videoWidth <= 0 || videoHeight <= 0) return

  const mapped = landmarks.map((point) =>
    mapObjectCoverPoint(point, videoWidth, videoHeight, canvasWidth, canvasHeight),
  )

  for (const layer of layers) {
    if (layer.connectors.length > 0 && layer.strokeStyle !== undefined && layer.lineWidth !== undefined) {
      const strokeGradient = layer.farSideFade ? buildFadeGradient(ctx, mapped, layer.farSideFade, layer.strokeStyle) : null
      ctx.strokeStyle = strokeGradient ?? layer.strokeStyle
      ctx.lineWidth = layer.lineWidth

      ctx.beginPath()
      for (const connector of layer.connectors) {
        const start = mapped[connector.start]
        const end = mapped[connector.end]
        if (!start || !end) continue
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
      }
      ctx.stroke()
    }

    if (layer.pointRadius) {
      const drawnPoints = new Set<number>(layer.pointIndices ?? [])
      for (const connector of layer.connectors) {
        drawnPoints.add(connector.start)
        drawnPoints.add(connector.end)
      }

      const baseFill = layer.pointFillStyle ?? layer.strokeStyle ?? "white"
      const fillGradient = layer.farSideFade ? buildFadeGradient(ctx, mapped, layer.farSideFade, baseFill) : null
      ctx.fillStyle = fillGradient ?? baseFill
      for (const index of drawnPoints) {
        const point = mapped[index]
        if (!point) continue
        ctx.beginPath()
        ctx.arc(point.x, point.y, layer.pointRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}
