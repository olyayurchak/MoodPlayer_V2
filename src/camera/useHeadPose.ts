import { useRef } from "react"
import type { FaceLandmarkPoint } from "./useFaceLandmarker"

export type HeadPoseState = "front" | "moderate" | "strong"

/** Which mirrored half of the face the yaw signal currently identifies as
 *  the *far* (turned-away) side — see `estimateRawYaw`'s doc comment for
 *  how "A" vs "B" is derived. `null` when the turn is small enough that no
 *  side should be treated as far (the "front" state). */
export type FaceSide = "A" | "B"

export type HeadPose = {
  state: HeadPoseState
  /** The smoothed yaw proxy itself (see `estimateRawYaw`) — exposed mainly
   *  for debugging/tuning; callers generally only need `state`/`farSide`/
   *  `fadeIntensity`. */
  yaw: number
  farSide: FaceSide | null
  /** 0 in `"front"`, ramping 0→1 across the `"moderate"` range via a
   *  quadratic ease-in (subtle at the start of the range, accelerating
   *  toward 1 near the strong threshold — not a linear ramp), pinned to 1
   *  in `"strong"` — how strongly the far side of the base mesh should be
   *  faded. The caller (`ScanningVisual`) is expected to suppress the
   *  mesh entirely in `"strong"` rather than lean on this value alone;
   *  it's still provided there for completeness. */
  fadeIntensity: number
}

// Landmark indices this hook reads directly off the raw MediaPipe result —
// independent of, and not affecting, `COARSE_MESH_LANDMARK_INDICES` (the
// curated set the base mesh's own topology is triangulated over, defined
// in `useFaceLandmarker.ts`). `landmarks` is always MediaPipe's full
// ~478-point array regardless of which subset the mesh itself uses, so
// reading a few extra indices here for pose purposes never requires
// touching that file.
//
// 33/263 are the two eyes' outer corners — a standard, well-established
// pair for this kind of lightweight yaw heuristic. 234/454 are the
// cheekbone/temple anchors already used elsewhere in this codebase; they
// were independently verified as a genuine left/right mirror pair by
// checking their positions in `FACE_LANDMARKS_FACE_OVAL`'s own 36-point
// connector loop (each pair's positions in that loop sum to exactly 36,
// the loop's period). 33 and 234 sit on the same side of the face (both
// under-250 canonical indices, the same side grouping every other
// verified pair in this codebase follows); 263 and 454 sit on the other,
// matching side.
const YAW_NOSE_TIP = 1
const YAW_EYE_A = 33
const YAW_EYE_B = 263

/** Side A's and side B's cheekbone anchors — exported so `ScanningVisual`
 *  can anchor the base-mesh fade gradient's physical near/far edges to
 *  the same A/B sides this hook's yaw signal identifies, without
 *  duplicating the "which index is which side" reasoning above. */
export const FADE_ANCHOR_A = 234
export const FADE_ANCHOR_B = 454

// Thresholds on the smoothed yaw proxy below. The proxy is a ratio in
// roughly [-1, 1] (see `estimateRawYaw`): ~0 when front-facing (small
// natural asymmetry/detection noise aside), growing in magnitude as the
// head turns because the far eye's landmark compresses toward the nose
// tip while the near eye's doesn't. These are *reasoned initial values*
// based on that signal's shape, not values empirically calibrated against
// recorded footage — real-webcam testing is expected to confirm or adjust
// them (see the task's own verification step).
//
// Two separate bands, each with its own enter/exit threshold, give
// hysteresis at *both* state boundaries so a value hovering right at an
// edge doesn't rapidly flip the state back and forth. Raised from an
// initial (0.16/0.12/0.38/0.30) calibration after real-webcam testing
// showed that version too sensitive — small, ordinary head movement was
// already crossing into "moderate" and starting to fade the mesh. This
// wider front band gives noticeably more tolerance for normal movement
// before anything visibly changes, while keeping the same signal and the
// same hysteresis structure.
const FRONT_EXIT = 0.24 // front → moderate once magnitude reaches this
const FRONT_ENTER = 0.18 // moderate → front only once magnitude drops below this (lower than FRONT_EXIT)
const STRONG_ENTER = 0.5 // moderate → strong once magnitude reaches this
const STRONG_EXIT = 0.4 // strong → moderate only once magnitude drops below this (lower than STRONG_ENTER)

// Exponential-moving-average weight applied to each new raw sample —
// lower is smoother/slower to react, higher tracks the raw signal more
// closely. 0.2 damps ordinary per-frame detection jitter while still
// following a real, sustained head turn within a few frames.
const SMOOTHING = 0.2

