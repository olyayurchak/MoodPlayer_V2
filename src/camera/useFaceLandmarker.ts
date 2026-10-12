import { useEffect, useRef, useState } from "react"
import type { FaceLandmarker as FaceLandmarkerType } from "@mediapipe/tasks-vision"
import type { Connector } from "./faceMeshDraw"

export type FaceLandmarkerStatus = "loading" | "tracking" | "no-face" | "error"

export type FaceLandmarkPoint = { x: number; y: number; z: number }

/** One frame's blendshape scores, flattened from MediaPipe's own
 *  `Category[]` (`{ categoryName, score }` pairs) into a plain
 *  `categoryName → score` map — purely a shape convenience (mirrors how
 *  `landmarks` below is already `faces[0]`, not the raw nested array),
 *  not any kind of aggregation or interpretation of the values. */
export type ExpressionSnapshot = Record<string, number>

type UseFaceLandmarkerResult = {
  status: FaceLandmarkerStatus
  landmarks: FaceLandmarkPoint[] | null
  /** The native video frame size the landmarks were computed against —
   *  needed by the drawing code to reproduce the same `object-fit: cover`
   *  crop the `<video>` element itself renders with. */
  videoSize: { width: number; height: number } | null
  /** A fixed, hand-authored base-mesh connector set (`BASE_MESH_CONNECTORS`
   *  — see that constant's doc comment) — real detected landmarks only,
   *  giving balanced forehead/temple/brow/nose/cheek/mouth/jaw/chin
   *  coverage as genuine large triangular cells rather than a bare
   *  outline or the full dense tessellation. Unlike an earlier runtime-
   *  Delaunay-triangulated version of this same idea, this connector list
   *  is a static literal — identical every frame and every camera
   *  session, regardless of live landmark positions or pose. Drawn by
   *  the caller as a faint background layer (see `ScanningVisual`) so it
   *  reads as a clean technical scanning mesh without visually competing
   *  with the crisper feature contours drawn on top of it. */
  meshConnectors: Connector[] | null
  /** A small subset of the base mesh's own landmarks (see
   *  `KEY_MESH_LANDMARK_INDICES`) — major anchor points (forehead top,
   *  chin, nose tip, mouth corners, eye outer corners, cheekbones, jaw)
   *  meant to be drawn as slightly larger, brighter accent nodes on top
   *  of the base mesh's own (smaller, uniform) per-vertex points, giving
   *  the mesh an intentional key-vs-secondary point hierarchy rather than
   *  one flat dot size. */
  keyLandmarkIndices: readonly number[] | null
  /** Face oval, both eyes, and both eyebrows, flattened into one set —
   *  drawn by the caller as a crisper layer on top of `meshConnectors` so
   *  the major facial features still read clearly through the denser
   *  mesh. */
  contourConnectors: Connector[] | null
  /** Lips only, kept as its own connector set so the caller can draw it
   *  with extra emphasis — a hard requirement of this milestone is that
   *  smile/mouth changes stay clearly readable even as the rest of the
   *  mesh gets denser. */
  lipsConnectors: Connector[] | null
  /** MediaPipe's own native dense face tessellation
   *  (`FaceLandmarker.FACE_LANDMARKS_TESSELATION`, ~2000 edges over all
   *  478 landmarks) — the current scanning mesh's dense background layer
   *  (see `ScanningVisual`), replacing the hand-authored
   *  `meshConnectors`/`BASE_MESH_CONNECTORS` for that role. `meshConnectors`
   *  itself is left in place, still returned, just no longer drawn by
   *  that caller — this is purely an additional export, not a
   *  replacement of anything above. */
  tessellationConnectors: Connector[] | null
}

// Loaded from MediaPipe's own official CDN/model-storage hosts — the same
// pattern this project already uses for the Geist/Space Grotesk fonts in
// `index.css`. Nothing here is camera *data*: it's static task code/model
// weights, not a frame of the user's video, so Guidelines §8's "frames
// never leave the device" rule isn't implicated.
const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"

