import { useCallback, useEffect, useState } from "react"
import IntroScreen from "./screens/IntroScreen"
import CameraPermissionScreen from "./screens/CameraPermissionScreen"
import VibeResultScreen from "./screens/VibeResultScreen"
import type { MoodId } from "./data/moods"
import { useFadeTransition } from "./hooks/useFadeTransition"
import { useCameraStream } from "./camera/useCameraStream"

type Screen = "intro" | "camera-permission" | "vibe-result"

/** `?screen=camera-permission` / `?screen=vibe-result` still work as direct
 *  dev-preview links — read once, only for the initial screen, so they
 *  keep behaving exactly as the first one did before any CTA/auto-
 *  transition could navigate here itself. `vibe-result` reached this way
 *  uses the same `TEMP_DEV_FIXTURE_SUGGESTED_MOOD` the real automatic
 *  transition does — there's no other mood value to show yet either way. */
function initialScreen(): Screen {
  const param = new URLSearchParams(window.location.search).get("screen")
  return param === "camera-permission" || param === "vibe-result" ? param : "intro"
}

/**
 * Real mood classification doesn't exist anywhere in this codebase yet
 * (Guidelines: do not invent facial-expression classification, and this
 * task explicitly forbids implementing it). This is a deliberately
 * isolated, clearly-named development fixture standing in for that real
 * value — the one thing `handleScanComplete` below hands to
 * `VibeResultScreen` — so the screen and its automatic-transition wiring
 * can be built and visually verified now. Replace this single constant
 * (and nothing else) once a real suggested-mood value exists; every other
 * piece of this flow (the transition trigger, the Result screen itself)
 * already treats the mood as an opaque `MoodId` it's simply handed,
 * making no assumption about where it came from.
 */
const TEMP_DEV_FIXTURE_SUGGESTED_MOOD: MoodId = "chill"

/**
 * No router exists — `useFadeTransition` (see that file) owns the actual
 * "current screen + fade phase around each switch" state machine; this
 * component only supplies *which* screen to switch to and when. Exactly
 * one screen is ever mounted at a time, before, during, and after a
 * transition — the hook only ever fades that one screen out, swaps it,
 * then fades the new one in. Outside a transition window (`phase ===
 * "none"`) the render below is exactly the original bare conditional,
 * with zero extra wrapper markup — unchanged from before this file
 * started sharing its transition logic via the hook.
 *
 * Three transitions go through this one shared `navigate` (a thin wrapper
 * around `useFadeTransition`'s own), rather than three separate copies of
 * the same three-stage fade logic:
 * - Intro's CTA click → "camera-permission" (the original, approved
 *   transition — this file's own use of the hook reproduces it exactly,
 *   same timings/CSS classes, just no longer hand-rolled inline);
 * - `CameraPermissionScreen`'s `onScanComplete` → "vibe-result", fired
 *   the instant scanning's own completed ("Vibe found") state is first
 *   reached, with no click/tap/key press in between;
 * - `VibeResultScreen`'s "Scan again" → back to "camera-permission". This
 *   remounts `CameraPermissionScreen` fresh (a new `useScanProgress`, so
 *   progress/completion reset automatically with no dedicated reset code
 *   needed), but *not* a fresh camera stream — `useCameraStream` is owned
 *   here, in `App.tsx`, specifically so it survives that remount. Camera
 *   access already granted on the first pass through this flow is simply
 *   reused on every later "Scan again", never re-requested, never
 *   stopped-and-recreated — see `CameraPermissionScreen`'s own doc
 *   comment for how it detects this at mount time and skips straight to
 *   its scanning visual with no permission-placeholder flash.
 *
 * A fourth transition — Camera Permission's own internal Permission ↔
 * Scanning content swap — deliberately does *not* go through this
 * top-level hook: promoting it to a full screen swap here would unmount
 * `CameraPermissionScreen` itself, which is a much bigger deal now that
 * `useCameraStream` moved up a level specifically to survive that
 * component's own remounts — this local content swap is the one meant to
 * unmount it (deliberately, to allow the "Scan again" repeat-visit
 * behavior above), not something to layer *another* full unmount on top
 * of. Instead `CameraPermissionScreen` runs its own separate
 * `useFadeTransition` instance internally, fading only its left-visual/
 * CTA sub-regions while the screen itself stays mounted throughout — see
 * that file.
 */
