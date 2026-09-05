import type { MoodId } from "../data/moods"

/**
 * MoodPlayer's first isolated Happy/Melancholic/Chill heuristic.
 *
 * Wired into the live Camera → Vibe Result flow: `useExpressionSampler`'s
 * `getAnalysis()` calls this function verbatim (this module's own
 * formula/weights/thresholds are never duplicated or re-implemented
 * elsewhere), and `CameraPermissionScreen` calls that once per completed
 * scan, handing the resulting `mood` up through `onScanComplete` to
 * `App.tsx`, which now stores it as the real `suggestedMood` state
 * `VibeResultScreen` receives. The formerly-hardcoded
 * `TEMP_DEV_FIXTURE_SUGGESTED_MOOD` fixture has been removed from
 * `App.tsx` — this module itself remains a standalone, pure function
 * either way, with no dependency on any of that wiring.
 *
 * ============================================================
 * PRODUCT FRAMING — read before changing any comment or copy here
 * ============================================================
 * This is an experimental playlist/vibe suggestion heuristic. It must
 * never be described (in code, comments, logs, or any future UI) as:
 *   - detecting the user's true emotion;
 *   - a psychological assessment;
 *   - a diagnosis.
 * "Happy"/"Melancholic"/"Chill" here are playlist-suggestion labels, not
 * claims about the user's actual felt emotional state. See Guidelines §2
 * and the technical audit/research review this module implements.
 *
 * ============================================================
 * EVIDENCE BASE (see the research review this follows for full sourcing)
 * ============================================================
 * - Happy: established facial-action research supports sustained
 *   mouth-corner raising (`mouthSmile`, MediaPipe's closest proxy for the
 *   FACS AU12-like lip-corner-puller component of a positive-affect
 *   smile) as the primary cue. `eyeSquint` is included only as a small
 *   supporting cue (a loose, unverified proxy for AU6-like cheek/eye
 *   involvement) because MoodPlayer's own real-camera calibration showed
 *   its Happy and Neutral ranges overlap heavily. `cheekSquint` — the
 *   more theoretically direct AU6 proxy — is deliberately NOT used here:
 *   calibration showed it does not discriminate Happy from
 *   Neutral/Subdued in this implementation (see the diagnostic tasks
 *   this follows). It remains collected by `useExpressionSampler` for
 *   possible future recalibration, just not read by this module.
 * - Melancholic: established research supports a sadness-like pattern of
 *   lip-corner depression, inner-brow raising, and brow lowering.
 *   `mouthFrown` is the primary cue here (calibration showed real,
 *   reproducible separation from neutral). `browInnerUp` only ever adds a
 *   small *supporting* contribution, and only when `mouthFrown` evidence
 *   already exists — calibration showed `browInnerUp` reaching HIGHER
 *   values during confirmed Happy scans than during some confirmed
 *   Melancholic scans, so it must never independently produce a
 *   Melancholic result. `browDown` is research-supported in principle
 *   but showed no useful separation in this calibration data (in one
 *   case it was even lower for Melancholic than for Chill) — its weight
 *   is set to exactly zero in v1 rather than forcing an unsupported
 *   pattern onto real data. `mouthFrown`'s own saturation point
 *   (`MOUTH_FROWN_MELANCHOLIC_MIN`) and Melancholic's decision threshold
 *   (`MELANCHOLIC_DECISION_THRESHOLD`) were both later recalibrated —
 *   see each constant's own comment — after real scans showed moderate,
 *   non-exaggerated Melancholic attempts collapsing into Chill; Happy's
 *   own formula and threshold were not touched by that recalibration.
 * - Chill: a MoodPlayer-specific product category, not a scientific
 *   emotion class. It is the outcome when neither Happy's nor
 *   Melancholic's evidence clears its own meaningful threshold — never
 *   an "everything else" catch-all computed by elimination alone; both
 *   scores are always computed and explicitly compared.
 *
 * ============================================================
 * PROTOTYPE CALIBRATION VALUES — REQUIRES BROADER VALIDATION
 * ============================================================
 * Every numeric constant below comes from six real-camera scans of ONE
 * person (median-aggregated `useExpressionSampler` output). They are
 * prototype calibration guidance, not universal population thresholds —
 * different facial geometry, lighting, or camera setups may need
 * different values. Do not treat them as scientifically validated cutoffs.
 */