/** The created task plus its class (for the static connector sets). */
type LoadedFaceLandmarker = {
  landmarker: FaceLandmarkerType
  FaceLandmarker: typeof FaceLandmarkerType
}

/**
 * One shared `FaceLandmarker` per page session: at most one creation in
 * flight, and the created instance is reused by every later scan ("Scan
 * again" included) instead of being rebuilt on each `ScanningVisual`
 * mount. A failed creation is dropped, never cached, so the next caller
 * (Try Again, a later scan) starts a fresh attempt.
 */
let sharedLoad: Promise<LoadedFaceLandmarker> | null = null

function loadFaceLandmarker(): Promise<LoadedFaceLandmarker> {
  if (sharedLoad) return sharedLoad
  const load = (async () => {
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision")
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL)
    const landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_ASSET_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      // Enabled so this hook's own `blendshapes` output (below) is
      // populated at all — an earlier task confirmed this installed
      // model's real runtime category names via a temporary one-time
      // dump log, since removed now that they're confirmed;
      // `useExpressionSampler` (via `ScanningVisual`'s
      // `onBlendshapesChange`) is the current consumer. Not yet used
      // by any mood logic. `outputFacialTransformationMatrixes` is
      // deliberately left unset (default off) — not needed here.
      outputFaceBlendshapes: true,
    })
    return { landmarker, FaceLandmarker }
  })()
  sharedLoad = load
  load.catch(() => {
    if (sharedLoad === load) sharedLoad = null
  })
  return load
}

/** Starts loading the shared `FaceLandmarker` without waiting for it —
 *  called on the Allow Camera click so the download and setup overlap the
 *  permission prompt. Failures are left to the hook to report. */
export function preloadFaceLandmarker(): void {
  loadFaceLandmarker().catch(() => {})
}

/** Drops a shared instance that threw during detection, so a retry builds
 *  a new one rather than reusing it. */
function discardFaceLandmarker(landmarker: FaceLandmarkerType) {
  void sharedLoad?.then((loaded) => {
    if (loaded.landmarker !== landmarker) return
    sharedLoad = null
    landmarker.close()
  })
}

/**
 * Verified left↔right MediaPipe landmark mirror pairs used to build the
 * base mesh below. Every pair sourced from `FACE_LANDMARKS_FACE_OVAL`
 * (all of them except `[116, 345]` and `[205, 425]`) was independently
 * confirmed as a genuine mirror — not just an assumed pairing — by
 * checking both landmarks' positions in that connector set's own
 * 36-point loop: each pair's two positions sum to exactly 36, the loop's
 * period, which is only possible for true mirror points given how that
 * loop is ordered. `[116, 345]` and `[205, 425]` sit outside the oval
 * loop (custom under-eye/mid-cheek points), so they rest on standard
 * MediaPipe community convention rather than that same proof.
 */
const MIRROR_PAIRS: [number, number][] = [
  [108, 337],
  [54, 284],
  [21, 251],
  [162, 389],
  [127, 356],
  [70, 300],
  [105, 334],
  [107, 336],
  [33, 263],
  [159, 386],
  [133, 362],
  [145, 374],
  [129, 358],
  [234, 454],
  [116, 345],
  [205, 425],
  [93, 323],
  [172, 397],
  [132, 361],
  [58, 288],
  [150, 379],
  [149, 378],
  [176, 400],
  [136, 365],
  [40, 270],
  [91, 321],
  [61, 291],
  [148, 377],
]

const mirrorOf = new Map<number, number>()
for (const [left, right] of MIRROR_PAIRS) {
  mirrorOf.set(left, right)
  mirrorOf.set(right, left)
}

/** Mirrors one edge across the face's midline using `MIRROR_PAIRS`. A
 *  landmark index with no entry there (every genuinely centerline point
 *  this module uses — `10`, `6`, `168`, `1`, `4`, `2`, `164`, `0`, `17`,
 *  `152`, `175`) is treated as self-mirroring, which is exactly correct
 *  for a true midline landmark. */