export default function App() {
  const { displayedValue: screen, fadeClassName, navigate } = useFadeTransition<Screen>(initialScreen())
  // Owned here (not inside `CameraPermissionScreen`) so the one
  // `MediaStream` obtained on first grant survives every later "Scan
  // again" round trip through the Vibe Result screen — see the doc
  // comment above and `CameraPermissionScreen`'s own for the full
  // reasoning. Passed down as plain props; `CameraPermissionScreen` never
  // calls `useCameraStream` itself.
  const { stream, status: cameraStatus, requestAccess } = useCameraStream()
  // The one still frame captured the instant scanning completes (see
  // `CameraPermissionScreen`'s `onScanComplete`) — a plain in-memory JPEG
  // data URL, never written to `localStorage`/`sessionStorage`/IndexedDB,
  // never uploaded anywhere. Lives only as long as this component instance
  // does: a page refresh clears it along with every other piece of React
  // state here, and "Scan again" clears it explicitly (see the effect
  // below, right after `handleScanAgain`) so a stale frame from a
  // previous scan can never leak into a new one.
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null)

  const handleCtaClick = useCallback(() => {
    if (screen === "intro") navigate("camera-permission")
  }, [screen, navigate])

  const handleScanComplete = useCallback(
    (capturedFrameArg: string | null) => {
      if (screen !== "camera-permission") return
      setCapturedFrame(capturedFrameArg)
      navigate("vibe-result")
    },
    [screen, navigate],
  )

  const handleScanAgain = useCallback(() => {
    if (screen !== "vibe-result") return
    navigate("camera-permission")
  }, [screen, navigate])

  // Clears the previous scan's captured frame — but only once `screen`
  // has actually swapped away from `"vibe-result"`, i.e. only after
  // `VibeResultScreen` has already unmounted. Clearing this synchronously
  // inside `handleScanAgain` (the previous approach) forced the still-
  // mounted, still fading-out `VibeResultScreen` to re-render immediately
  // with `capturedFrame` now `null` — which swaps its photo panel from
  // the just-captured frame to its decorative Figma placeholder (the
  // static "portrait" asset) for the remainder of that exit fade: an
  // unrelated person's photo flashing on screen for no reason connected
  // to the live scan about to start. Deferring the clear to this effect
  // means nothing ever renders that empty/placeholder value — by the
  // time it runs, the screen showing `capturedFrame` is already gone.
  useEffect(() => {
    if (screen !== "vibe-result") setCapturedFrame(null)
  }, [screen])

  function renderScreen(current: Screen) {
    switch (current) {
      case "vibe-result":
        return (
          <VibeResultScreen
            suggestedMood={TEMP_DEV_FIXTURE_SUGGESTED_MOOD}
            capturedFrame={capturedFrame}
            onScanAgain={handleScanAgain}
          />
        )
      case "camera-permission":
        return (
          <CameraPermissionScreen
            stream={stream}
            cameraStatus={cameraStatus}
            requestAccess={requestAccess}
            onScanComplete={handleScanComplete}
          />
        )
      default:
        return <IntroScreen onCtaClick={handleCtaClick} />
    }
  }

  // Always the same two-`<div>` wrapper shape, in every phase including
  // `"none"` (the steady state, most of the time) — `fadeClassName` is
  // simply `""` then, so this renders pixel-identical to a bare
  // `renderScreen(screen)` (`bg-bg-base` is only a background-color
  // utility, see `index.css` for why it's here at all; it adds no layout).
  // This *used* to branch — `phase === "none"` returned `renderScreen(screen)`
  // directly, with zero wrapper markup — which looked harmless but wasn't:
  // the instant a transition's fade-in finished and `phase` settled back to
  // `"none"`, the element at this exact tree position flipped from `<div
  // className="bg-bg-base">` to e.g. `<CameraPermissionScreen>` directly —
  // a different element type at the same position, so React tears down and
  // remounts the *entire* subtree, `CameraPermissionScreen` included, a
  // second time. Invisible on the very first scan (still on the permission
  // prompt at that moment, nothing scanning-related mounted yet to lose),
  // but on "Scan again" — where `cameraStatus` is already `"granted"`, so
  // scanning starts on the very first render — this silently discarded
  // whatever `useScanProgress` had already accumulated the instant the
  // fade-in's ~170ms elapsed, restarting the fill from 0 mid-animation.
  // Keeping the wrapper shape constant across every phase means the screen
  // underneath it is mounted exactly once per `navigate()`, not twice.
  return (
    <div className="bg-bg-base">
      <div className={fadeClassName}>{renderScreen(screen)}</div>
    </div>
  )
}