/** The subset of `useExpressionSampler`'s aggregated signal names this
 *  heuristic actually reads — a plain flat map of signal name → its
 *  scan's median value (the same `median` field `useExpressionSampler`'s
 *  own per-signal `SignalAggregate` already computes). Deliberately its
 *  own minimal type, not an import of that hook's internal types, so
 *  this module stays a self-contained, easily-testable unit with no
 *  dependency on the camera/sampling stack's own shapes. Every property
 *  is optional so a caller can pass a partial/synthetic fixture (as the
 *  verification fixtures for this module do) without needing every
 *  signal `useExpressionSampler` happens to collect. */
export type MoodEvidenceInput = {
  mouthSmile?: number
  mouthFrown?: number
  eyeSquint?: number
  browInnerUp?: number
  browDown?: number
}

/** Every signal this heuristic explicitly does NOT use as classification
 *  evidence in v1, for reference/documentation only (not read anywhere
 *  below) — `useExpressionSampler` still collects all of these; this
 *  module simply never looks at them. Some of these did separate
 *  individual calibration scans, but there is not yet enough research
 *  justification to treat that as real mood evidence rather than a
 *  person-specific posing artifact (see the research-review task this
 *  follows). */
export const V1_EXCLUDED_SIGNALS = [
  "cheekSquint",
  "mouthPucker",
  "mouthPress",
  "mouthStretch",
  "mouthUpperUp",
  "browOuterUp",
  "eyeWide",
  "jawOpen",
  // Gaze signals (eyeLookDown/In/Out/Up × Left/Right) and blink signals
  // (eyeBlinkLeft/Right) were never part of `useExpressionSampler`'s own
  // aggregated signal set to begin with — listed here only so this
  // module's own exclusion list is complete and self-documenting.
  "eyeLookDown/In/Out/Up (Left/Right)",
  "eyeBlink (Left/Right)",
] as const

// ---- Happy: mouthSmile (primary) + eyeSquint (small support) ----

/** Neutral/Chill's observed upper `mouthSmile` range (calibration C1
 *  ≈0.0047, C2 ≈0.0104) — the value at/below which `mouthSmile`
 *  contributes zero Happy evidence. */
const MOUTH_SMILE_NEUTRAL_MAX = 0.01
/** The value at/above which `mouthSmile` alone already saturates its full
 *  contribution. Widened from the weakest confirmed Happy median (H1
 *  ≈0.0204) to 0.03 as a deliberate one-variable tuning experiment: makes
 *  Happy classification slightly less sensitive to very small/incidental
 *  smiles, widening the Chill zone between `MOUTH_SMILE_NEUTRAL_MAX` and
 *  this value. Stronger Happy expressions measured far higher (≈0.42–0.83)
 *  so this still saturates well below them. Deliberately NOT the
 *  previously-considered absolute threshold of 0.10 — that value sat
 *  above both confirmed real Happy medians (0.0204, 0.0882) and would
 *  have misclassified them. */
const MOUTH_SMILE_HAPPY_MIN = 0.03

/** Roughly the shared baseline `eyeSquint` sits at across all three
 *  moods in calibration (Chill ≈0.249–0.260, Melancholic ≈0.225–0.262,
 *  Happy ≈0.260–0.317) — below this, `eyeSquint` contributes nothing. */
const EYE_SQUINT_LOW_REF = 0.26
/** The strongest confirmed Happy `eyeSquint` observed (H1 ≈0.317) — full
 *  (small) contribution saturates here. Deliberately close to
 *  `EYE_SQUINT_LOW_REF`: the overlap between moods here is real, so this
 *  signal's *ceiling* contribution stays small (see `EYE_SQUINT_WEIGHT`
 *  below) rather than trying to force clean separation out of a
 *  genuinely noisy signal. */
const EYE_SQUINT_HIGH_REF = 0.32

/** `mouthSmile`'s share of the Happy score — dominant, per the research
 *  review's explicit requirement that it "must dominate the Happy
 *  score." */
