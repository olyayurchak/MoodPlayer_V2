import { useCallback, useEffect, useRef } from "react"
import type { ExpressionSnapshot } from "./useFaceLandmarker"
import { analyzeMoodV1 } from "../mood/moodHeuristicV1"

// Roughly one accepted sample every 150-200ms, per this task's explicit
// requirement — deliberately much coarser than the underlying per-frame
// detection loop (`useFaceLandmarker` itself still runs every animation
// frame; this hook alone decides which of those frames' blendshape
// values actually get kept). A plain elapsed-time check against this
// constant, not a timer/interval, so it stays exactly in step with
// whatever frames actually arrive rather than firing on a schedule of
// its own.
const SAMPLE_INTERVAL_MS = 180

/**
 * Bilateral (left/right) blendshape pairs this hook merges into one
 * averaged signal each — the exact list this task specifies. Averaging
 * both sides is a simple, deterministic way to prefer a genuine two-sided
 * expression over a one-sided artifact (a wink, a camera-angle quirk)
 * without any threshold tuning.
 *
 * `cheekSquint` was added as a calibration-only signal per the research
 * review this follows: `mouthSmile` (AU12-like lip-corner movement) and
 * `cheekSquint` (the closest currently-available MediaPipe blendshape for
 * AU6-like cheek/eye-region movement) together approximate the
 * well-established smile-related facial-action pattern the research
 * identifies — NOT an exact FACS AU6 measurement (MediaPipe defines no
 * official 1:1 FACS mapping), and not proof of genuine positive affect on
 * its own (the same research notes AU6-like activation can also just
 * reflect smile intensity). This is still purely a data-collection
 * addition — no classification, scoring, or weighting reads this value
 * anywhere yet.
 */
const BILATERAL_PAIRS: Record<string, [string, string]> = {
  mouthSmile: ["mouthSmileLeft", "mouthSmileRight"],
  mouthFrown: ["mouthFrownLeft", "mouthFrownRight"],
  browDown: ["browDownLeft", "browDownRight"],
  browOuterUp: ["browOuterUpLeft", "browOuterUpRight"],
  eyeSquint: ["eyeSquintLeft", "eyeSquintRight"],
  eyeWide: ["eyeWideLeft", "eyeWideRight"],
  mouthPress: ["mouthPressLeft", "mouthPressRight"],
  mouthStretch: ["mouthStretchLeft", "mouthStretchRight"],
  mouthUpperUp: ["mouthUpperUpLeft", "mouthUpperUpRight"],
  cheekSquint: ["cheekSquintLeft", "cheekSquintRight"],
}

// Kept as their own individual signals rather than merged with anything —
// the exact three this task names explicitly. `mouthPucker` has no
// left/right variant at all; `browInnerUp`/`jawOpen` are inherently
// centerline motions. (Categories this task didn't name — e.g. the two
// `eyeBlink*` ones — are deliberately left out of this summary entirely:
// blinking is involuntary/high-frequency and wasn't listed as a signal to
// aggregate.)
const INDIVIDUAL_SIGNALS = ["browInnerUp", "jawOpen", "mouthPucker"]

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** One signal's robust aggregate across every accepted sample of the
 *  completed scan — median (never a single-frame value), plus min/max as
 *  the optional temporal-variability signal this task allows. Median
 *  rather than a plain mean so a handful of brief, atypical frames (a
 *  blink caught mid-expression, a stray hand, one exaggerated grimace)
 *  can't drag the result the way an outlier would a plain average. */
type SignalAggregate = { median: number; min: number; max: number }

function aggregateSignal(samples: ExpressionSnapshot[], categoryNames: string[]): SignalAggregate {
  const perSampleValues = samples.map((sample) => {
    const present = categoryNames.map((name) => sample[name]).filter((value) => typeof value === "number")
    return present.length > 0 ? present.reduce((sum, value) => sum + value, 0) / present.length : 0
  })
  return {
    median: median(perSampleValues),
    min: Math.min(...perSampleValues),
    max: Math.max(...perSampleValues),
  }
}

