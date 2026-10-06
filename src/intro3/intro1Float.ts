import { desktopBubbles, mobileBubbles, type BubbleSpec } from "../data/introBubbles"

/**
 * Intro 1's idle bubble float, reproduced for Intro 3 Variant C's orbs.
 *
 * Source of truth (unchanged, not imported — Intro 1 runs it as CSS):
 * - per-bubble parameters: `MoodBubble.tsx` ("Idle-float tuning");
 * - paths and timing: `index.css` (`.bubble-float`, `@keyframes
 *   bubble-float-1/2/3`, `animation-timing-function: ease-in-out`).
 *
 * Every value is derived the same way from the same data (`desktopBubbles` /
 * `mobileBubbles`, by the bubble's array index), so each orb floats exactly
 * like the Intro 1 bubble whose slot it occupies. Keep in sync with those two
 * files if Intro 1's float changes.
 */
export type FloatParams = {
  /** Keyframe path, 1 | 2 | 3 (`bubble-float-N`). */
  variant: 1 | 2 | 3
  /** `--bubble-float-x` / `--bubble-float-y`, CSS px. */
  ampX: number
  ampY: number
  /** `animation-duration` / `animation-delay`, seconds. */
  duration: number
  delay: number
}
/** An orb's float per breakpoint (`null` where it has no Intro 1 bubble). */
export type OrbFloat = { desktop: FloatParams | null; mobile: FloatParams | null }

/** `MoodBubble.tsx`: the Mobile-only amplitude reduction. */
const MOBILE_FLOAT_AMPLITUDE_SCALE = 0.7

/** `MoodBubble.tsx`'s formulas, verbatim. */
function floatFor(bubble: BubbleSpec, index: number, isMobile: boolean): FloatParams {
  const side = bubble.clipCircle ? bubble.maskSize : bubble.size
  const floatAmplitudeBaseX = side >= 220 ? 2.5 : side >= 150 ? 3.5 : 4.5
  const ampX = isMobile ? floatAmplitudeBaseX * MOBILE_FLOAT_AMPLITUDE_SCALE : floatAmplitudeBaseX
  return {
    variant: ((index % 3) + 1) as 1 | 2 | 3,
    ampX,
    ampY: ampX * 0.7,
    duration: 7 + (index % 5),
    delay: -((index % 7) * 1.3),
  }
}

/** Float for the Intro 1 bubbles at these array indices (the orb slot's
 *  `order`, which is exactly that index). */
export function intro1Float(desktopIndex: number, mobileIndex: number | null): OrbFloat {
  return {
    desktop: floatFor(desktopBubbles[desktopIndex], desktopIndex, false),
    mobile: mobileIndex === null ? null : floatFor(mobileBubbles[mobileIndex], mobileIndex, true),
  }
}

/** `index.css` keyframes: [offset, x factor, y factor] (y down, CSS). */
const PATHS: Record<1 | 2 | 3, readonly (readonly [number, number, number])[]> = {
  1: [[0, 0, 0], [0.25, 1, -0.6], [0.5, 0.2, 1], [0.75, -1, 0.4], [1, 0, 0]],
  2: [[0, 0, 0], [0.3, -0.8, 0.7], [0.65, 0.9, -0.5], [1, 0, 0]],
  3: [[0, 0, 0], [0.2, 0.6, 0.8], [0.55, -1, -0.3], [0.8, 0.3, -0.9], [1, 0, 0]],
}

/** CSS `ease-in-out` = cubic-bezier(0.42, 0, 0.58, 1), applied per keyframe
 *  segment as CSS does. Newton on x(s), then y(s). */
function easeInOut(t: number) {
  let s = t
  for (let i = 0; i < 8; i++) {
    const x = 3 * 0.42 * s * (1 - s) ** 2 + 3 * 0.58 * s * s * (1 - s) + s ** 3 - t
    const dx = 3 * 0.42 * (1 - s) ** 2 + 6 * (0.58 - 0.42) * s * (1 - s) + 3 * (1 - 0.58) * s * s
    if (Math.abs(x) < 1e-5 || dx < 1e-6) break
    s = Math.min(1, Math.max(0, s - x / dx))
  }
  return 3 * s * s * (1 - s) + s ** 3
}

/** The float's translation at `time` seconds, in CSS px (x right, y down) —
 *  what Intro 1's `.bubble-float` layer would show. */
export function floatOffset(params: FloatParams, time: number): [number, number] {
  let progress = ((time - params.delay) / params.duration) % 1
  if (progress < 0) progress += 1
  const path = PATHS[params.variant]
  for (let i = 0; i < path.length - 1; i++) {
    const [o0, x0, y0] = path[i]
    const [o1, x1, y1] = path[i + 1]
    if (progress <= o1) {
      const e = easeInOut((progress - o0) / (o1 - o0))
      return [params.ampX * (x0 + (x1 - x0) * e), params.ampY * (y0 + (y1 - y0) * e)]
    }
  }
  return [0, 0]
}
