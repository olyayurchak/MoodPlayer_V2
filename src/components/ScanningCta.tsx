import { useLanguage } from "../localization/LanguageContext"

// Matches `--radius-pill` (`index.css`) — the fill's left corners always
// use this, so they read as the CTA's own rounded end rather than a
// smaller capsule's. There's no clean way to read a CSS custom property
// into an inline style's numeric interpolation without extra plumbing
// (`getComputedStyle`), so this is a documented literal kept in sync with
// that token rather than a computed lookup.
const RADIUS_PILL_PX = 200
// The fraction of progress (0–1) at which the fill's right edge starts
// rounding from flat toward `RADIUS_PILL_PX` — below this the right edge
// stays perfectly flat, so the fill reads as "the CTA progressively
// filling" rather than "a smaller pill sliding inside it". Reaches full
// `RADIUS_PILL_PX` exactly at progress === 1, so the fill's own shape
// already matches the completed pill's shape the instant before it's
// replaced by that pill — no shape jump at completion.
const RIGHT_RADIUS_START_PROGRESS = 0.9

type ScanningCtaProps = {
  /** 0–1, accumulated valid scanning time out of the target duration —
   *  see `useScanProgress`. Purely visual/ARIA metadata; never rendered
   *  as on-screen percentage text. */
  progress: number
  /** Once `true`, replaces the "Scanning…" label + dots with the
   *  completed label and stops rendering the fill/dots — a terminal
   *  state for this milestone (no result screen exists yet to move on
   *  to; see `useScanProgress`'s own doc comment). */
  completed: boolean
}

/**
 * The Scanning screen's status pill — replaces `CameraPermissionCta` once
 * camera access is granted. Approved Figma frames: Desktop `284:2523`
 * (380×66), Mobile `289:6900` (382×66) — both read exactly "Scanning...",
 * in a translucent (non-gradient) pill distinct from the CTA-gradient
 * treatment: `backdrop-blur-[20px] bg-[rgba(255,255,255,0.08)]
 * border-[1.5px] border-[rgba(255,255,255,0.12)] rounded-[200px]
 * shadow-[0px_12px_24px_0px_rgba(255,255,255,0.1)]`.
 *
 * A status indicator, not a control — rendered as a `<div
 * role="status">` (not a `<button>`), matching that it triggers no
 * action and needs no focus stop. `aria-live="polite"` announces the
 * scanning state to screen readers once, using `scanningAriaLabel`
 * rather than the visible text — the animated dots have no reason to be
 * read aloud. The completed label, in contrast, *is* rendered as normal
 * (non-`aria-hidden`) text inside that same live region, so it's
 * announced through the existing pattern with no extra aria-only string.
 *
 * The three dots are this task's own explicit addition (a static Figma
 * export can't show animation) — subtle and restrained per the request:
 * a slow, staggered opacity/lift pulse (`.scanning-dot`, `index.css`),
 * fully disabled under `prefers-reduced-motion` in favor of a steady
 * dimmed dot, per Guidelines §11.
 *
 * The progress fill (`progress`) is this pill's own later addition: an
 * absolutely-positioned bar sized to `progress * 100%`. An earlier
 * version relied on DOM order alone (fill first, label/dots after) to
 * keep the label on top, on the assumption that later-painted siblings
 * sit above earlier ones — true for normal in-flow siblings, but *not*
 * for a `position: absolute` element next to `position: static` ones:
 * per CSS's own stacking-context paint order, a positioned descendant
 * with `z-index: auto` paints *after* in-flow static content regardless
 * of DOM order, so the fill was actually painting over the label the
 * whole time. Invisible while the fill was a low-opacity translucent
 * overlay; a real bug once it became a fully opaque gradient. Fixed the
 * same way `CameraPermissionCta` already handles its own absolutely-
 * positioned decorative layer (the hover-trace SVG) next to its label:
 * the label/dots are wrapped in their own `relative z-10` element, an
 * explicit stacking level above the fill's implicit one, rather than
 * relying on DOM order. It reuses the pill's own
 * `rounded-pill` radius rather than a separate progress-bar shape, and
 * the exact same token-based gradient the completed state and the "Allow
 * Camera" button use (`bg-linear-to-r from-cta-button-from via-cta-button-via
 * to-cta-button-to`, full opacity — an earlier version used a low-opacity slice
 * of raw hex colors instead, which read as a dim approximation rather
 * than the actual approved gradient; this reuses that one source of
 * truth verbatim instead). `role="progressbar"` carries the actual
 * numeric value for assistive tech — that's what that attribute is
 * *for* — while nothing numeric is ever rendered as visible text. Its
 * `transition` is dropped under `prefers-reduced-motion` (see
 * `index.css`) so the value still updates, just without an animated
 * sweep — reduced-motion users get the same feedback the fill conveys to
 * everyone else, they just don't get the motion itself, matching how the
 * dots are handled.
 *
 * The completed pill's background/border/shadow reuse
 * `CameraPermissionCta`'s own token-based classes verbatim
 * (`bg-linear-to-r from-cta-button-from via-cta-button-via to-cta-button-to`, `border-cta-border`,
 * `drop-shadow-cta`) - the same source of truth as the "Allow Camera"
 * button, and now identical to the in-progress fill's own gradient above
 * (rather than a different, lower-opacity version of it), so the fill
 * reaching 100% and the completed background taking over are visually
 * the same color with nothing to jump between. Dimensions/radius/
 * typography stay exactly the shared tokens already in use
 * (`rounded-pill`, `px-cta-x`, `text-cta`, `backdrop-blur-cta`)
 * - only the background/border/shadow swap.
 *
 * Height is the shared `h-cta-h` token (`--spacing-cta-h`, `index.css`) —
 * same as every other primary CTA (`CtaPill`, `CameraPermissionCta`,
 * Vibe Result's own CTA) — rather than the `py-cta-y` vertical padding
 * this pill used before that token existed. `flex items-center
 * justify-center` on this outer element centers the inner label/dots row
 * within the new fixed height; the absolutely-positioned progress fill
 * (`inset-y-0`) already stretches to whatever height its container has
 * regardless of how that height is set, so it needs no change.
 */