const MOUTH_SMILE_WEIGHT = 0.85
/** `eyeSquint`'s share — deliberately small/non-required, since its
 *  Happy and Neutral ranges overlap in calibration. */
const EYE_SQUINT_WEIGHT = 0.15

// ---- Melancholic: mouthFrown (primary) + browInnerUp (gated support) ----

/** Neutral/Chill's observed `mouthFrown` ceiling — the floor below which
 *  `mouthFrown` contributes zero Melancholic evidence.
 *
 *  Lowered from an earlier `0.0047` after real-camera scans showed that
 *  value sat too high: neutral Chill scans measured `mouthFrown` around
 *  `0.0005–0.0022`, while one intended-Melancholic scan at `≈0.00465`
 *  still fell at/below the old `0.0047` ceiling and resolved to Chill
 *  (a separate intended-Melancholic scan at `≈0.00573` already cleared
 *  it and correctly resolved to Melancholic). `0.0035` sits between the
 *  observed Chill range and that `≈0.00465` near-miss, so the near-miss
 *  scan now contributes real (if partial) evidence instead of exactly
 *  zero, without dropping into the observed Chill range itself. Requires
 *  validation against more real scans before treating this as final —
 *  see `MOUTH_FROWN_MELANCHOLIC_MIN`'s own comment for the ramp's other
 *  (unchanged) boundary. */
const MOUTH_FROWN_NEUTRAL_MAX = 0.0035
/** The point at/above which `mouthFrown` alone already saturates its full
 *  (dominant, `MOUTH_FROWN_WEIGHT`-weighted) contribution — i.e. how
 *  strong a frown must be before it stops needing any help from
 *  `browInnerUp` to read as Melancholic on its own.
 *
 *  Lowered from an earlier `0.01` after real calibration scans showed a
 *  recurring problem: moderate but clearly intentional Melancholic
 *  attempts (sad/serious/restrained, not exaggerated) were producing
 *  `mouthFrown` medians that fell well short of that saturation point —
 *  landing far enough down this ramp's slope that even full
 *  `browInnerUp` support couldn't lift `melancholicScore` past
 *  `MELANCHOLIC_DECISION_THRESHOLD`, so the scan fell through to Chill
 *  (some of these scans logged `melancholicScore: 0` entirely, i.e. the
 *  frown value sat at/below `MOUTH_FROWN_NEUTRAL_MAX` for that
 *  particular scan — recalibrating this saturation point doesn't rescue
 *  those specific zero-evidence cases, only the ones that had *some*
 *  frown evidence but not enough to matter; see this task's own report
 *  for that distinction and why it deliberately isn't papered over here).
 *
 *  `0.007` keeps the ramp's floor (`MOUTH_FROWN_NEUTRAL_MAX`, Chill's own
 *  observed ceiling) completely unchanged — only the *top* of the ramp
 *  moved down, so a value that used to read as "moderate" (partial ramp)
 *  now reads as "clearly frowning" (full ramp), while a value at or
 *  below Chill's own documented ceiling still contributes exactly zero
 *  evidence, same as before. Requires broader validation against more
 *  real scans before treating this as final. */
const MOUTH_FROWN_MELANCHOLIC_MIN = 0.007

/** Roughly the low/neutral end of `browInnerUp` in calibration (Chill
 *  ≈0.043–0.045, Melancholic M1 ≈0.046) — below this, no contribution.
 *  Deliberately conservative: `browInnerUp` reached *higher* values
 *  during confirmed Happy (H1 ≈0.069, H2 ≈0.075) than during Melancholic
 *  M1 (≈0.046), which is exactly why this signal is small, gated, and
 *  never sufficient alone (see `applyBrowInnerUpSupport` below). */
const BROW_INNER_UP_LOW_REF = 0.045
/** Near the higher end observed in a confirmed Melancholic scan (M2
 *  ≈0.116) — full (small, gated) contribution saturates here. */
const BROW_INNER_UP_HIGH_REF = 0.1

/** `mouthFrown`'s share of the Melancholic score — dominant, per the
 *  research review's explicit requirement. */
const MOUTH_FROWN_WEIGHT = 0.85
/** `browInnerUp`'s share — small, and only ever applied when `mouthFrown`
 *  evidence is already non-zero (see `applyBrowInnerUpSupport`), so it
 *  can support an already-Melancholic-leaning score but can never, by
 *  itself, create one. */