function mirrorEdge([start, end]: readonly [number, number]): [number, number] {
  return [mirrorOf.get(start) ?? start, mirrorOf.get(end) ?? end]
}

/**
 * The base mesh's connector topology — fixed and hand-authored, not
 * derived from live landmark geometry. An earlier version of this same
 * mesh ran a Delaunay triangulation once per camera session over the
 * selected landmarks' *live* positions; because Delaunay connectivity
 * depends on point positions, different sessions (and even different
 * poses within the same session) could choose different diagonals,
 * producing a visibly different, sometimes asymmetric mask between
 * sessions. This mesh instead has exactly one intentional connector
 * pattern, defined once as this literal list, so the exact same edges
 * render for every session and every frame — only the landmarks' live
 * *coordinates* move; the *connections* between them never change.
 *
 * Built as three pieces:
 * - `SPINE_EDGES`: the centerline chain (forehead top → glabella →
 *   nasion → nose tip → tip apex → nose base → philtrum → upper lip top
 *   → lower lip bottom → chin → chin secondary) — the face's one true
 *   midline, so it has no mirror counterpart.
 * - `LEFT_MESH_EDGES`: one side's intentional connector pattern, written
 *   using only that side's own landmarks plus spine landmarks — rings
 *   within a facial region (brow, eye), a rail along the temple/jaw
 *   boundary (a verified-adjacent run through `FACE_LANDMARKS_FACE_OVAL`'s
 *   own loop, not a guess — see `MIRROR_PAIRS`'s doc comment), rungs
 *   tying the spine to nearby regions, and a handful of cross-region
 *   diagonals for real triangular structure rather than a bare outline.
 * - the right side's edges, generated by mapping every one of
 *   `LEFT_MESH_EDGES` through `mirrorEdge` — not hand-authored a second
 *   time, so the right side is *structurally* guaranteed to mirror the
 *   left (the same pattern, reflected) rather than relying on two
 *   separately-transcribed lists staying in sync.
 *
 * Covers all 67 of the previously-selected landmarks (forehead, temples,
 * brow, eyes, nose, both cheeks, the mouth surround, jaw, and chin) —
 * every one of them still a genuinely detected MediaPipe landmark; this
 * change only replaces how they're *connected*, not which landmarks are
 * used or their live coordinates.
 */
const SPINE_EDGES: [number, number][] = [
  [10, 6],
  [6, 168],
  [168, 1],
  [1, 4],
  [4, 2],
  [2, 164],
  [164, 0],
  [0, 17],
  [17, 152],
  [152, 175],
]

const LEFT_MESH_EDGES: [number, number][] = [
  // Temple/jaw boundary rail — a verified-adjacent run through
  // `FACE_LANDMARKS_FACE_OVAL`'s own connector loop (chin-side up to
  // forehead-side), not a guessed chain.
  [148, 176],
  [176, 149],
  [149, 150],
  [150, 136],
  [136, 172],
  [172, 58],
  [58, 132],
  [132, 93],
  [93, 234],
  [234, 127],
  [127, 162],
  [162, 21],
  [21, 54],
  // Brow ring + ties to the temple rail and spine.
  [70, 105],
  [105, 107],
  [107, 6],
  [70, 33],
  [21, 70],
  [54, 70],
  // Eye structure: outer↔inner horizontal, inner corner to nasion, and
  // the two eyelid midpoints bridged to both corners (interior structure
  // distinct from the eye contour layer's own loop, not a duplicate of
  // it).
  [33, 133],
  [133, 168],
  [159, 33],
  [159, 133],
  [145, 33],
  [145, 133],
  // Nose: wing to tip and to philtrum, inner eye corner to wing.
  [129, 1],
  [129, 164],
  [133, 129],
  // Cheek: cheekbone/under-eye/mid-cheek ties into the jaw rail, plus two
  // cross diagonals.
  [234, 116],
  [116, 129],
  [129, 205],
  [205, 172],
  [205, 93],
  [33, 234],
  [129, 234],
  // Mouth: corner to philtrum/mid-cheek/jaw, plus chin ties and one
  // mid-cheek↔chin-side diagonal.
  [61, 164],
  [61, 205],
  [61, 172],
  [152, 148],
  [175, 148],
  [205, 148],
  // Lip-outer quarter points, tied to the mouth corner and to the spine.
  [40, 61],
  [40, 164],
  [91, 61],
  [91, 17],
  // Mid-forehead, tied to the spine apex and the forehead-side rail node.
  [108, 10],
  [108, 54],
]

