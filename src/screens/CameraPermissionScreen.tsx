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
import type { FaceLandmarkerStatus } from "../camera/useFaceLandmarker"
import { useExpressionSampler } from "../camera/useExpressionSampler"
import type { MoodId } from "../data/moods"
import { useFadeTransition } from "../hooks/useFadeTransition"

/** This screen's own internal sub-phase — separate from, and never
 *  unmounting, the screen itself (see the doc comment on
 *  `useFadeTransition`'s use below for why that separation matters here
 *  specifically). */
type CameraPhase = "permission" | "scanning"

/** Which (if any) camera/MediaPipe error-recovery state is currently
 *  active — see the doc comment on the `errorKind` state below for the
 *  full state-machine this drives. `null` is the normal, no-error case
 *  (either the original permission prompt or an in-progress/successful
 *  scan). */
type CameraErrorKind = "denied" | "unavailable" | "mediapipe" | null

/** How much accumulated *valid* scanning time (see `ScanningVisual`'s
 *  `onValidScanChange`) it takes to reach the completed "Vibe found ✓"
 *  state. */
const SCAN_DURATION_MS = 4500

/** How long `cameraStatus` must stay `"requesting"` before the CTA's
 *  `requestingLabel` ("Requesting access…") actually appears — see the
 *  `showRequestingLabel` effect below. Keeps a near-instant `getUserMedia`
 *  resolution (e.g. permission already granted from an earlier grant this
 *  session) from flashing the label for a single frame; anything still
 *  pending past this threshold gets the real in-flight feedback. */