/** Every aggregated signal, built once from a given sample set — the one
 *  place that turns accepted samples into aggregates for `getAnalysis()`
 *  to classify. */
function buildSummary(samples: ExpressionSnapshot[]): Record<string, SignalAggregate> {
  const summary: Record<string, SignalAggregate> = {}
  for (const [name, pair] of Object.entries(BILATERAL_PAIRS)) {
    summary[name] = aggregateSignal(samples, pair)
  }
  for (const name of INDIVIDUAL_SIGNALS) {
    summary[name] = aggregateSignal(samples, [name])
  }
  return summary
}

/** Runs the isolated, pure `analyzeMoodV1()` classifier (formula/weights/
 *  thresholds untouched, imported verbatim — never re-implemented here)
 *  against one aggregated summary, passing only the five signals it
 *  declares in its own `MoodEvidenceInput` contract. */
function analyzeFromSummary(summary: Record<string, SignalAggregate>): ReturnType<typeof analyzeMoodV1> {
  return analyzeMoodV1({
    mouthSmile: summary.mouthSmile?.median,
    mouthFrown: summary.mouthFrown?.median,
    eyeSquint: summary.eyeSquint?.median,
    browInnerUp: summary.browInnerUp?.median,
    browDown: summary.browDown?.median,
  })
}

/**
 * Collects MediaPipe blendshape samples across the existing valid-scanning
 * window and, at scan completion, aggregates them into the real Happy/
 * Melancholic/Chill classification via `getAnalysis()` (see below).
 * Deliberately its own small hook, matching this codebase's existing
 * one-hook-per-concern pattern
 * (`useCameraStream`, `useFaceLandmarker`, `useHeadPose`,
 * `useScanProgress` are already four separate hooks composed together
 * rather than one large one) — never folded into `ScanningVisual` or into
 * `useScanProgress` (a distinct, already-established concern).
 *
 * Exposes a single stable `recordSample` callback rather than accepting
 * the latest blendshape snapshot as a reactive parameter — deliberately.
 * An earlier version took `blendshapes` directly and sampled it inside a
 * `useEffect([blendshapes, ...])`, which required routing every single
 * detected frame's blendshapes through React state at every layer
 * (`useFaceLandmarker` → `ScanningVisual` → `CameraPermissionScreen` →
 * here) to make it "reactive" at all. Since a real scan produces a *new*
 * blendshapes object on every tracked frame (tens of times per second),
 * that state change cascaded through all three components' render/effect
 * cycles every single frame — including a `setState` back up in
 * `CameraPermissionScreen` — which is exactly the shape that trips React's
 * "Maximum update depth exceeded" invariant during a real, continuous
 * scan (this hook's own `SAMPLE_INTERVAL_MS` throttle lives *inside* the
 * effect body, so it could never prevent the effect itself, or the state
 * changes feeding it, from firing every frame). `recordSample` is called
 * *imperatively* by the same rAF-driven detection loop that already
 * produces each snapshot (see `useFaceLandmarker`'s own `onBlendshapes`
 * callback and `ScanningVisual`'s pass-through) — no `useState` anywhere
 * in that path, so a real scan's ~30-60Hz cadence never touches React's
 * render/commit cycle for this value at all, matching how this codebase
 * already keeps its own high-frequency bookkeeping
 * (`accumulatedMsRef`/`lastTimestampRef` in `useScanProgress`) in refs
 * rather than state.
 *
 * Sampling is gated on the exact same `isValidScanning` boolean
 * `CameraPermissionScreen` already derives from `ScanningVisual` — no
 * face, MediaPipe loading/error, and a "strong" head turn are already all
 * folded into that one boolean upstream (see `ScanningVisual`'s own
 * `caption` logic), so this hook never re-derives any of those conditions
 * itself; it only decides *when among the valid frames* to actually keep
 * a sample (the `SAMPLE_INTERVAL_MS` throttle above) — unchanged from
 * before, just moved from an effect body into `recordSample`'s body.
 *
 * `resetKey` is the exact same value `CameraPermissionScreen` already
 * passes to `useScanProgress` (bumped only by a MediaPipe-error "Try
 * Again") — reusing it here means a MediaPipe retry clears stale samples
 * from the failed attempt in lockstep with that retry resetting scan
 * progress, with no separate reset plumbing needed. A fresh mount (the
 * "Scan again" round trip) starts empty as always, needing no explicit
 * reset either.
 *
 * Stores only numeric blendshape scores in memory for the current scan —
 * never images, video frames, or landmarks — and only for as long as this
 * hook instance is mounted; nothing here persists across reloads or is
 * sent anywhere.
 *
 * `getAnalysis()` — production entry point into `analyzeMoodV1()`. A
 * stable (`useCallback([])`) synchronous function, not React state: it
 * reads `samplesRef.current` (a ref, always current — no batching delay)
 * on demand and runs the real classifier fresh each call, rather than
 * caching a result in state that a *sibling* effect elsewhere might read
 * one render late. `CameraPermissionScreen` calls this exactly once, the
 * same instant it detects `scanCompleted` and grabs the captured still
 * frame, so the real suggested `MoodId` and the captured frame reach
 * `onScanComplete` together, synchronously, with no state-update race.
 *
 * `scanCompleted` is accepted but not read inside this hook — a DEV-only
 * calibration summary used to log here at that instant; now that
 * classification is real production behavior via `getAnalysis()` above
 * (called by `CameraPermissionScreen` itself, not from an effect keyed on
 * this value), there is nothing left inside this hook that needs it. Kept
 * in the signature rather than changed, since `CameraPermissionScreen`'s
 * own call site is unrelated to this cleanup and stays untouched.
 */
