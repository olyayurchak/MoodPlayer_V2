import { useCallback, useEffect, useRef, useState } from "react"
import AppBackground from "../components/AppBackground"
import MoodPlayerLogo from "../components/MoodPlayerLogo"
import LanguageSwitcher from "../components/LanguageSwitcher"
import CameraPermissionVisual from "../components/CameraPermissionVisual"
import CameraPermissionCta from "../components/CameraPermissionCta"
import ScanningVisual, { type ScanningVisualHandle } from "../components/ScanningVisual"
import ScanningCta from "../components/ScanningCta"
import { cameraPermissionFeatures } from "../data/cameraPermissionFeatures"
import { useLanguage } from "../localization/LanguageContext"
import type { CameraStreamStatus } from "../camera/useCameraStream"
import { useScanProgress } from "../camera/useScanProgress"
import { useFadeTransition } from "../hooks/useFadeTransition"

/** This screen's own internal sub-phase — separate from, and never
 *  unmounting, the screen itself (see the doc comment on
 *  `useFadeTransition`'s use below for why that separation matters here
 *  specifically). */
type CameraPhase = "permission" | "scanning"

/** How much accumulated *valid* scanning time (see `ScanningVisual`'s
 *  `onValidScanChange`) it takes to reach the completed "Vibe found ✓"
 *  state. */
const SCAN_DURATION_MS = 4500

/**
 * Mood Detection / Camera Permission screen.
 *
 * Approved Figma frames: Desktop `284:2422` (1440×1024), Mobile `287:6243`
 * (430×932) — same file as Intro. UI only in this milestone: no
 * `getUserMedia`, no MediaPipe, no navigation into or out of this screen
 * (see `App.tsx` for how it's reached during development).
 *
 * Reuses `AppBackground` unmodified — its glow-blob data (`introGlows.ts`)
 * is byte-identical between the Intro and Camera-Permission Figma frames on
 * both breakpoints, confirmed against the Figma MCP output before writing
 * any of this file.
 *
 * Desktop shows a translucent bordered card (background/border/padding are
 * `lg:`-only utilities below); Mobile has no card chrome at all — per
 * Figma's own generated CSS, Mobile's equivalent wrapper carries neither a
 * background nor a border, so content floats directly on the page
 * background there. Desktop lays the decorative visual and the text column
 * out side by side; Mobile stacks them (visual above text), both centered
 * as a group, though the feature list itself stays left-aligned within its
 * own fixed 280px column on both breakpoints — exactly the asymmetry
 * Figma's own layout shows, not evened out here.
 *
 * Figma absolute-centers this card within each frame's fixed pixel size;
 * reproduced here with responsive flex-centering plus a `max-width` on the
 * card instead (Guidelines §5: prefer fluid layout over fixed positioning),
 * so the layout holds at viewport sizes other than exactly 1440×1024 or
 * 430×932. Working through the padding/centering arithmetic by hand
 * confirms this reproduces Figma's exact margins (1242px card in a 1440px
 * frame → 99px each side; 382px card in a 430px frame → 24px each side) at
 * precisely the reference sizes, while still degrading gracefully at other
 * widths. The one approved value not reproduced exactly: Mobile's card sits
 * 55px above true vertical centre in Figma (tuned against the fixed 932px
 * frame height specifically); this implementation centers it instead,
 * which holds correctly across viewport heights Figma's own fixed number
 * wouldn't.
 *
 * Scanning state (reached after granting camera access): approved Figma
 * frames Desktop `284:2460`, Mobile `289:6820` — confirmed (by comparing
 * both frames' metadata against this one's) to share this exact same
 * header/heading/body/features column verbatim, so only the left visual
 * and the CTA sub-component need to swap; everything else below stays
 * one unconditional tree.
 *
 * `stream`/`cameraStatus`/`requestAccess` are owned by `App.tsx`, not this
 * component — `useCameraStream` moved up there specifically because *this*
 * component does unmount, every time the user leaves for the Vibe Result
 * screen and later returns via "Scan again" (`App.tsx`'s top-level screen
 * swap mounts exactly one screen at a time). `App.tsx` never unmounts
 * during normal use, so the one `MediaStream` obtained there survives that
 * whole round trip untouched — reused on the repeat pass, never
 * re-requested, never stopped-and-recreated.
 *
 * The Permission → Scanning content swap fades via its own
 * `useFadeTransition` instance (`cameraFade` below) — the exact same
 * approved timing/CSS classes `App.tsx`'s top-level screen transitions
 * use, just applied locally to the left-visual and CTA sub-regions
 * instead of promoting this to a full top-level screen swap (which would
 * defeat the whole point above: a real screen swap unmounts this
 * component, which is exactly why the stream lives one level up now).
 * Its *initial* value is derived from `cameraStatus` at mount time, not
 * hardcoded to `"permission"`: on the very first visit `cameraStatus` is
 * `"idle"`, so it starts on the permission visual as always; landing here
 * again via "Scan again" (after access was already granted earlier)
 * means `cameraStatus` is already `"granted"` on this fresh mount, so it
 * starts directly on the scanning visual instead — no permission-
 * placeholder flash, no fade-through, because there's nothing to
 * transition away from in that case. The `useEffect` below still handles
 * the *first-time* case, where `cameraStatus` only becomes `"granted"`
 * sometime after mount (once the user clicks "Allow Camera") and the
 * fade needs to actually run at that later point.
 *
 * Out of scope for this milestone (per the current task):
 * mood classification and gesture recognition — granting access here
 * goes no further than the scanning state itself, and this component
 * still has no idea what a real suggested mood would be (see `App.tsx`'s
 * own doc comment on `onScanComplete` below for where that gap lives).
 *
 * Scan progress/completion: this component is where `ScanningVisual`'s
 * per-frame face/pose validity (reported via `onValidScanChange`, derived
 * from status logic that already lives entirely inside that component)
 * meets `useScanProgress`'s time accumulation, so `ScanningCta` itself
 * can stay a plain, stateless presentational pill. `onScanComplete` fires
 * exactly once, the instant `scanCompleted` first becomes `true` — no
 * added hold/delay beyond whatever `useScanProgress` itself already
 * produces, since none existed before this prop did either. At that same
 * instant, a ref to `ScanningVisual` is used to grab one still frame
 * (`ScanningVisualHandle.captureFrame`) for the Vibe Result screen's
 * static "captured you" visual — a plain in-memory JPEG data URL, handed
 * up through `onScanComplete` alongside the completion signal itself and
 * never stored anywhere in this component. `null` (not a thrown error) if
 * no frame was available at that instant; the Result screen is expected
 * to fall back to its own decorative placeholder in that case.
 */
