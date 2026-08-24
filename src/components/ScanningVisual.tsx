import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { gradientBorderStyle } from "./CameraPermissionVisual"
import { drawFaceMesh, type MeshLayer } from "../camera/faceMeshDraw"
import { useFaceLandmarker, type ExpressionSnapshot, type FaceLandmarkerStatus } from "../camera/useFaceLandmarker"
import { FADE_ANCHOR_A, FADE_ANCHOR_B, useHeadPose } from "../camera/useHeadPose"
import { useLanguage } from "../localization/LanguageContext"

type ScanningVisualProps = {
  stream: MediaStream | null
  /** Called (only when the value actually changes) with whether this is
   *  currently a "valid" scanning moment — a face is tracked and pose is
   *  acceptable, i.e. exactly the states that render no caption below
   *  (see `caption`'s own logic) other than the "no caption" case. Lets
   *  `CameraPermissionScreen` drive `useScanProgress` without this
   *  component owning any progress/timing state itself — it only ever
   *  reports the boolean its own existing status logic already computes. */
  onValidScanChange?: (isValidScanning: boolean) => void
  /** Called (only when the value actually changes) with this instance's
   *  own `useFaceLandmarker` status — added so `CameraPermissionScreen`
   *  can detect a MediaPipe init/runtime failure (`"error"`) and switch
   *  the whole screen over to its error-recovery state, without this
   *  component needing to know anything about that recovery UI itself.
   *  Every other status (`"loading"`/`"tracking"`/`"no-face"`) already has
   *  its own existing, unchanged handling entirely within this
   *  component (the `caption` below) — this callback exists purely for
   *  the one status value this component itself has no further recovery
   *  affordance for. */
  onFaceStatusChange?: (status: FaceLandmarkerStatus) => void
  /** Called *imperatively*, directly from `useFaceLandmarker`'s own
   *  detection loop, with each tracked frame's blendshapes — `null`
   *  while no face is tracked. Added so a caller (e.g.
   *  `useExpressionSampler`, via `CameraPermissionScreen`) can sample
   *  expression data across the scan without this component doing any
   *  sampling, aggregation, or mood interpretation itself. Deliberately
   *  passed straight through to `useFaceLandmarker` below rather than
   *  mirrored into this component's own state and re-forwarded from a
   *  `useEffect` (unlike `onValidScanChange`/`onFaceStatusChange` above,
   *  both rare boolean/enum transitions): blendshapes change on
   *  essentially every animation frame during a real scan, and routing
   *  a value that changes that often through React state at every layer
   *  is exactly what caused a real "Maximum update depth exceeded" crash
   *  during continuous scanning — see `useFaceLandmarker`'s own doc
   *  comment on `onBlendshapes`. */
  onBlendshapesChange?: (blendshapes: ExpressionSnapshot | null) => void
}

export type ScanningVisualHandle = {
  /** Draws the detection video's *current* frame onto an off-screen
   *  canvas — never the mesh canvas, so the result never has any
   *  landmark/overlay content baked in — and returns it as a JPEG data
   *  URL, or `null` if no frame is currently available (e.g. the stream
   *  hasn't produced a frame yet). Mirrors the frame horizontally to
   *  match the selfie-mirrored preview the user has actually been
   *  looking at (see the mirroring doc comment below) rather than the
   *  raw, unmirrored camera frame landmarks are computed against.
   *  Purely synchronous and in-memory — the caller decides what to do
   *  with the returned string; this method itself never stores, uploads,
   *  or persists anything. */
  captureFrame: () => string | null
}

