import { useEffect, useRef, useState } from "react"

export type ScanProgress = {
  /** 0–1. Represents accumulated *valid* scanning time so far, out of
   *  `durationMs`. Never decreases on its own — pausing (see below)
   *  freezes it in place rather than letting it drift back down. */
  progress: number
  /** Becomes `true` the instant `progress` reaches 1 and stays `true`
   *  from then on — there is no auto-reset back to scanning within this
   *  hook (see the module doc comment on why). */
  completed: boolean
}

/**
 * Accumulates *valid* scanning time — real elapsed time, but only while
 * `isValidScanning` is `true` — until it reaches `durationMs`, then reports
 * `completed`. Time elapsed while `isValidScanning` is `false` is simply
 * not added: the accumulator pauses in place and resumes from exactly
 * where it left off the next time `isValidScanning` becomes `true` again,
 * rather than resetting to zero or continuing to advance independently of
 * whether scanning is actually usable right now.
 *
 * Deliberately has no reset path once `completed` becomes `true` — this
 * hook's caller (`ScanningVisual`'s scanning-state screen) has no
 * mood-result screen to transition to yet, so "done" is meant to be a
 * stable terminal state for this milestone, not something that would
 * silently flip back to "Scanning…" on its own.
 *
 * Uses a `requestAnimationFrame` loop (matching the rest of this camera
 * pipeline's per-frame update pattern, e.g. `useFaceLandmarker`'s own
 * detection loop) rather than `setInterval`, so progress advances in step
 * with real wall-clock time regardless of frame rate, and pauses cleanly
 * the instant `isValidScanning` flips (no partially-counted tick).
 *
 * Correctly restarts from `0` on every fresh mount — including each
 * "Scan again" round trip, since `CameraPermissionScreen` (this hook's
 * only caller) is itself remounted fresh every time (see `App.tsx`). The
 * actual "doesn't visibly fill on Scan again" bug traced to here turned
 * out to be one level up, in `App.tsx`'s own render structure causing an
 * *extra*, unwanted second mount of this hook mid-transition — see that
 * file's own doc comment.
 */
export function useScanProgress(isValidScanning: boolean, durationMs: number): ScanProgress {
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)

  // Milliseconds of valid scanning time accumulated so far — persists
  // across pause/resume (i.e. across effect re-runs triggered by
  // `isValidScanning` changing) since it's a ref, not state reset by
  // this effect.
  const accumulatedMsRef = useRef(0)
  // The timestamp of the last tick counted toward `accumulatedMsRef`;
  // `null` whenever scanning is currently invalid (or hasn't started
  // yet), which is exactly what makes the *next* valid tick add zero
  // elapsed time instead of the whole paused gap.
  const lastTimestampRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (completed) return // Terminal — no further accumulation or ticking.

    function tick(now: number) {
      if (isValidScanning) {
        if (lastTimestampRef.current !== null) {
          accumulatedMsRef.current += now - lastTimestampRef.current
        }
        lastTimestampRef.current = now
      } else {
        lastTimestampRef.current = null
      }

      const next = Math.min(1, accumulatedMsRef.current / durationMs)
      setProgress(next)

      if (next >= 1) {
        setCompleted(true)
        return // Stop ticking — completion is terminal.
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      // A fresh tick after this effect re-runs (e.g. `isValidScanning`
      // flipped) must not count the time that passed *during* the gap
      // between cleanup and the next effect's first tick.
      lastTimestampRef.current = null
    }
  }, [isValidScanning, completed, durationMs])

  return { progress, completed }
}
