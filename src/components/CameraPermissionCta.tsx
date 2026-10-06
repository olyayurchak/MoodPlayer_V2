import { copy as t } from "../content/copy"

/**
 * The Camera Permission screen's primary CTA.
 *
 * Visually matches the approved gradient-pill styling using the same design
 * tokens Intro's `CtaPill` uses — fill gradient (`--color-cta-button-from/
 * via/to`, the approved primary-CTA-button colors, shared across every
 * `.cta-pill`), border (`--color-cta-border`), radius (`--radius-pill`),
 * blur (`--blur-cta`), shadow (`--drop-shadow-cta`), padding
 * (`--spacing-cta-x/y`), and typography (`--text-cta`) all reused as-is,
 * all confirmed to match this screen's Figma values exactly.
 *
 * Deliberately its own small component rather than a reuse of `CtaPill`:
 * the two differ structurally (this one has no icon at all) and in sizing
 * (this one is `w-full` on Mobile — Figma's own mobile CTA is 382px, not
 * Intro's narrower 320px `--spacing-cta-w` — while Desktop's 380px happens
 * to match `--spacing-cta-w-lg` exactly, reused directly).
 *
 * Interaction now intentionally matches Intro's approved `CtaPill`, reusing
 * its CSS rather than duplicating it:
 * - The `cta-pill` class is the same behavior-only hook `CtaPill` uses in
 *   `index.css` (`transition`, `:hover`, `:active`, `:focus-visible` — no
 *   sizing/color rules live on it), so adding it here only turns on the
 *   shared interaction rules without touching this button's own Tailwind
 *   utilities (geometry/gradient/etc. are untouched, and `CtaPill` itself is
 *   a separate component/JSX tree — this class is never applied to it).
 * - `:active { transform: scale(0.98) }` and its `110ms ease-out` transition
 *   apply identically on Desktop and Mobile the moment the class is present
 *   — no extra markup needed for the press effect.
 * - The Desktop-only border-shine hover, however, is an SVG stroke-path
 *   animation (`.cta-border-svg` / `.cta-border-svg__track`, both defined in
 *   `index.css`) that needs a matching `<rect>` traced in this button's own
 *   markup — a CSS class alone can't add it, and the trace rect can't be
 *   copied verbatim from `CtaPill`, which is still `320×60`/`380×60`
 *   Mobile/Desktop but has its own two-viewBox split for that reason (its
 *   Mobile width is fixed, this button's is fluid `w-full`). The track
 *   geometry below applies `CtaPill`'s own derivation (viewBox = box size
 *   − 2px, rect = viewBox − 2px margin each side, `rx`/`ry` = half the
 *   rect's height for a true pill trace) to this button's actual `380×60`
 *   Desktop measurement (height now the shared `--spacing-cta-h` token,
 *   see its own comment in `index.css` — both this button and `CtaPill`
 *   render the same height now, unlike before that token existed, when
 *   this button's padding-derived box measured `68px`, six pixels
 *   shorter than `CtaPill`'s icon-stretched `74px`): `viewBox="0 0 378
 *   58"`, `rect 376×56 rx28 ry28`. Same `lg:block` breakpoint `CtaPill`
 *   uses for its Desktop variant. No Mobile track variant is added: this
 *   CTA's Mobile width is fluid (`w-full`, not a fixed size a trace rect
 *   could match), and the hover rule in `index.css` is already gated to
 *   `(hover: hover) and (pointer: fine)` — real touch input never matches
 *   it regardless, so nothing would render there anyway.
 *
 * `relative overflow-hidden` are added alongside the existing utilities so
 * the absolutely-positioned track SVG clips to this pill's own rounded
 * shape, exactly as `CtaPill` does — no other utility here changes.
 *
 * `onClick` is the one and only trigger point wired to `getUserMedia`
 * (via `useCameraStream.requestAccess` in `CameraPermissionScreen`) — the
 * explicit user action Guidelines §8 requires before ever requesting
 * camera access. `disabled` is set while a request is in flight so a
 * second click can't fire a duplicate `getUserMedia` call.
 *
 * `label` overrides the button's own text without touching anything
 * else — dimensions, gradient, border, hover/press/focus treatment all
 * stay exactly as-is regardless of which string is shown. Defaults to
 * `t.cameraPermission.ctaLabel` ("Allow Camera"); `CameraPermissionScreen`
 * passes `t.cameraPermission.tryAgainLabel` ("Try Again") instead while a
 * camera or MediaPipe error state is active, reusing this same component
 * (and its `onClick`, now wired to a retry instead of the initial
 * request) rather than adding a second, near-identical CTA.
 */
export default function CameraPermissionCta({
  onClick,
  disabled,
  label,
}: {
  onClick?: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cta-pill cta-drift relative flex h-cta-h w-full items-center justify-center overflow-hidden rounded-pill border-[1.5px] border-cta-border bg-linear-to-r from-cta-button-from via-cta-button-via to-cta-button-to px-cta-x text-center font-sans text-cta font-medium text-white backdrop-blur-cta drop-shadow-cta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70 lg:w-[380px]"
    >
      {/* Desktop-width track only — see doc comment above for why no Mobile variant exists. */}
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
      <span className="relative z-10">{label ?? t.cameraPermission.ctaLabel}</span>
    </button>
  )
}