/**
 * The live camera + face-mesh panel shown once camera access is granted —
 * the Scanning-state counterpart to `CameraPermissionVisual`. Approved
 * Figma frames: Desktop `284:2460` (left-visual node `347:227`, 491×491),
 * Mobile `289:6820` (left-visual node `289:6890`, 224×224).
 *
 * Reuses `CameraPermissionVisual`'s exact panel treatment — size, radius,
 * the pink→purple→blue gradient border (`gradientBorderStyle`, imported
 * rather than duplicated), and the four corner marks — since Figma's own
 * geometry for this panel is identical to the permission-prompt panel's;
 * only the *contents* differ. Figma's own asset for those contents is two
 * stacked static mockup photos (a 491×491 background + a 262×262
 * foreground crop) meant to represent what a live scan might look like —
 * necessarily a static illustration, since Figma can't export an actual
 * live camera feed. Both are replaced here by a real `<video>` element
 * (the live stream) plus an overlay `<canvas>` drawing the live landmark
 * mesh, which is what those mockup layers were standing in for.
 *
 * Camera-logic separation: this component owns the `FaceLandmarker`
 * pipeline (`useFaceLandmarker`) itself — the parent screen only owns and
 * passes down the raw `MediaStream` (from `useCameraStream`). Detection
 * always runs against the Mobile tree's `<video>` element (it's mounted
 * regardless of breakpoint, just CSS-hidden above `lg`) since the
 * landmarks' source data — the stream's native `videoWidth`/`videoHeight`
 * — is identical no matter which breakpoint's box happens to be visible;
 * each canvas below maps those same landmarks through its own box size.
 *
 * Both breakpoint trees are mounted at once (one hidden via CSS, not
 * unmounted), so each gets its own `<video>`/`<canvas>` pair rather than
 * sharing one ref. The video+canvas pair in each sits inside a wrapper
 * carrying the mirror transform (`scaleX(-1)`) — standard selfie-camera
 * convention, so the user's own movement reads naturally. Landmarks are
 * computed against the raw, unmirrored video frame and drawn in that same
 * natural coordinate space (see `faceMeshDraw.ts`), so mirroring the
 * wrapper mirrors video and mesh together as one unit — no coordinate
 * flipping needed in the drawing code itself. The corner marks live
 * *outside* this wrapper so their approved Figma positions are never
 * mirrored.
 *
 * A single small non-blocking caption (bottom-center, translucent pill)
 * covers the three states the static Figma export can't depict: model
 * still loading, no face currently in frame, and a MediaPipe/environment
 * failure — in every case the live video preview keeps playing
 * underneath, per Guidelines §8's required fallback recovery states.
 *
 * Exposes `captureFrame` (see `ScanningVisualHandle`) via `forwardRef` so
 * `CameraPermissionScreen` can grab a single still frame — for the Vibe
 * Result screen's static "captured you" visual — at the exact moment
 * scanning completes, without this component needing to know anything
 * about *why* or reach into any progress/completion state of its own.
 * Capturing from the Mobile tree's `<video>` specifically (the same one
 * `useFaceLandmarker` already reads, per the doc comment above) means
 * this works correctly regardless of which breakpoint's tree happens to
 * be visible, since that element exists and keeps receiving frames either
 * way.
 */