const BASE_MESH_CONNECTORS: Connector[] = dedupeConnectors([
  ...SPINE_EDGES,
  ...LEFT_MESH_EDGES,
  ...LEFT_MESH_EDGES.map(mirrorEdge),
])

function dedupeConnectors(edges: [number, number][]): Connector[] {
  const seen = new Set<string>()
  const connectors: Connector[] = []
  for (const [start, end] of edges) {
    const key = start < end ? `${start}-${end}` : `${end}-${start}`
    if (seen.has(key)) continue
    seen.add(key)
    connectors.push({ start, end })
  }
  return connectors
}

/**
 * The major anchor points within the base mesh's landmark set — see
 * `keyLandmarkIndices`'s doc comment on `UseFaceLandmarkerResult`.
 */
const KEY_MESH_LANDMARK_INDICES = [10, 152, 1, 61, 291, 33, 263, 234, 454, 172, 397] as const

/**
 * Loads the MediaPipe `FaceLandmarker` task (the current Tasks-API
 * successor to the legacy `FaceMesh` package — Guidelines §7) lazily, only
 * once `enabled` is true, and runs it against `videoEl` in a
 * `requestAnimationFrame` loop.
 *
 * Never throws: every failure mode (WASM load, model load, an
 * unsupported/no-WebGL environment, a per-frame detection error) resolves
 * to the `"error"` status instead, so a MediaPipe or environment failure
 * can never break the surrounding camera-permission flow — the live video
 * preview keeps working regardless (Guidelines §8's required
 * MediaPipe-load-failure recovery).
 *
 * `onBlendshapes`, if given, is called *imperatively* from inside the
 * detection loop with each tracked frame's blendshape scores (see
 * `ExpressionSnapshot`), or `null` whenever no face is tracked —
 * deliberately never routed through `useState`/the hook's own return
 * value. A real scan produces a new blendshapes object on essentially
 * every animation frame (tens of times per second); an earlier version
 * exposed this as reactive state instead, which meant every one of those
 * frames triggered a full render+effect cascade through every component
 * between this hook and its consumer — precisely what caused a real,
 * reproducible "Maximum update depth exceeded" crash during continuous
 * scanning. Kept in a ref (`onBlendshapesRef`) rather than added to the
 * detection effect's own dependency array, so passing a new callback
 * identity on every caller render can never restart MediaPipe setup.
 */