const BROW_INNER_UP_WEIGHT = 0.15

/** `browDown` is research-supported in principle (part of the AU1+AU4+
 *  AU15 sadness prototype) but showed no useful separation in this
 *  calibration data — in one pair it even scored *lower* for Melancholic
 *  than for Chill. Its weight is exactly zero in v1: kept as a named,
 *  documented constant (not silently omitted) so a future recalibration
 *  can revisit it deliberately, rather than forcing the research pattern
 *  onto data that doesn't currently support it. */
const BROW_DOWN_WEIGHT = 0

/** Happy must clear this normalized score before it can be selected over
 *  Chill — chosen as the midpoint of Happy's own [0,1] range, since
 *  `happyScore` is constructed (via the ramps above) to reach ≈1.0 for
 *  confirmed Happy fixtures and ≈0 for Neutral/Chill ones. Happy
 *  classification already works reliably at this value — unchanged by
 *  this module's Melancholic/Chill recalibration (see
 *  `MELANCHOLIC_DECISION_THRESHOLD` below for Melancholic's own,
 *  separate threshold). Prototype value — requires broader validation. */
const MOOD_DECISION_THRESHOLD = 0.5

/** Melancholic must clear this normalized score before it can be
 *  selected over Chill — deliberately lower than Happy's
 *  `MOOD_DECISION_THRESHOLD`, and its own separate constant rather than
 *  reusing that one, specifically so Happy's decision behavior is
 *  provably untouched by this change (see `analyzeMoodV1`'s Happy
 *  branch, which still reads `MOOD_DECISION_THRESHOLD` exactly as
 *  before).
 *
 *  Melancholic's dominant signal (`mouthFrown`) is real but, per
 *  calibration, noisier and generally weaker in magnitude for genuine
 *  moderate (non-exaggerated) attempts than Happy's dominant signal
 *  (`mouthSmile`) is for genuine Happy ones — and its only supporting
 *  signal (`browInnerUp`) is deliberately capped small and gated (it
 *  must never carry a result on its own; see `BROW_INNER_UP_WEIGHT`'s own
 *  comment). A single shared 0.5 threshold left "moderate but
 *  consistent" Melancholic evidence — real signal, but not enough of it
 *  to fully saturate `mouthFrown` and not enough supporting
 *  `browInnerUp` to close the rest of the gap — collapsing into Chill
 *  even when it was reproducible across the whole scan, not a one-frame
 *  fluke (median-aggregated, same as every other signal here).
 *
 *  `0.4` still requires `melancholicScore` to clearly exceed a
 *  meaningful floor (per the Chill-side analysis in
 *  `MOUTH_FROWN_MELANCHOLIC_MIN`'s own comment, a genuinely neutral
 *  scan's `mouthFrown` contributes exactly zero evidence here, so its
 *  `melancholicScore` stays at `0` regardless of this threshold) and
 *  still requires beating `happyScore` (see `analyzeMoodV1`'s explicit
 *  comparison below, unchanged) — it only closes the gap for evidence
 *  that is real and consistent but doesn't need to be exaggerated to
 *  count. Prototype value — requires broader validation; if real
 *  neutral/Chill scans start crossing this threshold, lower it back
 *  toward `0.5` rather than reintroducing an exaggeration requirement on
 *  `mouthFrown`. */
const MELANCHOLIC_DECISION_THRESHOLD = 0.4

/** Clamps `value` to `[0, 1]`. */
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** A soft, linear ramp from `0` at/below `low` to `1` at/above `high` —
 *  the "soft/normalized score around the observed separation range"
 *  approach used throughout this module, rather than a single brittle
 *  binary cutoff. */
function ramp(value: number | undefined, low: number, high: number): number {
  if (value === undefined) return 0
  return clamp01((value - low) / (high - low))
}