export default forwardRef<ScanningVisualHandle, ScanningVisualProps>(function ScanningVisual(
  { stream, onValidScanChange, onFaceStatusChange, onBlendshapesChange },
  ref,
) {
  const { t } = useLanguage()

  // The Mobile tree's `<video>` doubles as the detection source (see doc
  // comment above) — a callback ref (state, not a plain `useRef`) so the
  // `useFaceLandmarker` effect below actually re-runs once the element is
  // available, which a mutated `.current` on a plain ref would not trigger.
  const [detectionVideoEl, setDetectionVideoEl] = useState<HTMLVideoElement | null>(null)
  const videoDesktopRef = useRef<HTMLVideoElement>(null)
  const canvasMobileRef = useRef<HTMLCanvasElement>(null)
  const canvasDesktopRef = useRef<HTMLCanvasElement>(null)

  useImperativeHandle(
    ref,
    () => ({
      captureFrame: () => {
        const video = detectionVideoEl
        if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) return null

        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) return null

        // Mirror horizontally — the video's own pixels are the raw,
        // unmirrored camera frame (see the mirroring doc comment above);
        // the user has only ever seen the mirrored version live, so the
        // captured still should match that, not the raw feed.
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          return canvas.toDataURL("image/jpeg", 0.85)
        } catch {
          // A tainted canvas (e.g. a browser that refuses `toDataURL` for
          // a `getUserMedia` stream under some security policy) is the
          // only realistic failure mode here — fall back to "no frame"
          // rather than throwing, matching this component's existing
          // never-throw posture for camera/detection failures.
          return null
        }
      },
    }),
    [detectionVideoEl],
  )

  const {
    status: faceStatus,
    landmarks,
    videoSize,
    keyLandmarkIndices,
    contourConnectors,
    lipsConnectors,
    tessellationConnectors,
  } = useFaceLandmarker(detectionVideoEl, !!stream, onBlendshapesChange)

  // Pose-aware rendering (head-turn detection + far-side base-mesh fade +
  // the strong-turn guidance state) — layered entirely on top of the
  // detection above via the same `landmarks` it already produces; see
  // `useHeadPose.ts`. `null` while no face is detected, same as
  // `landmarks` itself.
  const headPose = useHeadPose(landmarks)
  const poseState = headPose?.state ?? "front"
  const farSide = headPose?.farSide ?? null
  const fadeIntensity = headPose?.fadeIntensity ?? 0

  useEffect(() => {
    const videoEls = [detectionVideoEl, videoDesktopRef.current]
    for (const videoEl of videoEls) {
      if (!videoEl) continue
      videoEl.srcObject = stream ?? null
      if (stream) {
        videoEl.play().catch(() => {
          // Autoplay can be blocked in some environments; the preview simply
          // stays paused rather than throwing — no crash either way.
        })
      }
    }
  }, [stream, detectionVideoEl])

  useEffect(() => {
    // Four stacked layers, faintest/densest first. Layer 1 is now
    // MediaPipe's own native dense face tessellation
    // (`FaceLandmarker.FACE_LANDMARKS_TESSELATION`, surfaced as
    // `tessellationConnectors` — see `useFaceLandmarker.ts`'s own doc
    // comment) rather than the hand-authored `BASE_MESH_CONNECTORS` this
    // layer used before — replacing an experimental custom-Figma-mask
    // pass (template + controlled deformation, reverted entirely; see
    // this task's own report) with MediaPipe's own native topology,
    // reusing the same styling values that layer already had rather than
    // re-tuning them for the new, much denser connector count:
    //  1. The native dense tessellation, with a small dot at every one of
    //     its own vertices (not lines-only) — reads as a "mesh" rather
    //     than a wireframe.
    //  2. A handful of "key" anchor landmarks (forehead, chin, nose tip,
    //     mouth corners, eye corners, cheekbones, jaw) drawn as slightly
    //     larger, brighter accent nodes on top of layer 1's uniform dots —
    //     unchanged, still real detected landmark indices regardless of
    //     which connector set layer 1 draws.
    //  3. The curated feature contours (face oval, eyes, eyebrows), eased
    //     down closer to the base mesh's own strength than before so eyes/
    //     brows read as integrated into the one mesh instead of a
    //     separately-glowing shape.
    //  4. The lips, still drawn last and still the most emphasized layer
    //     by a clear margin — smile/mouth changes must stay the most
    //     readable thing on screen regardless of how the rest is tuned.
    //
    // Pose-aware on top of that unchanged front-facing baseline: layers 1
    // and 2 (the tessellation and its key-node accents) pick up a
    // `farSideFade` once the head turns enough for `useHeadPose` to
    // identify a far side, fading that side's lines/dots smoothly rather
    // than hiding them abruptly. Layers 3 and 4 (contour and lips)
    // deliberately never get a fade — lips/smile feedback must "remain
    // visible where it is actually detected" regardless of pose, and the
    // approved contour styling isn't in scope for this change. In the
    // strong-turn state the whole mesh is suppressed instead (see the
    // `!isStrongTurn` guard below) rather than leaning on the fade alone.
    const farSideFade =
      farSide && fadeIntensity > 0
        ? {
            nearAnchorIndex: farSide === "B" ? FADE_ANCHOR_A : FADE_ANCHOR_B,
            farAnchorIndex: farSide === "B" ? FADE_ANCHOR_B : FADE_ANCHOR_A,
            intensity: fadeIntensity,
            minOpacityScale: 0.12,
          }
        : undefined
    const isStrongTurn = poseState === "strong"

    const layers: MeshLayer[] | null =
      !isStrongTurn && tessellationConnectors && keyLandmarkIndices && contourConnectors && lipsConnectors
        ? [
            {
              connectors: tessellationConnectors,
              // Lavender mesh-line color per explicit request — #C9C7FF at
              // 65% opacity, i.e. rgb(201,199,255). Restored back to this
              // after a cyan visual test (`rgba(105,213,255,0.70)`,
              // #69D5FF at 70%). Only this layer's `strokeStyle` changed;
              // its `lineWidth`/`pointRadius`/`pointFillStyle` (the dot
              // color) are untouched, along with every other layer.
              strokeStyle: "rgba(201,199,255,0.65)",
              lineWidth: 0.5,
              pointRadius: 0.9,
              pointFillStyle: "rgba(255,255,255,0.5)",
              farSideFade,
            },
            {
              connectors: [],
              pointIndices: [...keyLandmarkIndices],
              pointRadius: 1.6,
              pointFillStyle: "rgba(255,255,255,0.9)",
              farSideFade,
            },
            {
              connectors: contourConnectors,
              strokeStyle: "rgba(255,255,255,0.38)",
              lineWidth: 0.5,
              pointRadius: 0.8,
              pointFillStyle: "rgba(255,255,255,0.5)",
            },
            {
              connectors: lipsConnectors,
              strokeStyle: "rgba(255,255,255,0.62)",
              lineWidth: 0.8,
              pointRadius: 1,
              pointFillStyle: "rgba(255,255,255,0.75)",
            },
          ]
        : null

    const canvases = [canvasMobileRef.current, canvasDesktopRef.current]
    for (const canvas of canvases) {
      if (!canvas) continue
      const ctx = canvas.getContext("2d")
      if (!ctx) continue
      if (landmarks && videoSize && layers) {
        drawFaceMesh(ctx, landmarks, layers, videoSize.width, videoSize.height, canvas.width, canvas.height)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [landmarks, videoSize, tessellationConnectors, keyLandmarkIndices, contourConnectors, lipsConnectors, farSide, fadeIntensity, poseState])

  const caption = !stream
    ? t.cameraPermission.scanningUnavailable
    : faceStatus === "loading"
      ? t.cameraPermission.scanningInitializing
      : faceStatus === "no-face"
        ? t.cameraPermission.scanningNoFace
        : faceStatus === "error"
          ? t.cameraPermission.scanningUnavailable
          : poseState === "strong"
            ? t.cameraPermission.scanningFaceCamera
            : null

  // A "valid" scanning moment is exactly the one case above that shows no
  // caption at all: a face is tracked and pose is acceptable (front or
  // moderate — only `"strong"` counts as unacceptable). Reusing `caption`
  // rather than re-deriving the same condition keeps this single source
  // of truth instead of two boolean expressions that could quietly drift
  // apart.
  const isValidScanning = caption === null

  useEffect(() => {
    onValidScanChange?.(isValidScanning)
  }, [isValidScanning, onValidScanChange])

  useEffect(() => {
    onFaceStatusChange?.(faceStatus)
  }, [faceStatus, onFaceStatusChange])

  return (
    <>
      {/* Mobile (below `lg`) — Figma node `289:6890`. */}
      <div
        className="relative size-[224px] shrink-0 overflow-hidden rounded-[11px] lg:hidden"
        style={gradientBorderStyle("2px")}
      >
        <div className="absolute inset-0 [transform:scaleX(-1)]">
          <video ref={setDetectionVideoEl} muted playsInline autoPlay className="absolute inset-0 size-full object-cover" />
          <canvas ref={canvasMobileRef} width={224} height={224} className="absolute inset-0 size-full" />
        </div>
        {/* Corner marks: 1.2px / 40% opacity here (Mobile, active scanning)
            — reduced from the original 100% per this task's explicit
            request, now matching `CameraPermissionVisual`'s Mobile tree
            (pre-permission, "inactive") opacity exactly, so this state no
            longer visually distinguishes itself from that one by opacity
            alone. Desktop uses a thicker 3px in both files instead (see
            that tree's own corner marks below) — same lengths/positions/
            geometry across every combination; thickness alone now
            distinguishes breakpoint. `VibeResultScreen`'s own photo panel
            still intentionally uses 100% (out of this task's scope; see
            its own doc comment), so it no longer matches this component's
            opacity either — a known, accepted result of this change. */}
        <div className="absolute left-[19.31px] top-[19.31px] size-[45.66px] border-t-[1.2px] border-l-[1.2px] border-white/40" />
        <div className="absolute left-[157.65px] top-[19.31px] size-[45.66px] border-t-[1.2px] border-r-[1.2px] border-white/40" />
        <div className="absolute left-[19.31px] top-[157.65px] size-[45.66px] border-b-[1.2px] border-l-[1.2px] border-white/40" />
        <div className="absolute left-[157.65px] top-[157.65px] size-[45.66px] border-b-[1.2px] border-r-[1.2px] border-white/40" />
        {caption && (
          <div className="absolute inset-x-0 bottom-[14px] flex justify-center px-[12px]" role="status" aria-live="polite">
            <span className="rounded-full bg-[rgba(0,0,0,0.45)] px-[10px] py-[4px] text-center text-[11px] font-light leading-[1.2] text-white">
              {caption}
            </span>
          </div>
        )}
      </div>

      {/* Desktop (`lg` and up) — Figma node `347:227`. */}
      <div
        className="relative hidden size-[491px] shrink-0 overflow-hidden rounded-[24px] lg:block"
        style={gradientBorderStyle("2px")}
      >
        <div className="absolute inset-0 [transform:scaleX(-1)]">
          <video ref={videoDesktopRef} muted playsInline autoPlay className="absolute inset-0 size-full object-cover" />
          <canvas ref={canvasDesktopRef} width={491} height={491} className="absolute inset-0 size-full" />
        </div>
        {/* Corner marks: 3px / 40% opacity (Desktop uses a thicker line
            than Mobile's 1.2px; opacity reduced from 100% — see the Mobile
            tree's own note above). Vertical position re-measured against
            Figma node `398:11261` for the "Restore updated camera/
            scanning visual" task — `top` moved from `43.5` to `40` (bottom
            marks from `346.5` to `343`) to match that node's own rect
            metadata and screenshot, same correction applied to
            `CameraPermissionVisual`'s Desktop tree (see its own doc
            comment) since both share this identical panel geometry;
            `left`/`345.5` is unchanged. */}
        <div className="absolute left-[42.5px] top-[40px] size-[100px] border-t-[3px] border-l-[3px] border-white/40" />
        <div className="absolute left-[345.5px] top-[40px] size-[100px] border-t-[3px] border-r-[3px] border-white/40" />
        <div className="absolute left-[42.5px] top-[343px] size-[100px] border-b-[3px] border-l-[3px] border-white/40" />
        <div className="absolute left-[345.5px] top-[343px] size-[100px] border-b-[3px] border-r-[3px] border-white/40" />
        {caption && (
          <div className="absolute inset-x-0 bottom-[28px] flex justify-center" role="status" aria-live="polite">
            <span className="rounded-full bg-[rgba(0,0,0,0.45)] px-[16px] py-[8px] text-center text-[14px] font-light leading-[1.2] text-white">
              {caption}
            </span>
          </div>
        )}
      </div>
    </>
  )
})
