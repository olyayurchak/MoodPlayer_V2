import { useEffect, useState } from "react"
import AppBackground from "../components/AppBackground"
import MoodPlayerLogo from "../components/MoodPlayerLogo"
import LanguageSwitcher from "../components/LanguageSwitcher"
import { gradientBorderStyle } from "../components/CameraPermissionVisual"
import { useLanguage } from "../localization/LanguageContext"
import { MOOD_IDS, type MoodId } from "../data/moods"
import portraitDesktop from "../imports/VibeResult/portrait-desktop.png"
import portraitMobile from "../imports/VibeResult/portrait-mobile.png"
import reloadDesktop from "../imports/VibeResult/reload-desktop.png"
import reloadMobile from "../imports/VibeResult/reload-mobile.png"

/** The selected mood pill's gradient border.
 *
 *  Two earlier attempts at this both actually painted the gradient
 *  *behind* the pill's translucent interior rather than beside it, so it
 *  showed through:
 *  - a `background-clip: padding-box, border-box` two-layer trick, whose
 *    single `background-origin` value doesn't reliably pair per-layer with
 *    a two-value `background-clip` list;
 *  - an outer-gradient-button + inset-translucent-child structure, where
 *    the child's own `backdrop-blur(20px)` sampled the *outer button's own
 *    gradient* sitting directly behind it (its nearest painted layer) and
 *    smeared that gradient color across the whole interior before the 8%
 *    white tint composited on top — invisible to `getComputedStyle`
 *    (which only reports declared properties, not rendered pixels) but
 *    very visible on screen.
 *
 *  This version avoids both: the pill itself is byte-for-byte the same
 *  `bg-[rgba(255,255,255,0.08)]` + `backdrop-blur-[20px]` treatment as an
 *  inactive pill (`border-[1.5px] border-transparent` reserves the same
 *  1.5px the inactive pills' visible border does, so dimensions match) —
 *  its `backdrop-blur` therefore samples the real app background behind
 *  it, exactly like an inactive pill, never a gradient. The gradient
 *  itself lives on a separate absolutely-positioned overlay `<span>`
 *  layered on top (`aria-hidden`, `pointer-events-none`, painted after the
 *  label so it doesn't intercept clicks or block the text), masked with
 *  the standard `mask-composite: exclude` two-layer technique — one mask
 *  layer covering the full box, one covering only its `content-box` (i.e.
 *  inset by this style's own `padding`) — so only the ring between them,
 *  exactly `padding`-wide, is left visible. That overlay has no
 *  `backdrop-filter` of its own, so there is nothing left to smear.
 *
 *  Direction fixed against the Figma frame (`284:2584`, pill node
 *  `284:2653`, itself named "cta-pill" in Figma): the design-context
 *  export reports this border as a flat `#8b3cb5` (Figma's tooling has no
 *  "gradient border" output primitive, so it just samples one point — the
 *  same known lossy simplification `CameraPermissionVisual.tsx` documents
 *  for its own gradient border), so direction can't be read from that
 *  export and has to come from the rendered pixels instead. Sampling the
 *  exported PNG's actual border pixels (correlating each one's position
 *  against its R/B channel) showed a strong horizontal trend — pink-heavy
 *  on the left fading to blue-heavy on the right (x↔red correlation ≈
 *  -0.76) — and only a weak vertical one (y↔red ≈ -0.22), i.e. this
 *  border runs left-to-right, not top-to-bottom. That also matches this
 *  node's own Figma layer name, "cta-pill", the same name/gradient
 *  direction as the actual CTA button below it (`bg-linear-to-r
 *  from-cta-from via-cta-via to-cta-to`) — unlike the *vertical*
 *  `BORDER_GRADIENT` `CameraPermissionVisual.tsx` exports for the
 *  unrelated Camera/Scanning panels, which this pill was previously (and
 *  incorrectly) reusing verbatim. Reuses the same three existing
 *  `--color-cta-from/via/to` tokens either way — only the angle changes. */
const SELECTED_MOOD_PILL_RING_STYLE = {
  padding: "1.5px",
  background: "linear-gradient(90deg, var(--color-cta-from), var(--color-cta-via), var(--color-cta-to))",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude" as const,
}