export default function ScanningCta({ progress, completed }: ScanningCtaProps) {
  const { t } = useLanguage()

  const rightRadiusProgress = Math.min(
    1,
    Math.max(0, (progress - RIGHT_RADIUS_START_PROGRESS) / (1 - RIGHT_RADIUS_START_PROGRESS)),
  )
  const rightRadiusPx = rightRadiusProgress * RADIUS_PILL_PX

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        "relative flex h-cta-h w-full items-center justify-center overflow-hidden rounded-pill border-[1.5px] px-cta-x text-center font-sans text-cta font-medium text-white backdrop-blur-cta lg:w-[380px] " +
        (completed
          ? "border-cta-border bg-linear-to-r from-cta-button-from via-cta-button-via to-cta-button-to drop-shadow-cta"
          : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)] shadow-[0px_12px_24px_0px_rgba(255,255,255,0.1)]")
      }
    >
      {!completed && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label={t.cameraPermission.scanningAriaLabel}
          className="scan-progress-fill absolute inset-y-0 left-0 bg-linear-to-r from-cta-button-from via-cta-button-via to-cta-button-to"
          style={{
            width: `${progress * 100}%`,
            borderTopLeftRadius: RADIUS_PILL_PX,
            borderBottomLeftRadius: RADIUS_PILL_PX,
            borderTopRightRadius: rightRadiusPx,
            borderBottomRightRadius: rightRadiusPx,
          }}
        />
      )}
      {/* Explicit stacking level above the fill's — see the doc comment
          above for why DOM order alone doesn't guarantee this. */}
      <div className="relative z-10 flex items-center justify-center gap-[10px]">
        {completed ? (
          <span>{t.cameraPermission.scanningCompleteLabel}</span>
        ) : (
          <>
            <span aria-hidden="true">{t.cameraPermission.scanningCtaLabel}</span>
            <span className="flex items-end gap-[4px]" aria-hidden="true">
              <span className="scanning-dot size-[6px] rounded-full bg-white" />
              <span className="scanning-dot size-[6px] rounded-full bg-white" />
              <span className="scanning-dot size-[6px] rounded-full bg-white" />
            </span>
            <span className="sr-only">{t.cameraPermission.scanningAriaLabel}</span>
          </>
        )}
      </div>
    </div>
  )
}
