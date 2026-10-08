/**
 * Gesture Controls — every tunable value in one place.
 *
 * Recognition uses MediaPipe's GestureRecognizer (`@mediapipe/tasks-vision`,
 * already a dependency for face analysis) and its built-in "canned" gesture
 * labels. Only the gestures listed in `GESTURE_ACTIONS` ever trigger
 * anything; the rest are ignored.
 */

/** Same pinned WASM runtime as `camera/useFaceLandmarker.ts`. */
export const GESTURE_WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"

export const GESTURE_MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"

/** Player actions a gesture can request. */
export type GestureAction = "play" | "pause" | "next" | "previous"

/** MediaPipe canned-gesture label → Player action (the full approved mapping). */
export const GESTURE_ACTIONS: Readonly<Record<string, GestureAction>> = {
  Open_Palm: "play",
  Closed_Fist: "pause",
  Thumb_Up: "next",
  Thumb_Down: "previous",
}

export const GESTURE_TIMING = {
  /** Time between recognition passes (~10 fps) — plenty for a held pose,
   *  far cheaper than running on every animation frame. */
  inferenceIntervalMs: 100,
  /** A gesture must be held this long before it fires. */
  holdMs: 400,
  /** A single missed/uncertain frame shorter than this doesn't reset an
   *  in-progress hold. */
  dropoutToleranceMs: 150,
  /** Share of frames during the hold that must actually show the gesture
   *  — tolerates an odd dropped frame, rejects 50/50 flicker. */
  minHoldRatio: 0.7,
  /** After firing, the gesture must be absent this long before the same
   *  gesture can fire again (re-arm). */
  releaseMs: 300,
  /** Minimum time between two actions from *different* gestures (guards
   *  accidental double actions while the hand changes pose). A repeat of
   *  the same gesture isn't held to it: it has already had to re-arm
   *  (`releaseMs`) and complete a fresh hold (`holdMs`), so the cooldown
   *  could only delay it — or drop it outright if the hand left before the
   *  cooldown ran out. */
  cooldownMs: 1000,
} as const

export const GESTURE_CONFIDENCE = {
  /** Default minimum canned-gesture score for a frame to count as that
   *  gesture. Per-gesture overrides live in `GESTURE_MIN_SCORE`. */
  minGestureScore: 0.7,
  /** MediaPipe hand-detection options. */
  minHandDetectionConfidence: 0.6,
  minHandPresenceConfidence: 0.6,
  minTrackingConfidence: 0.5,
} as const

/**
 * Per-gesture minimum scores, overriding `GESTURE_CONFIDENCE.minGestureScore`
 * only for gestures tuned against a real camera. Open_Palm: a real webcam
 * labelled a held open palm correctly but scored it ~0.53, below the 0.7
 * default; the hold, frame-ratio, re-arm and cooldown rules still guard it.
 * Closed_Fist, Thumb_Up and Thumb_Down were confirmed on a real camera at
 * the default.
 */
export const GESTURE_MIN_SCORE: Readonly<Record<string, number>> = {
  Open_Palm: 0.5,
}

/** Minimum score for `label` to count as that gesture. */
export function gestureMinScore(label: string): number {
  return GESTURE_MIN_SCORE[label] ?? GESTURE_CONFIDENCE.minGestureScore
}

/** Smaller frames are plenty for hand gestures and cheaper to process. */
export const GESTURE_CAMERA_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: 640 },
  height: { ideal: 480 },
}