export default function CameraPermissionScreen({
  stream,
  cameraStatus,
  requestAccess,
  onScanComplete,
}: {
  /** Owned by `App.tsx`, not this component — see the doc comment above
   *  on why. */
  stream: MediaStream | null
  cameraStatus: CameraStreamStatus
  requestAccess: () => void
  /** Fires once, the instant scanning's own completed state is first
   *  reached — see the doc comment above. `App.tsx` uses this to trigger
   *  the automatic Scanning → Vibe Result transition, and to receive the
   *  one captured still frame (or `null`); this component itself has no
   *  idea what happens to either value after, by design. */
  onScanComplete?: (capturedFrame: string | null) => void
}) {
  const { t } = useLanguage()
  const scanningVisualRef = useRef<ScanningVisualHandle>(null)

  // See the doc comment above — a local fade, not a top-level screen
  // swap, so the `stream` this component receives (owned in `App.tsx`)
  // never gets torn down for this transition. Starts on `"scanning"`
  // directly (skipping the permission visual entirely, no flash) when
  // `cameraStatus` is already `"granted"` at mount time — the "Scan
  // again" repeat-visit case; starts on `"permission"` otherwise — the
  // first-time case, unchanged.
  const {
    displayedValue: cameraPhase,
    fadeClassName: cameraFadeClassName,
    navigate: navigateCameraFade,
  } = useFadeTransition<CameraPhase>(cameraStatus === "granted" ? "scanning" : "permission")
  const isScanning = cameraPhase === "scanning"

  useEffect(() => {
    if (cameraStatus === "granted") navigateCameraFade("scanning")
    // `navigateCameraFade` itself already no-ops once `cameraPhase` is
    // already `"scanning"` (see `useFadeTransition`'s own guard), so this
    // can run on every render where `cameraStatus` is `"granted"` without
    // re-triggering the fade.
  }, [cameraStatus, navigateCameraFade])

  // `ScanningVisual` owns the actual face/pose detection this boolean is
  // derived from — it only ever reports the boolean via
  // `onValidScanChange`, never any progress/timing state of its own. A
  // stable callback (`useCallback`) so that effect doesn't re-run merely
  // because this component re-rendered.
  const [isValidScanning, setIsValidScanning] = useState(false)
  const handleValidScanChange = useCallback((next: boolean) => setIsValidScanning(next), [])
  const { progress: scanProgress, completed: scanCompleted } = useScanProgress(isValidScanning, SCAN_DURATION_MS)

  useEffect(() => {
    if (scanCompleted) onScanComplete?.(scanningVisualRef.current?.captureFrame() ?? null)
    // `scanCompleted` only ever goes false → true once per mount (see
    // `useScanProgress`'s own "terminal state" doc comment) — no need to
    // guard against firing more than once here beyond that.
  }, [scanCompleted, onScanComplete])

  return (
    <main className="relative flex min-h-[max(100dvh,var(--spacing-frame-h))] items-center justify-center overflow-hidden bg-bg-base p-[24px] lg:min-h-[max(100dvh,var(--spacing-frame-h-lg))]">
      <AppBackground />
      <div className="relative flex w-full max-w-[382px] flex-col items-start gap-[64px] rounded-[24px] backdrop-blur-[20px] lg:max-w-[1242px] lg:border-[1.5px] lg:border-[rgba(255,255,255,0.12)] lg:bg-[rgba(118,118,118,0.08)] lg:p-[64px]">
        <div className="flex w-full items-center justify-between">
          <MoodPlayerLogo />
          <LanguageSwitcher />
        </div>

        <div className="flex w-full flex-col items-center gap-[24px] lg:flex-row lg:items-start lg:gap-[54px]">
          <div className={cameraFadeClassName}>
            {isScanning ? (
              <ScanningVisual ref={scanningVisualRef} stream={stream} onValidScanChange={handleValidScanChange} />
            ) : (
              <CameraPermissionVisual />
            )}
          </div>

          <div className="flex w-full flex-col items-start gap-[54px] lg:w-[568px]">
            <div className="flex flex-col items-start gap-[36px]">
              <div className="flex flex-col items-center gap-[8px] text-center lg:items-start lg:text-left">
                <h1 className="text-[38px] font-medium leading-[1.2] text-white lg:whitespace-nowrap lg:text-[60px]">
                  {t.cameraPermission.heading}
                </h1>
                <p className="w-full font-light leading-[1.4] text-[18px] text-[#f1f1f1] lg:w-[508px]">
                  {t.cameraPermission.body}
                </p>
              </div>

              {/* `w-[280px]` (was) → `w-[322px]`. The third bullet's copy
                  ("We don't save your photos or videos" / "Ми не
                  зберігаємо твої фото чи відео") no longer fits this
                  column's original width on one line at the approved
                  16px/font-light size — measured natural (unwrapped) text
                  width is ~260px EN / ~272px UA, plus this row's own fixed
                  24px icon + 24px icon-to-text gap (48px), so the column
                  needs ≥~320px; UA is the longer of the two and sets the
                  floor. 322px clears that with a couple px to spare while
                  staying safely inside the available column width (327px
                  measured at the narrowest supported viewport, 375px) —
                  the widest this can go without pushing into the panel's
                  own edge, which would be an overall-layout change this
                  task is explicit is out of scope. Only this one list's
                  width changed — the vertical `gap-[16px]` *between*
                  bullets, icons, typography, and every other element on
                  this screen are untouched. */}
              <ul className="flex w-[322px] list-none flex-col items-start gap-[16px]">
                {cameraPermissionFeatures.map((feature) => (
                  <li key={feature.id} className="flex w-full items-center gap-[24px]">
                    <img src={feature.icon} alt="" className="size-[24px] shrink-0" />
                    <span
                      className="font-light leading-[1.2] text-[#f1f1f1]"
                      style={{ fontSize: feature.labelSize }}
                    >
                      {t.cameraPermission.features[feature.id]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`w-full ${cameraFadeClassName}`}>
              {isScanning ? (
                <ScanningCta progress={scanProgress} completed={scanCompleted} />
              ) : (
                <CameraPermissionCta onClick={requestAccess} disabled={cameraStatus === "requesting"} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
