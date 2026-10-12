import { describe, expect, it } from "vitest"
import { GESTURE_ACTIONS, GESTURE_TIMING, gestureMinScore } from "./gestureConfig"
import { createGestureStabilizer, type GestureObservation } from "./gestureStabilizer"

// Every test drives the stabilizer with explicit timestamps on the same
// cadence the recognizer runs at in production, using the production
// timing/score/mapping config (the stabilizer's own defaults).
const { holdMs, dropoutToleranceMs, minHoldRatio, releaseMs, cooldownMs } = GESTURE_TIMING
const FRAME = GESTURE_TIMING.inferenceIntervalMs

/** First frame timestamp (on the `FRAME` grid) at or after `ms`. */
const frameAt = (ms: number) => Math.ceil(ms / FRAME) * FRAME

const seen = (gesture: string): GestureObservation => ({
  handPresent: true,
  gesture,
  score: gestureMinScore(gesture),
})
const noHand: GestureObservation = { handPresent: false, gesture: null, score: 0 }

type Frame = [now: number, observation: GestureObservation]

/** Frames showing `observation` from `from` to `to` inclusive, every `step` ms. */
function span(observation: GestureObservation, from: number, to: number, step = FRAME): Frame[] {
  const frames: Frame[] = []
  for (let now = from; now <= to; now += step) frames.push([now, observation])
  return frames
}

/** Feeds `frames` in order and returns every action that fired, with its time. */
function run(frames: Frame[]) {
  const stabilizer = createGestureStabilizer()
  const fired: Array<{ at: number; action: string }> = []
  for (const [now, observation] of frames) {
    const result = stabilizer.update(observation, now)
    if (result.action !== null) fired.push({ at: now, action: result.action })
  }
  return fired
}