export function useExpressionSampler(
  isValidScanning: boolean,
  resetKey: unknown,
  scanCompleted: boolean,
): {
  recordSample: (blendshapes: ExpressionSnapshot | null) => void
  getAnalysis: () => ReturnType<typeof analyzeMoodV1>
} {
  const samplesRef = useRef<ExpressionSnapshot[]>([])
  const lastSampleAtRef = useRef<number | null>(null)
  const isFirstResetRef = useRef(true)

  // Explicit reset, mirroring `useScanProgress`'s own `resetKey` effect —
  // skipped on this hook's very first render (nothing to reset yet).
  useEffect(() => {
    if (isFirstResetRef.current) {
      isFirstResetRef.current = false
      return
    }
    samplesRef.current = []
    lastSampleAtRef.current = null
  }, [resetKey])

  // Accepts at most one sample per `SAMPLE_INTERVAL_MS`, and only while
  // the existing scan-validity gate is currently satisfied. Called
  // directly from the detection loop (via `ScanningVisual`/
  // `useFaceLandmarker`'s `onBlendshapes`) — never through a React-state
  // hop — so this can run every tracked frame without ever scheduling a
  // React render itself (it only ever mutates refs). `useCallback` with
  // `[isValidScanning]` keeps this stable across the vast majority of
  // renders (that boolean only flips occasionally), so re-passing it as
  // a prop doesn't itself cause extra effect churn downstream either.
  const recordSample = useCallback(
    (blendshapes: ExpressionSnapshot | null) => {
      if (!isValidScanning || !blendshapes) return
      const now = performance.now()
      if (lastSampleAtRef.current !== null && now - lastSampleAtRef.current < SAMPLE_INTERVAL_MS) return
      lastSampleAtRef.current = now
      samplesRef.current = [...samplesRef.current, blendshapes]
    },
    [isValidScanning],
  )

  const getAnalysis = useCallback(() => {
    return analyzeFromSummary(buildSummary(samplesRef.current))
  }, [])

  return { recordSample, getAnalysis }
}