const REQUESTING_LABEL_DELAY_MS = 700

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
 * Mobile's own `<main>` no longer forces a `932px` floor the way Intro/
 * Vibe Result/Player still do (`min-h-[max(100dvh,var(--spacing-frame-h))]`)
 * — a measured audit found that floor pushing "Allow Camera" fully or
 * partially below the initial viewport on shorter iPhones (375×667,
 * 375×812), even though this screen's own real content only needs
 * ~724px, nowhere near 932. `min-h-[100dvh]` alone (no `max()`, no shared
 * token) is enough: at the 430×932 reference size `100dvh` already equals
 * 932, so the approved composition there is unaffected; on shorter
 * viewports the box now shrinks to whatever's actually needed instead of
 * an arbitrary floor. This intentionally only touches *this* screen's own
 * Mobile branch, not the shared `--spacing-frame-h` token itself (Intro/
 * Vibe Result/Player still reference it, unchanged) and not Desktop's own
 * `lg:min-h-[max(100dvh,var(--spacing-frame-h-lg))]`.
 *
 * Four of this Mobile column's own pure-spacing gaps additionally compact
 * under a combined `(max-width:1023px) and (max-height:700px)` variant —
 * 700px sits comfortably below 375×812 (never triggers there — that
 * viewport is already fully fixed by the `min-h` change alone) and
 * comfortably above 375×667 (always triggers there), so 812/852/932 all
 * render with their exact original gaps; only the shortest supported
 * viewport gets this further compaction:
 * - the card's own `gap-[64px]` (header row → visual/text block) → `40px`;
 * - the Mobile visual→text-column row gap (`gap-[24px]`, this row's own
 *   image-to-content separator, not tied to any text's own line-height
 *   rhythm) → `14px`;
 * - the heading-block→feature-list gap (`gap-[36px]`, a section break) →
 *   `16px`;
 * - the text column's own `gap-[54px]` (features → CTA) → `22px`.
 *
 * An earlier pass pushed all four gaps much further (down to as little as
 * `2px`) specifically to eliminate scroll entirely at 375×667 — that
 * technically fit, but read as visually collapsed, with too little
 * separation between the visual, heading, feature list, and CTA to still
 * feel like distinct sections. The values above restore a clearly readable
 * gap at each of those boundaries instead, deliberately accepting a small
 * amount of natural scroll at 375×667 (this screen's own real content is
 * still slightly taller than that one viewport) rather than compressing
 * hierarchy away to chase zero scroll. Deliberately left untouched, to
 * keep each block's own internal rhythm legible: the tighter `gap-[8px]`
 * heading-to-subtitle spacing, and the feature list's own `gap-[16px]`
 * *between* its three rows.
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
 * Out of scope for this milestone (per the current task): gesture
 * recognition. Mood classification, however, is now real — see
 * `getAnalysis` below and `useExpressionSampler`'s own doc comment for
 * why it's a synchronous, on-demand function rather than React state.
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
 * static "captured you" visual, and `useExpressionSampler`'s own
 * `getAnalysis()` is called to get the real classified `MoodId` for this
 * scan — both handed up through `onScanComplete` together, synchronously,
 * in the same instant. The captured frame is a plain in-memory JPEG data
 * URL, never stored anywhere in this component; `null` (not a thrown
 * error) if no frame was available at that instant, and the Result
 * screen is expected to fall back to its own decorative placeholder in
 * that case. `getAnalysis()` itself never fails — see `analyzeMoodV1`'s
 * own doc comment on why it's a total function that always returns a
 * real `MoodId`, never a missing/undefined result.
 *
 * `LanguageSwitcher` sits back inside the header row alongside
 * `MoodPlayerLogo` (`justify-between` puts the logo left / switcher
 * right), matching Figma node `284:2526`'s own header row exactly — a
 * later, explicit task restored this after a brief detour where it lived
 * absolutely positioned on this `<main>` instead (pinned to the true
 * viewport corner, independent of this panel's own vertical centering, to
 * match `IntroScreen`'s switcher position at the time). `IntroScreen`'s
 * own switcher has since moved to its own distinct position and is
 * explicitly out of scope for this reversion — only this screen's (and
 * `VibeResultScreen`'s matching) header row is restored to the
 * Figma-matching in-container layout.
 */
export default function CameraPermissionScreen({
  stream,
  cameraStatus,
  requestAccess,
  onScanComplete,
  onLogoClick,
}: {
  /** Owned by `App.tsx`, not this component — see the doc comment above
   *  on why. */
  stream: MediaStream | null
  cameraStatus: CameraStreamStatus
  requestAccess: () => void
  /** Fires once, the instant scanning's own completed state is first
   *  reached — see the doc comment above. `App.tsx` uses this to trigger
   *  the automatic Scanning → Vibe Result transition, and to receive both
   *  the one captured still frame (or `null`) and the real classified
   *  `MoodId` for this scan; this component itself has no idea what
   *  happens to either value after, by design. */
  onScanComplete?: (capturedFrame: string | null, suggestedMood: MoodId) => void
  /** Forwarded straight to `MoodPlayerLogo`'s own `onClick` — see
   *  `App.tsx`'s `handleLogoClick` for the actual "navigate to Intro"
   *  behavior; this screen has no navigation logic of its own. */
  onLogoClick?: () => void
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

  // Which error-recovery state (if any) is currently shown in place of the
  // normal heading/subtitle/CTA — see `CameraErrorKind`'s own doc comment.
  // Two independent sources feed this, never both relevant at once:
  // - `cameraStatus` (camera permission/`getUserMedia` failures) — synced
  //   below, purely a function of that status, so it can never drift out
  //   of sync with what `useCameraStream` itself reports.
  // - `ScanningVisual`'s own `onFaceStatusChange` (MediaPipe init/runtime
  //   failures) — can only ever be reported while `ScanningVisual` is
  //   actually mounted, which (see `isScanning` below) is only while
  //   `errorKind` is `null` — so a `"mediapipe"` error can only be *set*
  //   from there, never re-confirmed while already set.
  const [errorKind, setErrorKind] = useState<CameraErrorKind>(null)

  useEffect(() => {
    if (cameraStatus === "denied") setErrorKind("denied")
    else if (cameraStatus === "unavailable" || cameraStatus === "error") setErrorKind("unavailable")
    else if (cameraStatus === "granted") {
      // Only clear a camera-side error here — a `"mediapipe"` error is
      // this screen's own separate concern (see the doc comment above)
      // and must never be silently cleared just because the *camera*
      // happens to still be granted.
      setErrorKind((prev) => (prev === "denied" || prev === "unavailable" ? null : prev))
    }
  }, [cameraStatus])

  useEffect(() => {
    if (cameraStatus === "granted") navigateCameraFade("scanning")
    // `navigateCameraFade` itself already no-ops once `cameraPhase` is
    // already `"scanning"` (see `useFadeTransition`'s own guard), so this
    // can run on every render where `cameraStatus` is `"granted"` without
    // re-triggering the fade.
  }, [cameraStatus, navigateCameraFade])

  // Only render the live Scanning visual while there's no active error —
  // a `"mediapipe"` error must fall all the way back to the plain static
  // `CameraPermissionVisual` (see this task's own "keep the left side
  // completely unchanged" requirement), not stay on `ScanningVisual` with
  // some broken/frozen live state layered on top of it.
  const isScanning = cameraPhase === "scanning" && errorKind === null

  // `ScanningVisual` owns the actual face/pose detection this boolean is
  // derived from — it only ever reports the boolean via
  // `onValidScanChange`, never any progress/timing state of its own. A
  // stable callback (`useCallback`) so that effect doesn't re-run merely
  // because this component re-rendered.
  const [isValidScanning, setIsValidScanning] = useState(false)
  const handleValidScanChange = useCallback((next: boolean) => setIsValidScanning(next), [])
  // Bumped only by a MediaPipe-error "Try Again" (see `handleTryAgain`
  // below) — forces `useScanProgress` to reset accumulated progress back
  // to `0%` for that one retry path specifically. Never touched by the
  // normal no-face pause/resume, camera-permission retry, or the initial
  // grant — see `useScanProgress`'s own `resetKey` doc comment.
  const [scanResetKey, setScanResetKey] = useState(0)
  const { progress: scanProgress, completed: scanCompleted } = useScanProgress(
    isValidScanning,
    SCAN_DURATION_MS,
    scanResetKey,
  )

  // Real expression sampling + mood classification — reuses
  // `isValidScanning` and `scanResetKey` verbatim so a MediaPipe retry
  // clears stale samples in lockstep with `useScanProgress` resetting
  // progress, with no separate reset plumbing. `recordSample` is passed
  // straight through to `ScanningVisual` as `onBlendshapesChange` below —
  // deliberately *not* mirrored into a `blendshapes` state here first (an
  // earlier version did, which caused a real "Maximum update depth
  // exceeded" crash during continuous scanning: blendshapes change on
  // essentially every frame, and `setState`-ing that here on every frame
  // cascaded back down into `ScanningVisual` every frame too). See
  // `useExpressionSampler`'s own doc comment for the full explanation,
  // including why `getAnalysis` is a synchronous on-demand function
  // rather than similarly-mirrored state.
  const { recordSample, getAnalysis } = useExpressionSampler(isValidScanning, scanResetKey, scanCompleted)

  // Reports this mounted `ScanningVisual` instance's own MediaPipe status —
  // see `CameraErrorKind`'s doc comment above. Only a transition *into*
  // `"error"` is acted on here; every other status already has its own
  // existing handling entirely inside `ScanningVisual` (its `caption`),
  // so this effect has nothing to do for those beyond the no-op branch.
  const handleFaceStatusChange = useCallback((status: FaceLandmarkerStatus) => {
    if (status === "error") setErrorKind("mediapipe")
  }, [])

  useEffect(() => {
    if (!scanCompleted) return
    const capturedFrame = scanningVisualRef.current?.captureFrame() ?? null
    // `getAnalysis()` is a synchronous, on-demand read of this scan's own
    // accumulated samples (see `useExpressionSampler`'s own doc comment)
    // — calling it here, in the same instant as the capture above, means
    // both values reach `onScanComplete` together with no state-update
    // race between this effect and `useExpressionSampler`'s internal one.
    const { mood } = getAnalysis()
    onScanComplete?.(capturedFrame, mood)
    // `scanCompleted` only ever goes false → true once per mount (see
    // `useScanProgress`'s own "terminal state" doc comment) — no need to
    // guard against firing more than once here beyond that.
  }, [scanCompleted, onScanComplete, getAnalysis])

  // Delays the CTA's `requestingLabel` behind `REQUESTING_LABEL_DELAY_MS`
  // (see that constant's own doc comment) — `disabled` below stays tied
  // directly to `cameraStatus === "requesting"` and is unaffected, so
  // duplicate-click prevention is still immediate; only the label text is
  // deferred. Re-arms independently on every fresh `"requesting"` entry
  // (the initial "Allow Camera" click and every "Try Again" retry alike,
  // since a retry re-enters `"requesting"` the same way — see
  // `handleTryAgain` below), and the timer is cleared the instant
  // `cameraStatus` leaves `"requesting"` for any reason (resolved,
  // rejected, or this component unmounting), so a stale timeout can never
  // flip this back on after the fact.
  const [showRequestingLabel, setShowRequestingLabel] = useState(false)
  useEffect(() => {
    if (cameraStatus !== "requesting") {
      setShowRequestingLabel(false)
      return
    }
    const timerId = window.setTimeout(() => setShowRequestingLabel(true), REQUESTING_LABEL_DELAY_MS)
    return () => window.clearTimeout(timerId)
  }, [cameraStatus])

  // `Try Again`'s one handler, doing whichever retry actually applies to
  // the current `errorKind`:
  // - camera errors (`"denied"`/`"unavailable"`) call the exact same
  //   `requestAccess` the original "Allow Camera" button calls — already
  //   guarded against a duplicate concurrent `getUserMedia` call by
  //   `useCameraStream` itself (its own `requestInFlightRef`/`streamRef`
  //   checks), and against a repeated *automatic* prompt by design (this
  //   is only ever called from a real click). `errorKind` itself isn't
  //   cleared here — the `cameraStatus` effect above clears it once the
  //   retried request actually resolves (to `"granted"`), so the error
  //   copy stays visible (CTA disabled meanwhile, see the `disabled` prop
  //   below) rather than flashing back to the original prompt copy for
  //   the request's duration.
  // - a `"mediapipe"` error instead clears `errorKind` directly, which
  //   flips `isScanning` back to `true` — switching the left visual/CTA
  //   slot from `CameraPermissionVisual` back to a *brand-new*
  //   `ScanningVisual` element (a different component at that tree
  //   position always fully unmounts the old one and mounts a fresh
  //   instance, exactly like the original permission→scanning swap
  //   already relies on), which itself re-runs `useFaceLandmarker`'s setup
  //   from scratch — a real MediaPipe re-init, not a patched-up reuse of
  //   the failed instance. The camera `MediaStream` itself is untouched
  //   either way (still owned in `App.tsx`), so this never re-requests
  //   camera access. Also bumps `scanResetKey` — without this,
  //   `useScanProgress`'s own accumulator (a ref, untouched by
  //   `ScanningVisual` remounting since it lives in *this* component, not
  //   that one) would silently carry over whatever progress had already
  //   accumulated before the failure, so a retried scan could complete
  //   almost immediately instead of genuinely starting over at `0%`.
  const handleTryAgain = useCallback(() => {
    if (errorKind === "mediapipe") {
      setErrorKind(null)
      setScanResetKey((key) => key + 1)
    } else {
      requestAccess()
    }
  }, [errorKind, requestAccess])

  const heading =
    errorKind === "denied"
      ? t.cameraPermission.errorDeniedHeading
      : errorKind === "unavailable"
        ? t.cameraPermission.errorUnavailableHeading
        : errorKind === "mediapipe"
          ? t.cameraPermission.errorMediaPipeHeading
          : t.cameraPermission.heading
  const subtitle =
    errorKind === "denied"
      ? t.cameraPermission.errorDeniedSubtitle
      : errorKind === "unavailable"
        ? t.cameraPermission.errorUnavailableSubtitle
        : errorKind === "mediapipe"
          ? t.cameraPermission.errorMediaPipeSubtitle
          : t.cameraPermission.body
  // `showRequestingLabel` (delayed, see its own effect above) wins over
  // the error-recovery label: a "Try Again" retry still goes through
  // `requestAccess`/`getUserMedia`, so it passes through
  // `cameraStatus === "requesting"` the same as the original "Allow
  // Camera" click does — this CTA's `disabled` prop already covers that
  // window (see below) immediately; the label itself only switches once
  // the delay elapses, so a fast retry keeps showing "Try Again" rather
  // than flashing "Requesting access…" for an instant.
  const ctaLabel =
    showRequestingLabel
      ? t.cameraPermission.requestingLabel
      : errorKind !== null
        ? t.cameraPermission.tryAgainLabel
        : undefined
  const ctaOnClick = errorKind !== null ? handleTryAgain : requestAccess

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-bg-base p-[24px] lg:min-h-[max(100dvh,var(--spacing-frame-h-lg))]">
      <AppBackground />
      <div className="relative flex w-full max-w-[382px] flex-col items-start gap-[64px] rounded-[24px] backdrop-blur-[20px] [@media(max-width:1023px)_and_(max-height:700px)]:gap-[40px] lg:max-w-[1242px] lg:border-[1.5px] lg:border-[rgba(255,255,255,0.12)] lg:bg-[rgba(118,118,118,0.08)] lg:p-[64px]">
        <div className="flex w-full items-center justify-between">
          <MoodPlayerLogo onClick={onLogoClick} />
          <LanguageSwitcher />
        </div>

        <div className="flex w-full flex-col items-center gap-[24px] [@media(max-width:1023px)_and_(max-height:700px)]:gap-[14px] lg:flex-row lg:items-start lg:gap-[54px]">
          <div className={cameraFadeClassName}>
            {isScanning ? (
              <ScanningVisual
                ref={scanningVisualRef}
                stream={stream}
                onValidScanChange={handleValidScanChange}
                onFaceStatusChange={handleFaceStatusChange}
                onBlendshapesChange={recordSample}
              />
            ) : (
              <CameraPermissionVisual />
            )}
          </div>

          <div className="flex w-full flex-col items-start gap-[54px] [@media(max-width:1023px)_and_(max-height:700px)]:gap-[22px] lg:w-[568px]">
            <div className="flex flex-col items-start gap-[36px] [@media(max-width:1023px)_and_(max-height:700px)]:gap-[16px]">
              <div className="flex flex-col items-center gap-[8px] text-center lg:items-start lg:text-left">
                <h1 className="text-[38px] font-medium leading-[1.2] text-white lg:whitespace-nowrap lg:text-[60px]">
                  {heading}
                </h1>
                <p className="w-full font-light leading-[1.4] text-[18px] text-[#f1f1f1] lg:w-[508px]">{subtitle}</p>
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
                <CameraPermissionCta
                  onClick={ctaOnClick}
                  disabled={cameraStatus === "requesting"}
                  label={ctaLabel}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