type VibeResultScreenProps = {
  /** The mood the scan-completion flow is handing off (see `App.tsx`).
   *  Real mood classification doesn't exist yet — see `App.tsx`'s own doc
   *  comment on where this value currently comes from — this component
   *  itself makes no assumption about that; it only ever displays
   *  whichever `MoodId` it's given and lets the user override it locally
   *  via the manual selector below. */
  suggestedMood: MoodId
  /** The one still frame captured the instant scanning completed (see
   *  `ScanningVisual.captureFrame` / `CameraPermissionScreen`) — a plain
   *  in-memory JPEG data URL, or `null` if none was available at that
   *  instant (e.g. the stream hadn't produced a frame yet). `null` falls
   *  back to the decorative Figma placeholder photo below rather than
   *  blocking the screen — see this component's own doc comment. */
  capturedFrame: string | null
  /** "Scan again" — returns to the scanning flow. Optional so this
   *  component still renders sensibly (the button just does nothing) if
   *  no caller wires it up, but `App.tsx` always does. */
  onScanAgain?: () => void
  /** "Start listening" (the CTA's copy is now standardized across every
   *  mood — see `translations.ts`'s `vibeResult.ctaLabel`) — intentionally
   *  has no real implementation
   *  anywhere in this codebase yet (Guidelines: no playlist/audio-
   *  playback logic in this milestone). Left as an optional hook so a
   *  future task can wire real playback without touching this component
   *  again, rather than this button doing nothing with no extension
   *  point at all. */
  onStartPlaylist?: (mood: MoodId) => void
}

/**
 * The Vibe Result screen — reached automatically the instant scanning's
 * existing completed ("Vibe found") state is reached, with no click/tap
 * in between (see `App.tsx` for the transition trigger). Approved Figma
 * frames: Desktop `284:2584`, Mobile `289:6988` — both showing only a
 * "chill" example; see `translations.ts`'s `vibeResult` doc comment for
 * exactly which copy is Figma-approved verbatim versus a placeholder.
 *
 * One responsive tree (`lg:` variants throughout) for everything except
 * the photo panel, matching `CameraPermissionScreen`'s own approach — the
 * photo panel itself uses the separate-Mobile/Desktop-tree pattern
 * `ScanningVisual`/`CameraPermissionVisual` use for their camera panel,
 * for the same reason theirs do: its frame styling (`gradientBorderStyle`,
 * corner marks) is now shared with those panels verbatim, and that
 * styling is itself per-breakpoint in a way that doesn't reduce to a
 * single `lg:`-varianted element (see the photo panel's own doc comment
 * below for exactly why). The rest of this screen's layout is ordinary
 * flex/gap that does reduce cleanly, so it stays one tree.
 *
 * The left panel shows `capturedFrame` — the one still frame
 * `ScanningVisual` captured from its detection `<video>` element the
 * instant scanning completed (see `App.tsx`/`CameraPermissionScreen`) —
 * when one is available, falling back to the same static decorative
 * Figma asset this screen originally shipped with when it isn't (e.g. the
 * stream hadn't produced a frame yet at that exact instant). Either way
 * this screen itself never touches `getUserMedia` or any camera stream
 * directly — it only ever receives an already-captured, already-static
 * value as a prop. `capturedFrame` is a plain in-memory data URL: never
 * written to `localStorage`/`sessionStorage`/IndexedDB, never uploaded,
 * held only in `App.tsx`'s React state for as long as this screen stays
 * mounted, and explicitly cleared there when "Scan again" is pressed (see
 * `App.tsx`'s own doc comment on `capturedFrame`). `App.tsx`'s existing
 * screen-swap already stops the camera when `CameraPermissionScreen`
 * unmounts to reach this screen — nothing here needs to do anything extra
 * for that, and this screen never keeps a live video feed running either
 * way, only the one already-frozen image.
 *
 * The circular mood badge that used to sit immediately before the large
 * mood name has been removed for all three moods per this task's request
 * (no replacement icon/decoration) — the mood name now sits directly under
 * `vibeResult.heading`, left-aligned with it and with the description text
 * below on both breakpoints, instead of in its own icon+name row.
 *
 * Manual mood selection (`selectedMood`) is local UI state, not mood
 * classification — clicking a pill just changes which of the three
 * already-known moods' copy/highlight is shown, the same three fixed
 * options every time. Re-syncs to `suggestedMood` if that prop itself
 * changes while mounted (it doesn't in the current flow, since this
 * screen is freshly mounted each time `App.tsx` navigates to it, but this
 * keeps the component correct as a standalone unit regardless).
 */
