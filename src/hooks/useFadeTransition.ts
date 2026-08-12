import { useCallback, useEffect, useRef, useState } from "react"

export type FadePhase = "none" | "exit" | "enter"

// The one approved timing (`App.tsx`'s original Intro → Camera Permission
// transition, matching `.app-screen-fade-*` in `index.css` exactly) —
// extracted here so every transition in the app shares these same three
// numbers instead of each maintaining its own copy that could drift.
const FADE_OUT_MS = 150
const FADE_IN_MS = 170
const REDUCED_FADE_MS = 80

type UseFadeTransitionResult<T> = {
  /** The value to actually render right now. During `"exit"` this is
   *  still the *previous* value — the outgoing content keeps rendering
   *  while it fades out; it only becomes the new value once stage 2 (the
   *  actual swap) runs, matching the approved "fade out → swap → fade in"
   *  sequence exactly. */
  displayedValue: T
  phase: FadePhase
  /** Apply verbatim to whichever wrapper element(s) fade for this
   *  transition — `""` while `phase === "none"` (the steady state, most
   *  of the time), so an always-present wrapper never carries stray
   *  classes outside an actual transition. Purely an `opacity` toggle
   *  (see `.app-screen-fade-*` in `index.css`) — no `position`/`display`
   *  change, so wrapping otherwise-unrelated content in it never affects
   *  layout. */
  fadeClassName: string
  /** Request a transition to `next`. No-op if a transition is already in
   *  flight or `next` already equals the currently displayed value —
   *  the one guard against a duplicate/overlapping transition, checked
   *  synchronously before anything else runs. */
  navigate: (next: T) => void
}

/**
 * The exact fade choreography `App.tsx`'s Intro → Camera Permission
 * transition originated — extracted here, unchanged, so every screen/
 * sub-screen transition in the app can share one implementation instead
 * of each hand-rolling its own copy of the same three-stage dance:
 *
 * 1. fade the current content out (`"exit"`, then `"exit"` + `--active`
 *    one frame later so the browser actually commits the *starting*
 *    opacity before animating away from it — two `requestAnimationFrame`s
 *    is the reliable version of that technique, not one);
 * 2. only once that fade-out finishes, swap `displayedValue` to `next`
 *    and immediately start fading the new content in the same way
 *    (`"enter"` → `"enter"` + `--active`);
 * 3. once the fade-in finishes, drop back to `phase === "none"` — the
 *    plain steady-state render, no wrapper needed.
 *
 * `prefers-reduced-motion` shortens both stages to the same ~80ms linear
 * fade the original transition already used — checked once, fresh, at
 * the start of each `navigate` call (not cached), so a user who changes
 * the OS setting between transitions gets the right behavior on the very
 * next one.
 *
 * Generic over `T` so this same hook drives both `App.tsx`'s top-level
 * `Screen` union and `CameraPermissionScreen`'s own local Permission ↔
 * Scanning sub-phase — two independent instances, each with its own
 * timers/state, never sharing a single transition across unrelated parts
 * of the tree.
 */
export function useFadeTransition<T>(initialValue: T): UseFadeTransitionResult<T> {
  const [displayedValue, setDisplayedValue] = useState<T>(initialValue)
  const [phase, setPhase] = useState<FadePhase>("none")
  const [phaseActive, setPhaseActive] = useState(false)
  const isTransitioningRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const navigate = useCallback(
    (next: T) => {
      if (isTransitioningRef.current || displayedValue === next) return
      isTransitioningRef.current = true

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const fadeOutMs = reducedMotion ? REDUCED_FADE_MS : FADE_OUT_MS
      const fadeInMs = reducedMotion ? REDUCED_FADE_MS : FADE_IN_MS

      // Stage 1 — fade the current content out.
      setPhase("exit")
      setPhaseActive(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhaseActive(true))
      })

      timeoutRef.current = window.setTimeout(() => {
        // Stage 2 — the actual swap, only now that the old content has
        // fully faded out.
        setDisplayedValue(next)
        setPhase("enter")
        setPhaseActive(false)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setPhaseActive(true))
        })

        timeoutRef.current = window.setTimeout(() => {
          // Stage 3 — settle: drop the fade wrapper, back to the plain
          // steady-state render.
          setPhase("none")
          setPhaseActive(false)
          isTransitioningRef.current = false
          timeoutRef.current = null
        }, fadeInMs)
      }, fadeOutMs)
    },
    [displayedValue],
  )

  const fadeClassName =
    phase === "none"
      ? ""
      : phase === "exit"
        ? `app-screen-fade-exit ${phaseActive ? "app-screen-fade-exit--active" : ""}`
        : `app-screen-fade-enter ${phaseActive ? "app-screen-fade-enter--active" : ""}`

  return { displayedValue, phase, fadeClassName, navigate }
}
