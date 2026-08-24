import PlayIconGlow from "./PlayIconGlow"
import { useLanguage } from "../localization/LanguageContext"

/**
 * The primary Intro call to action.
 *
 * A semantic button. `onClick` is optional and forwarded as-is to the native
 * `button` — this component still owns none of the navigation logic itself
 * (that lives in `App.tsx`), it just reports clicks. The `focus-visible`
 * ring is an accessibility addition; the static frames define only the
 * default state.
 *
 * A restrained Desktop-only hover animation (see `index.css`) lives entirely
 * on the border, pure CSS so pointer-leave/blur cleanly restore the idle
 * appearance with no JS state involved:
 *
 * `.cta-border-svg` / `.cta-border-svg__track` — a true SVG stroke-path
 * animation, not a gradient trick: a rounded-rect `<rect>` traced with
 * `pathLength={100}` so the `stroke-dasharray` / `stroke-dashoffset` numbers
 * in `index.css` are identical regardless of the button's actual pixel
 * width. `:hover` (fine pointer only) animates `stroke-dashoffset` across
 * one full lap of that normalized length, so the highlight travels at
 * constant speed through the straight sides AND the rounded ends alike — no
 * angular distortion or dead zones, unlike a conic-gradient wedge rotating
 * inside a non-square box. Two `<svg>` variants below, switched at the same
 * `lg` breakpoint as the rest of the layout, keep the traced rect's
 * `rx`/`ry`/dimensions matched to the button's real size at each width —
 * `pathLength` keeps the animation values shared between them. Fully
 * decorative: `aria-hidden` + `focusable="false"`. A CSS animation only
 * (re)starts when its selector freshly matches, so leaving and re-entering
 * the button replays it with no JS. Keyboard focus and
 * `prefers-reduced-motion` get a static brighter border instead (see
 * `.cta-pill:focus-visible` in `index.css`) — no moving stroke, per the
 * accessibility requirement that neither may depend on motion.
 *
 * `.cta-icon` is just a layout wrapper (`display: inline-flex`) around the
 * play icon — no hover animation. The icon stays completely static; only
 * the border moves.
 *
 * Touch devices never trigger any of it — `index.css` gates the hover rules
 * to `(hover: hover) and (pointer: fine)`.
 *
 * `:active` press feedback (`.cta-pill:active` in `index.css`) — a subtle
 * `scale(0.98)` on mouse-down/touch-press, eased back to `scale(1)` on
 * release — runs identically on Desktop and Mobile, since it's driven by
 * real press/touch rather than the hover-only gate above.
 *
 * The fill gradient (`#A64CA6 → #7458B8 → #5576D8`, left to right, same
 * direction the previous pink-dominant one used) reads the shared
 * `--color-cta-button-from/via/to` tokens (`index.css`) — this button's
 * own first, later widened to every primary CTA using this same
 * `.cta-pill` treatment (`CameraPermissionCta`, `ScanningCta`,
 * `VibeResultScreen`'s CTA), and since then to every other gradient
 * element in the app too (the large visual panels' border, the selected
 * mood pill's ring, the Vibe Result mood-name heading) — a separate,
 * pink-dominant `--color-cta-from/via/to` trio held those non-button
 * consumers' colors while only this button-style treatment had approved
 * the new palette; once every consumer converged on the same colors, that
 * older trio was retired as redundant. This button's own
 * `border-cta-border`/`drop-shadow-cta` are untouched either way.
 */
export default function CtaPill({ onClick }: { onClick?: () => void }) {
  const { t } = useLanguage()

  return (
    <button
      type="button"
      onClick={onClick}
      className="cta-pill relative flex h-cta-h w-cta-w items-center justify-center overflow-hidden rounded-pill border-[1.5px] border-cta-border bg-linear-to-r from-cta-button-from via-cta-button-via to-cta-button-to px-cta-x font-sans text-cta font-medium text-white backdrop-blur-cta drop-shadow-cta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:w-cta-w-lg"
    >
      {/* Mobile-width track (320×60 button — height now the shared
          `--spacing-cta-h` token, see its own comment in `index.css`;
          was 320×74 when height came from padding + this button's own
          play-icon-stretched line box). ~1px border inset both sides. */}
      <svg
        aria-hidden="true"
        focusable="false"
        className="cta-border-svg pointer-events-none absolute inset-0 lg:hidden"
        viewBox="0 0 318 58"
      >
        <rect
          className="cta-border-svg__track"
          x={1}
          y={1}
          width={316}
          height={56}
          rx={28}
          ry={28}
          pathLength={100}
        />
      </svg>
      {/* Desktop-width track (380×60 button, same height-token change as
          the Mobile track above; was 380×74). ~1px border inset both
          sides. */}
      <svg
        aria-hidden="true"
        focusable="false"
        className="cta-border-svg pointer-events-none absolute inset-0 hidden lg:block"
        viewBox="0 0 378 58"
      >
        <rect
          className="cta-border-svg__track"
          x={1}
          y={1}
          width={376}
          height={56}
          rx={28}
          ry={28}
          pathLength={100}
        />
      </svg>
      <span className="relative z-10 flex items-center gap-cta-gap">
        <span className="whitespace-nowrap wrap-break-word">
          {t.intro.ctaLabel}
        </span>
        <span className="cta-icon">
          <PlayIconGlow />
        </span>
      </span>
    </button>
  )
}