export default function VibeResultScreen({
  suggestedMood,
  capturedFrame,
  onScanAgain,
  onStartPlaylist,
}: VibeResultScreenProps) {
  const { t } = useLanguage()
  const [selectedMood, setSelectedMood] = useState<MoodId>(suggestedMood)

  useEffect(() => {
    setSelectedMood(suggestedMood)
  }, [suggestedMood])

  const activeMood = t.vibeResult.moods[selectedMood]

  return (
    <main className="relative flex min-h-[max(100dvh,var(--spacing-frame-h))] items-center justify-center overflow-hidden bg-bg-base p-[24px] lg:min-h-[max(100dvh,var(--spacing-frame-h-lg))]">
      <AppBackground />
      <div className="relative flex w-full max-w-[382px] flex-col items-start gap-[64px] rounded-[24px] backdrop-blur-[20px] lg:max-w-[1242px] lg:border-[1.5px] lg:border-[rgba(255,255,255,0.12)] lg:bg-[rgba(118,118,118,0.08)] lg:p-[64px]">
        <div className="flex w-full items-center justify-between">
          <MoodPlayerLogo />
          <LanguageSwitcher />
        </div>

        <div className="flex w-full flex-col items-center gap-[24px] lg:flex-row lg:items-start lg:gap-[54px]">
          {/* Photo panel — the captured still frame when one exists,
              otherwise the same static Figma decorative asset this panel
              always used (see doc comment above); either way the *frame*
              around it (border/radius/corner marks) is identical, only the
              image content inside changes.

              Split into Mobile/Desktop trees (matching `ScanningVisual`'s
              own approach, not this screen's usual single responsive
              tree) specifically because `gradientBorderStyle` bakes its
              border-width into an inline `style`, which — unlike a
              Tailwind class — can't take an `lg:` variant; the Camera/
              Scanning screens themselves use a genuinely different width
              per breakpoint (`1px` Mobile / `2px` Desktop), so
              reproducing that correctly needs two elements, not one.
              `gradientBorderStyle` itself is reused verbatim from
              `CameraPermissionVisual.tsx` (already exported specifically
              for this — `ScanningVisual` uses it the same way), plus the
              same 4 corner accent marks — rather than the plain solid
              `#c43a86` border and no corner marks this panel originally
              had. Figma's own export for this specific frame used that
              flat border; this now intentionally matches the Camera/
              Scanning screens' frame instead, per this task's own request
              for cross-screen consistency. Corner-mark thickness/opacity
              (3px/100% Desktop, 1.2px/100% Mobile) matches
              `ScanningVisual`'s own *active-scanning* state specifically
              (not `CameraPermissionVisual`'s dimmer 40% pre-permission
              treatment) — this panel shows a completed capture, not an
              inactive placeholder. Radius corrected to `11px`/`24px` (was
              `16px`/`24px`) to match exactly.

              The one Camera/Scanning frame element intentionally not
              reproduced here: the soft glow blobs behind the panel —
              those are separate per-screen decorative SVG exports
              (`ellipse23/24/25-*`, imported in `CameraPermissionVisual.tsx`),
              and adding them would mean importing three more Figma assets
              this screen doesn't otherwise use, beyond a border/frame-
              only styling fix. */}
          <div
            className="relative size-[224px] shrink-0 overflow-hidden rounded-[11px] lg:hidden"
            style={gradientBorderStyle("1px")}
          >
            <img
              src={capturedFrame ?? portraitMobile}
              alt=""
              className="absolute inset-0 size-full object-cover pointer-events-none"
            />
            <div className="absolute left-[19.31px] top-[19.31px] size-[45.66px] border-t-[1.2px] border-l-[1.2px] border-white/100" />
            <div className="absolute left-[157.65px] top-[19.31px] size-[45.66px] border-t-[1.2px] border-r-[1.2px] border-white/100" />
            <div className="absolute left-[19.31px] top-[157.65px] size-[45.66px] border-b-[1.2px] border-l-[1.2px] border-white/100" />
            <div className="absolute left-[157.65px] top-[157.65px] size-[45.66px] border-b-[1.2px] border-r-[1.2px] border-white/100" />
            <button
              type="button"
              onClick={onScanAgain}
              className="absolute inset-x-0 bottom-0 flex h-[44px] items-center justify-center gap-[8px] bg-[rgba(255,255,255,0.08)] px-[32px] py-[12px] text-[14px] font-medium text-white backdrop-blur-[20px] shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <img src={reloadMobile} alt="" className="size-[20px] shrink-0 object-cover" />
              <span>{t.vibeResult.scanAgainLabel}</span>
            </button>
          </div>
          <div
            className="relative hidden size-[492px] shrink-0 overflow-hidden rounded-[24px] lg:block"
            style={gradientBorderStyle("2px")}
          >
            <img
              src={capturedFrame ?? portraitDesktop}
              alt=""
              className="absolute inset-0 size-full object-cover pointer-events-none"
            />
            <div className="absolute left-[42.5px] top-[43.5px] size-[100px] border-t-[3px] border-l-[3px] border-white/100" />
            <div className="absolute left-[345.5px] top-[43.5px] size-[100px] border-t-[3px] border-r-[3px] border-white/100" />
            <div className="absolute left-[42.5px] top-[346.5px] size-[100px] border-b-[3px] border-l-[3px] border-white/100" />
            <div className="absolute left-[345.5px] top-[346.5px] size-[100px] border-b-[3px] border-r-[3px] border-white/100" />
            <button
              type="button"
              onClick={onScanAgain}
              className="absolute inset-x-0 bottom-0 flex h-[72px] items-center justify-center gap-[8px] bg-[rgba(255,255,255,0.08)] px-[32px] py-[12px] text-[16px] font-medium text-white backdrop-blur-[20px] shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <img src={reloadDesktop} alt="" className="size-[24px] shrink-0 object-cover" />
              <span>{t.vibeResult.scanAgainLabel}</span>
            </button>
          </div>

          <div className="flex w-full flex-col items-center gap-[24px] lg:w-[568px] lg:items-start">
            <div className="flex w-full flex-col items-center gap-[54px] lg:items-start">
              <div className="flex w-full flex-col items-center gap-[24px] lg:items-start">
                <div className="flex flex-col items-center gap-[20px] lg:items-start">
                  <p className="text-center text-[24px] font-medium leading-[1.4] text-[#f1f1f1] lg:text-left lg:text-[28px]">
                    {t.vibeResult.heading}
                  </p>
                  {/* Gradient text treatment per Figma node `284:2640` — its
                      own design-context export reports an actual 2-stop
                      `bg-gradient-to-r from-[#c23a86] to-[#5e62c6]`
                      text-fill (unlike a gradient *border*, a gradient
                      *fill* has a real Figma→code output primitive, so this
                      one isn't a lossy single-color simplification like the
                      mood-pill border was). Those two stops are the same
                      (±1-2 rounding) as this project's existing
                      `--color-cta-from`/`--color-cta-to` tokens, reused
                      here verbatim via `from-cta-from to-cta-to` — but
                      deliberately *without* the middle `via-cta-via` stop
                      the CTA button/pill border use elsewhere: Figma's own
                      export for this specific node has only two stops, and
                      adding a third would visibly shift this large (60px)
                      heading's color curve away from that reference.
                      Direction is `bg-gradient-to-r` (left-to-right) in
                      Figma's export, i.e. this project's `bg-linear-to-r`. */}
                  <p className="bg-linear-to-r from-cta-from to-cta-to bg-clip-text text-center text-[36px] font-medium leading-[1.2] text-transparent lg:text-left lg:text-[60px]">
                    {activeMood.name}
                  </p>
                </div>
                <p className="w-full text-center text-[18px] font-light leading-[1.4] text-[#f1f1f1] lg:w-[382px] lg:text-left">
                  {activeMood.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onStartPlaylist?.(selectedMood)}
                className="cta-pill relative w-full overflow-hidden rounded-pill border-[1.5px] border-cta-border bg-linear-to-r from-cta-from via-cta-via to-cta-to px-cta-x py-cta-y text-center font-sans text-cta font-medium text-white backdrop-blur-cta drop-shadow-cta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:w-[400px]"
              >
                {/* The exact same approved shine/streak treatment as
                    `CtaPill` (Intro) and `CameraPermissionCta` — reused
                    verbatim via the shared `.cta-pill`/`.cta-border-svg`/
                    `.cta-border-svg__track` CSS in `index.css`, not
                    recreated. This button's Desktop box was originally
                    380×68 (identical to `CameraPermissionCta`'s, track
                    geometry reused unchanged) — widened to 400×68 (+20px)
                    so the Ukrainian mood-selector row below (same fixed
                    width, see its own doc comment) fits "Радість" /
                    "Меланхолія" / "Чіл" on one line without wrapping or
                    shrinking the pills, keeping this CTA visually aligned
                    with that wider row rather than one narrower than the
                    thing below it. Height (68) is unchanged — only
                    `width`/`viewBox`/`rect width` scale with it below, per
                    the same `viewBox = (W-2, H-2)` / `rect = inset-1,
                    (W-4)×(H-4)` relationship the original 380×68 already
                    used (confirmed by inspection: 378×66 / 376×64).
                    No Mobile track variant, for the same reason
                    `CameraPermissionCta` has none: this button is `w-full`
                    (fluid) on Mobile, not a fixed size a trace rect could
                    match — Mobile itself is unaffected by this change. */}
                <svg
                  aria-hidden="true"
                  focusable="false"
                  className="cta-border-svg pointer-events-none absolute inset-0 hidden lg:block"
                  viewBox="0 0 398 66"
                >
                  <rect
                    className="cta-border-svg__track"
                    x={1}
                    y={1}
                    width={396}
                    height={64}
                    rx={32}
                    ry={32}
                    pathLength={100}
                  />
                </svg>
                <span className="relative z-10">{t.vibeResult.ctaLabel}</span>
              </button>
            </div>

            {/* This divider + mood-pill row was `lg:w-[380px]` (matching the
                CTA above it) until the Ukrainian mood names ("Радість" /
                "Меланхолія" / "Чіл") measured ~390px across at their
                existing padding/font size — 10px over that width, forcing
                "Чіл" onto a second row. Widened to `lg:w-[400px]` (the
                CTA above was widened to match, see its own doc comment)
                rather than shrinking the pills' padding/font, per this
                task's explicit preference. English mood names are shorter
                and already fit `380px` on one row; `400px` still fits them
                on one row too, so this is a safe increase for English as
                well as Ukrainian. Mobile is unaffected — this `lg:`-only
                width doesn't apply below that breakpoint, and Mobile's row
                already wraps by design regardless of width (see the pill
                container's own `flex-wrap` below, unchanged). */}
            <div className="flex w-full flex-col items-center gap-[16px] border-t border-[rgba(241,241,241,0.2)] pt-[16px] lg:w-[400px] lg:items-start">
              <p className="w-full text-center text-[16px] font-light leading-[1.4] text-[#f1f1f1] lg:text-left">
                {t.vibeResult.manualChooseLabel}
              </p>
              <div className="flex w-full flex-wrap items-center justify-center gap-[12px] lg:justify-start">
                {MOOD_IDS.map((moodId) => {
                  const isSelected = moodId === selectedMood
                  const label = t.vibeResult.moods[moodId].name

                  if (isSelected) {
                    return (
                      <button
                        key={moodId}
                        type="button"
                        onClick={() => setSelectedMood(moodId)}
                        aria-pressed="true"
                        className="relative shrink-0 rounded-pill border-[1.5px] border-transparent bg-[rgba(255,255,255,0.08)] px-[24px] py-[12px] text-[16px] font-medium text-white backdrop-blur-[20px] shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        {label}
                        <span
                          aria-hidden="true"
                          style={SELECTED_MOOD_PILL_RING_STYLE}
                          className="pointer-events-none absolute inset-0 rounded-pill"
                        />
                      </button>
                    )
                  }

                  return (
                    <button
                      key={moodId}
                      type="button"
                      onClick={() => setSelectedMood(moodId)}
                      aria-pressed="false"
                      className="shrink-0 rounded-pill border-[1.5px] border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)] px-[24px] py-[12px] text-[16px] font-medium text-white backdrop-blur-[20px] shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