export type MoodEvidence = {
  /** `mouthSmile`'s own ramp contribution to the Happy score, before
   *  weighting — `0` at/below Neutral, `1` at/above the weakest confirmed
   *  Happy value. */
  mouthSmileRamp: number
  /** `eyeSquint`'s own ramp contribution to the Happy score, before
   *  weighting. */
  eyeSquintRamp: number
  /** `mouthFrown`'s own ramp contribution to the Melancholic score,
   *  before weighting. */
  mouthFrownRamp: number
  /** `browInnerUp`'s own ramp contribution — *already* zeroed out here
   *  (not just in the final score) if `mouthFrownRamp` is `0`, so this
   *  field itself reflects the gating, not just an unweighted raw ramp. */
  browInnerUpRamp: number
}

export type MoodAnalysisResult = {
  mood: MoodId
  /** Final normalized `[0, 1]`-ish scores for the two moods this
   *  heuristic actually scores — `chill` has no score of its own; it is
   *  the decision reached when neither other score clears its own
   *  decision threshold (`MOOD_DECISION_THRESHOLD` for Happy,
   *  `MELANCHOLIC_DECISION_THRESHOLD` for Melancholic — see the module
   *  doc comment above). */
  scores: { happy: number; melancholic: number }
  /** The individual ramp contributions behind both scores, for
   *  inspection/debugging — never itself read by the decision logic
   *  below (that only reads `scores`). */
  evidence: MoodEvidence
}

/**
 * MoodPlayer's v1 Happy/Melancholic/Chill heuristic — a small, pure,
 * deterministic function. Never throws; missing signals simply
 * contribute zero evidence (see `ramp`'s `undefined` handling), so a
 * caller can pass a partial `MoodEvidenceInput` safely.
 *
 * NOT wired into the live Camera → Vibe Result flow — see this module's
 * own top doc comment.
 */
export function analyzeMoodV1(evidence: MoodEvidenceInput): MoodAnalysisResult {
  const mouthSmileRamp = ramp(evidence.mouthSmile, MOUTH_SMILE_NEUTRAL_MAX, MOUTH_SMILE_HAPPY_MIN)
  const eyeSquintRamp = ramp(evidence.eyeSquint, EYE_SQUINT_LOW_REF, EYE_SQUINT_HIGH_REF)
  const happyScore = clamp01(MOUTH_SMILE_WEIGHT * mouthSmileRamp + EYE_SQUINT_WEIGHT * eyeSquintRamp)

  const mouthFrownRamp = ramp(evidence.mouthFrown, MOUTH_FROWN_NEUTRAL_MAX, MOUTH_FROWN_MELANCHOLIC_MIN)
  // Gated: `browInnerUp` only ever contributes once `mouthFrown` evidence
  // already exists (ramp > 0) — this is what makes it a *supporting*
  // signal rather than an independent one, per the research review's
  // explicit requirement.
  const browInnerUpRamp =
    mouthFrownRamp > 0 ? ramp(evidence.browInnerUp, BROW_INNER_UP_LOW_REF, BROW_INNER_UP_HIGH_REF) : 0
  const browDownContribution = BROW_DOWN_WEIGHT * ramp(evidence.browDown, 0, 1) // weight is 0 — always inert
  const melancholicScore = clamp01(
    MOUTH_FROWN_WEIGHT * mouthFrownRamp + BROW_INNER_UP_WEIGHT * browInnerUpRamp + browDownContribution,
  )

  // Chill wins whenever neither score clears its own decision threshold,
  // or when a score clears it but doesn't exceed the *other* mood's
  // score — an explicit comparison, never "not Happy = Chill" by
  // elimination. Happy's branch is unchanged (`MOOD_DECISION_THRESHOLD`,
  // same as before this module's Melancholic/Chill recalibration);
  // Melancholic reads its own, separately-calibrated
  // `MELANCHOLIC_DECISION_THRESHOLD` instead (see that constant's own
  // comment for why the two moods no longer share one threshold).
  let mood: MoodId = "chill"
  if (happyScore >= MOOD_DECISION_THRESHOLD && happyScore > melancholicScore) {
    mood = "happy"
  } else if (melancholicScore >= MELANCHOLIC_DECISION_THRESHOLD && melancholicScore > happyScore) {
    mood = "melancholic"
  }

  return {
    mood,
    scores: { happy: happyScore, melancholic: melancholicScore },
    evidence: { mouthSmileRamp, eyeSquintRamp, mouthFrownRamp, browInnerUpRamp },
  }
}
