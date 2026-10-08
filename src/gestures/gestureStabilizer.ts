import { GESTURE_ACTIONS, GESTURE_TIMING, gestureMinScore, type GestureAction } from "./gestureConfig"

/** One recognition pass, reduced to what the stabilizer needs. */
export type GestureObservation = {
  handPresent: boolean
  /** Top canned-gesture label for the hand ("None" when unrecognised). */
  gesture: string | null
  score: number
}

/** What the recognizer is seeing right now (internal; not shown in the UI). */
export type GestureRecognitionState = "no-hand" | "uncertain" | "detected" | "triggered"

export type GestureStabilizerResult = {
  state: GestureRecognitionState
  /** Set only on the single update where an action fires. */
  action: GestureAction | null
}

type Timing = {
  holdMs: number
  dropoutToleranceMs: number
  minHoldRatio: number
  releaseMs: number
  cooldownMs: number
}

/**
 * Turns noisy per-frame recognition into deliberate actions:
 * - a mapped gesture must be held for `holdMs` (brief dropouts shorter than
 *   `dropoutToleranceMs` don't reset the hold, but at least `minHoldRatio`
 *   of the frames in the hold must show it);
 * - it fires once, then is latched until the gesture has been absent for
 *   `releaseMs` — holding a pose never repeats the action;
 * - no two actions from different gestures fire within `cooldownMs`; a
 *   repeat of the same gesture is gated by its re-arm plus a fresh hold
 *   instead (it can never fire sooner than `releaseMs + holdMs` apart).
 * Pure and time-injected, so it has no camera or React dependencies.
 */
export function createGestureStabilizer(
  timing: Timing = GESTURE_TIMING,
  minScoreFor: (label: string) => number = gestureMinScore,
  actions: Readonly<Record<string, GestureAction>> = GESTURE_ACTIONS,
) {
  let candidate: string | null = null
  let candidateSince = 0
  let candidateLastSeen = 0
  let holdFrames = 0
  let holdHits = 0
  let latched: string | null = null
  let latchAbsentSince: number | null = null
  let lastFireAt = Number.NEGATIVE_INFINITY
  let lastFired: string | null = null

  function reset() {
    candidate = null
    latched = null
    latchAbsentSince = null
    lastFireAt = Number.NEGATIVE_INFINITY
    lastFired = null
  }

  function update(observation: GestureObservation, now: number): GestureStabilizerResult {
    const recognised =
      observation.handPresent &&
      observation.gesture !== null &&
      observation.gesture in actions &&
      observation.score >= minScoreFor(observation.gesture)
        ? observation.gesture
        : null

    // Re-arm a latched gesture once it has been absent long enough.
    if (latched !== null) {
      if (recognised === latched) {
        latchAbsentSince = null
      } else {
        latchAbsentSince ??= now
        if (now - latchAbsentSince >= timing.releaseMs) {
          latched = null
          latchAbsentSince = null
        }
      }
    }

    if (recognised === null) {
      // A confident *different* gesture (e.g. a fist mid-hold) resets the
      // hold outright; only no-hand / "None" / low-confidence frames count
      // as a tolerable dropout.
      const otherGesture =
        observation.handPresent &&
        observation.gesture !== null &&
        observation.gesture !== "None" &&
        observation.gesture !== candidate &&
        observation.score >= minScoreFor(observation.gesture)
      if (candidate !== null && (otherGesture || now - candidateLastSeen > timing.dropoutToleranceMs)) candidate = null
      if (candidate !== null) holdFrames++
      return { state: observation.handPresent ? "uncertain" : "no-hand", action: null }
    }

    if (recognised !== candidate) {
      candidate = recognised
      candidateSince = now
      holdFrames = 0
      holdHits = 0
    }
    candidateLastSeen = now
    holdFrames++
    holdHits++

    const held = now - candidateSince >= timing.holdMs && holdHits / holdFrames >= timing.minHoldRatio
    // `latched === null` below already proves a same-gesture repeat has
    // re-armed, so only a *different* gesture waits out the cooldown.
    const cooledDown = recognised === lastFired || now - lastFireAt >= timing.cooldownMs
    if (held && cooledDown && latched === null) {
      latched = recognised
      latchAbsentSince = null
      lastFireAt = now
      lastFired = recognised
      return { state: "triggered", action: actions[recognised] }
    }
    return { state: "detected", action: null }
  }

  return { update, reset }
}