/**
 * A lightweight yaw ("turned left/right") proxy derived from two already-
 * detected landmarks' horizontal distance to the nose tip. Under yaw
 * rotation, the far side's features foreshorten toward the midline (the
 * far eye's landmark moves closer to the nose tip in the 2D projection)
 * while the near side's don't compress the same way — so the *difference*
 * between the two eye-to-nose-tip distances, normalized by their sum,
 * grows with turn magnitude and its sign identifies which side compressed
 * (the far side). This needs no additional MediaPipe output (no facial
 * transformation matrix, no extra model) — just three landmarks already
 * present in every detected frame.
 *
 * Returns `null` if any of the three landmarks this depends on are
 * missing or degenerate for a given frame (e.g. `distA + distB === 0`) —
 * the caller holds the previous smoothed value/state in that case rather
 * than snapping to an incorrect one.
 */
function estimateRawYaw(landmarks: FaceLandmarkPoint[]): number | null {
  const nose = landmarks[YAW_NOSE_TIP]
  const eyeA = landmarks[YAW_EYE_A]
  const eyeB = landmarks[YAW_EYE_B]
  if (!nose || !eyeA || !eyeB) return null

  const distA = Math.abs(nose.x - eyeA.x)
  const distB = Math.abs(nose.x - eyeB.x)
  const total = distA + distB
  if (total <= 0) return null

  // > 0 → side B (263/454) is the more-compressed, i.e. far, side.
  // < 0 → side A (33/234) is the far side.
  return (distA - distB) / total
}

/**
 * Tracks head-turn pose across frames from the same landmarks
 * `useFaceLandmarker` already returns — no new MediaPipe output, no new
 * model, no per-frame cost beyond three landmark lookups and a couple of
 * comparisons. Owns its own smoothing (`SMOOTHING`) and state hysteresis
 * (the `*_ENTER`/`*_EXIT` thresholds) internally via refs, so the caller
 * just reads the latest `HeadPose` each render without managing any of
 * that itself.
 *
 * Returns `null` when `landmarks` is `null` (no face currently detected)
 * — the existing no-face/loading/error handling in `ScanningVisual`
 * already covers that case; this hook only adds pose *on top of* an
 * otherwise-successful detection, and intentionally freezes its last
 * smoothed value/state while landmarks are unavailable rather than
 * resetting, so pose doesn't jump the instant tracking resumes.
 */
export function useHeadPose(landmarks: FaceLandmarkPoint[] | null): HeadPose | null {
  const smoothedYawRef = useRef(0)
  const stateRef = useRef<HeadPoseState>("front")

  if (!landmarks) return null

  const raw = estimateRawYaw(landmarks)
  if (raw !== null) {
    smoothedYawRef.current = smoothedYawRef.current * (1 - SMOOTHING) + raw * SMOOTHING
  }

  const yaw = smoothedYawRef.current
  const magnitude = Math.abs(yaw)

  // Which thresholds apply depends on the *current* state — this is what
  // makes it hysteresis rather than a plain lookup: e.g. while already in
  // "moderate", the magnitude has to fall all the way back below
  // FRONT_ENTER (not just below FRONT_EXIT) to return to "front".
  let nextState = stateRef.current
  if (stateRef.current === "front") {
    if (magnitude >= FRONT_EXIT) nextState = "moderate"
  } else if (stateRef.current === "moderate") {
    if (magnitude >= STRONG_ENTER) nextState = "strong"
    else if (magnitude < FRONT_ENTER) nextState = "front"
  } else {
    if (magnitude < STRONG_EXIT) nextState = "moderate"
  }
  stateRef.current = nextState

  const farSide: FaceSide | null = magnitude < FRONT_ENTER ? null : yaw > 0 ? "B" : "A"

  // A quadratic ease-in across the moderate range, not a linear ramp:
  // right at the front→moderate boundary `progress` is near 0, so
  // squaring it keeps the fade very subtle for early/small moderate
  // turns, then it accelerates toward `progress²` catching up to 1 as the
  // turn approaches the strong threshold — matching the requested "early
  // moderate → barely noticeable, larger moderate → progressively
  // stronger" feel rather than an immediately-noticeable linear fade.
  const progress = clamp01((magnitude - FRONT_EXIT) / (STRONG_ENTER - FRONT_EXIT))
  const fadeIntensity = nextState === "front" ? 0 : nextState === "strong" ? 1 : progress * progress

  return { state: nextState, yaw, farSide, fadeIntensity }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}