describe("gesture stabilizer", () => {
  it("timing config keeps the frame cadence inside the dropout tolerance", () => {
    // Several scenarios below rely on one missed frame being tolerable and
    // two consecutive missed frames not being tolerable.
    expect(FRAME).toBeLessThanOrEqual(dropoutToleranceMs)
    expect(2 * FRAME).toBeGreaterThan(dropoutToleranceMs)
    // A released latch always outlasts the dropout tolerance.
    expect(releaseMs).toBeGreaterThan(dropoutToleranceMs)
  })

  describe("hold", () => {
    it("does not fire a gesture held for less than holdMs", () => {
      expect(run(span(seen("Open_Palm"), 0, frameAt(holdMs) - FRAME))).toEqual([])
    })

    it("fires once on the first frame at which the gesture has been held for holdMs", () => {
      expect(run(span(seen("Open_Palm"), 0, frameAt(holdMs)))).toEqual([{ at: frameAt(holdMs), action: "play" }])
    })

    it("reports detected while holding and triggered on the firing frame", () => {
      const stabilizer = createGestureStabilizer()
      expect(stabilizer.update(seen("Thumb_Up"), 0)).toEqual({ state: "detected", action: null })
      expect(stabilizer.update(seen("Thumb_Up"), frameAt(holdMs))).toEqual({ state: "triggered", action: "next" })
    })

    it("does not fire again while the same gesture is held continuously", () => {
      expect(run(span(seen("Open_Palm"), 0, 10_000))).toEqual([{ at: frameAt(holdMs), action: "play" }])
    })

    it("maps each approved gesture to its Player action", () => {
      for (const [gesture, action] of Object.entries(GESTURE_ACTIONS)) {
        expect(run(span(seen(gesture), 0, frameAt(holdMs)))).toEqual([{ at: frameAt(holdMs), action }])
      }
    })
  })

  describe("reset", () => {
    it("a partial hold before reset() does not count toward a gesture after it", () => {
      const stabilizer = createGestureStabilizer()
      const fired: Array<{ at: number; action: string }> = []
      const feed = (frames: Frame[]) => {
        for (const [now, observation] of frames) {
          const result = stabilizer.update(observation, now)
          if (result.action !== null) fired.push({ at: now, action: result.action })
        }
      }

      // Partial hold, one frame short of firing, including a tolerated
      // missed frame so the hold's frame counters are non-trivial.
      const lastBeforeReset = frameAt(holdMs) - FRAME
      feed([
        [0, seen("Open_Palm")],
        [FRAME, noHand],
        ...span(seen("Open_Palm"), 2 * FRAME, lastBeforeReset),
      ])
      expect(fired).toEqual([])

      stabilizer.reset()

      // Same gesture continues on the very next frame — exactly when it
      // would have fired had the pre-reset hold carried over.
      const resumeAt = lastBeforeReset + FRAME
      feed(span(seen("Open_Palm"), resumeAt, 10_000))
      expect(fired).toEqual([{ at: frameAt(resumeAt + holdMs), action: "play" }])
    })
  })

  describe("confidence and mapping", () => {
    it("ignores frames scored below the gesture's configured minimum", () => {
      for (const gesture of Object.keys(GESTURE_ACTIONS)) {
        const weak = { ...seen(gesture), score: gestureMinScore(gesture) - 0.01 }
        expect(run(span(weak, 0, 5_000))).toEqual([])
      }
    })

    it("accepts Open_Palm at its lower per-gesture threshold, below the default", () => {
      expect(gestureMinScore("Open_Palm")).toBeLessThan(gestureMinScore("Closed_Fist"))
      const palm = { ...seen("Open_Palm"), score: gestureMinScore("Open_Palm") }
      expect(run(span(palm, 0, frameAt(holdMs)))).toEqual([{ at: frameAt(holdMs), action: "play" }])
    })

    it("never fires an unmapped gesture, however confident", () => {
      const victory: GestureObservation = { handPresent: true, gesture: "Victory", score: 1 }
      expect(run(span(victory, 0, 5_000))).toEqual([])
    })
  })

  describe("valid-frame ratio", () => {
    it(`does not fire when fewer than ${minHoldRatio * 100}% of hold frames show the gesture`, () => {
      // Alternate gesture / no-hand at half the frame interval: every gap
      // stays within the dropout tolerance (so the hold is never reset),
      // but only ~50% of frames show the gesture.
      const half = FRAME / 2
      const frames: Frame[] = []
      for (let now = 0; now <= 5_000; now += FRAME) {
        frames.push([now, seen("Open_Palm")], [now + half, noHand])
      }
      expect(run(frames)).toEqual([])
    })
  })

  describe("dropouts", () => {
    it("a single missed frame within the dropout tolerance does not reset the hold", () => {
      // One no-hand frame early in the hold; the rest of the frames still
      // keep the hit ratio at or above minHoldRatio.
      const frames: Frame[] = [
        [0, seen("Open_Palm")],
        [FRAME, noHand],
        ...span(seen("Open_Palm"), 2 * FRAME, frameAt(holdMs)),
      ]
      expect(run(frames)).toEqual([{ at: frameAt(holdMs), action: "play" }])
    })

    it("a dropout longer than the tolerance restarts the hold", () => {
      const resumeAt = 3 * FRAME
      const frames: Frame[] = [
        [0, seen("Open_Palm")],
        // Two missed frames: the second is beyond the tolerance since last seen.
        [FRAME, noHand],
        [2 * FRAME, noHand],
        ...span(seen("Open_Palm"), resumeAt, 5_000),
      ]
      expect(run(frames)).toEqual([{ at: frameAt(resumeAt + holdMs), action: "play" }])
    })

    it("a confident unmapped gesture mid-hold restarts the hold immediately", () => {
      const resumeAt = 2 * FRAME
      const frames: Frame[] = [
        [0, seen("Open_Palm")],
        // Within the dropout tolerance, but a deliberate different pose.
        [FRAME, { handPresent: true, gesture: "Victory", score: 1 }],
        ...span(seen("Open_Palm"), resumeAt, 5_000),
      ]
      expect(run(frames)).toEqual([{ at: frameAt(resumeAt + holdMs), action: "play" }])
    })
  })

  describe("re-arm", () => {
    const firedAt = frameAt(holdMs)

    it("does not fire the same gesture again if it returns before releaseMs of absence", () => {
      const absentFrom = firedAt + FRAME
      const returnAt = frameAt(absentFrom + releaseMs) - FRAME // absent for less than releaseMs
      const frames: Frame[] = [
        ...span(seen("Open_Palm"), 0, firedAt),
        ...span(noHand, absentFrom, returnAt - FRAME),
        ...span(seen("Open_Palm"), returnAt, 10_000),
      ]
      expect(run(frames)).toEqual([{ at: firedAt, action: "play" }])
    })

    it("fires the same gesture again after releaseMs of absence and a fresh hold", () => {
      const absentFrom = firedAt + FRAME
      const releasedAt = frameAt(absentFrom + releaseMs)
      const returnAt = releasedAt + FRAME
      const frames: Frame[] = [
        ...span(seen("Open_Palm"), 0, firedAt),
        ...span(noHand, absentFrom, releasedAt),
        ...span(seen("Open_Palm"), returnAt, 10_000),
      ]
      const secondAt = frameAt(returnAt + holdMs)
      expect(run(frames)).toEqual([
        { at: firedAt, action: "play" },
        { at: secondAt, action: "play" },
      ])
      // A same-gesture repeat is gated by re-arm + hold, not by the cooldown.
      expect(secondAt - firedAt).toBeLessThan(cooldownMs)
    })
  })

  describe("cooldown between different gestures", () => {
    const firedAt = frameAt(holdMs)

    it("delays a different gesture until cooldownMs after the previous action", () => {
      const switchAt = firedAt + FRAME
      // Held long enough and the previous latch released well before the
      // cooldown ends, so the cooldown is the binding constraint.
      expect(switchAt + holdMs).toBeLessThan(firedAt + cooldownMs)
      expect(switchAt + releaseMs).toBeLessThan(firedAt + cooldownMs)

      const frames: Frame[] = [...span(seen("Open_Palm"), 0, firedAt), ...span(seen("Closed_Fist"), switchAt, 10_000)]
      expect(run(frames)).toEqual([
        { at: firedAt, action: "play" },
        { at: frameAt(firedAt + cooldownMs), action: "pause" },
      ])
    })

    it("fires a different gesture as soon as it is held once the cooldown has passed", () => {
      const switchAt = frameAt(firedAt + cooldownMs)
      const frames: Frame[] = [
        ...span(seen("Open_Palm"), 0, firedAt),
        ...span(noHand, firedAt + FRAME, switchAt - FRAME),
        ...span(seen("Closed_Fist"), switchAt, 10_000),
      ]
      expect(run(frames)).toEqual([
        { at: firedAt, action: "play" },
        { at: frameAt(switchAt + holdMs), action: "pause" },
      ])
    })
  })
})