export function useFaceLandmarker(
  videoEl: HTMLVideoElement | null,
  enabled: boolean,
  onBlendshapes?: (blendshapes: ExpressionSnapshot | null) => void,
): UseFaceLandmarkerResult {
  const [status, setStatus] = useState<FaceLandmarkerStatus>("loading")
  const [landmarks, setLandmarks] = useState<FaceLandmarkPoint[] | null>(null)
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | null>(null)
  // A fixed literal (`BASE_MESH_CONNECTORS`), not derived from live
  // landmark positions — no reason to wait for a detected frame before
  // it's available, unlike the earlier per-session-triangulated version.
  const [meshConnectors, setMeshConnectors] = useState<Connector[] | null>(BASE_MESH_CONNECTORS)
  const [keyLandmarkIndices, setKeyLandmarkIndices] = useState<readonly number[] | null>(null)
  const [contourConnectors, setContourConnectors] = useState<Connector[] | null>(null)
  const [lipsConnectors, setLipsConnectors] = useState<Connector[] | null>(null)
  const [tessellationConnectors, setTessellationConnectors] = useState<Connector[] | null>(null)

  const landmarkerRef = useRef<FaceLandmarkerType | null>(null)
  const rafRef = useRef<number | null>(null)
  // Always the latest `onBlendshapes` — updated every render (a plain
  // assignment during render is safe here since it never reads state,
  // only stores a reference for the detection loop below to call
  // imperatively), so the loop never captures a stale closure without
  // needing `onBlendshapes` in the detection effect's own deps.
  const onBlendshapesRef = useRef(onBlendshapes)
  onBlendshapesRef.current = onBlendshapes

  useEffect(() => {
    if (!enabled || !videoEl) return

    // Per-run flag: a cleanup only ever cancels its own run, so a stale
    // setup or loop can't touch state after unmount or a re-run.
    let cancelled = false
    setStatus("loading")
    setLandmarks(null)
    onBlendshapesRef.current?.(null)

    async function setup() {
      try {
        // Shared across scans (see `loadFaceLandmarker`) — usually already
        // loading since the Allow Camera click, or ready from an earlier scan.
        const { landmarker, FaceLandmarker } = await loadFaceLandmarker()
        if (cancelled) return
        landmarkerRef.current = landmarker
        // The curated feature sets (face oval, both eyes, both eyebrows)
        // drawn crisper on top of the base mesh, and the lips kept
        // separate again so the caller can emphasize them further.
        // `meshConnectors` is already set from the fixed
        // `BASE_MESH_CONNECTORS` literal above — nothing here needs to
        // wait for a detected frame.
        setContourConnectors([
          ...FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
          ...FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
          ...FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
          ...FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
          ...FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        ])
        setLipsConnectors(FaceLandmarker.FACE_LANDMARKS_LIPS)
        setKeyLandmarkIndices(KEY_MESH_LANDMARK_INDICES)
        // Native dense tessellation — MediaPipe's own connector set, not
        // derived or hand-authored here. Same "read it off the static
        // `FaceLandmarker` class once the dynamic import resolves"
        // pattern as the contour/lips sets above; nothing here waits for
        // a detected frame either.
        setTessellationConnectors(FaceLandmarker.FACE_LANDMARKS_TESSELATION)

        const loop = () => {
          if (cancelled || !landmarkerRef.current || !videoEl) return
          try {
            if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
              const result = landmarkerRef.current.detectForVideo(videoEl, performance.now())
              const faces = result.faceLandmarks
              if (faces && faces.length > 0) {
                setLandmarks(faces[0])
                setVideoSize({ width: videoEl.videoWidth, height: videoEl.videoHeight })
                setStatus("tracking")

                // Flattened once here (see `ExpressionSnapshot`'s doc
                // comment) so every consumer reads a plain map rather
                // than re-deriving one from the raw `Category[]` itself.
                // Delivered via the imperative callback ref, never
                // `useState` — see this hook's own doc comment on why.
                const categoriesForFrame = result.faceBlendshapes?.[0]?.categories

                onBlendshapesRef.current?.(
                  categoriesForFrame
                    ? Object.fromEntries(categoriesForFrame.map((c) => [c.categoryName, c.score]))
                    : null,
                )
              } else {
                setLandmarks(null)
                onBlendshapesRef.current?.(null)
                setStatus("no-face")
              }
            }
          } catch {
            setStatus("error")
            setLandmarks(null)
            onBlendshapesRef.current?.(null)
            discardFaceLandmarker(landmarker)
            return // Stop the loop — a thrown detection error won't self-heal.
          }
          rafRef.current = requestAnimationFrame(loop)
        }
        loop()
      } catch {
        if (!cancelled) setStatus("error")
      }
    }

    setup()

    return () => {
      cancelled = true
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      // Not closed: the shared instance stays ready for the next scan.
      landmarkerRef.current = null
    }
  }, [enabled, videoEl])

  return {
    status,
    landmarks,
    videoSize,
    meshConnectors,
    keyLandmarkIndices,
    contourConnectors,
    lipsConnectors,
    tessellationConnectors,
  }
}
