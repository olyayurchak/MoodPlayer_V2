import { useLanguage } from "../localization/LanguageContext"

/**
 * The Camera Permission screen's primary CTA.
 *
 * Visually matches the approved gradient-pill styling using the same design
 * tokens Intro's `CtaPill` uses — colors (`--color-cta-*`), border, radius
 * (`--radius-pill`), blur (`--blur-cta`), shadow (`--drop-shadow-cta`),
 * padding (`--spacing-cta-x/y`), and typography (`--text-cta`) all reused
 * as-is, all confirmed to match this screen's Figma values exactly.
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
 *   copied verbatim from `CtaPill`: this button's measured Desktop box is
 *   380×68px, six pixels shorter than `CtaPill`'s 380×74px (that button's
 *   row is stretched taller by its play icon; this one has no icon, so its
 *   height comes from padding + text alone) — copying `CtaPill`'s 378×72
 *   viewBox onto a 68px-tall box would make the SVG's default
 *   `preserveAspectRatio` fit-scale the trace down to ~357px wide, leaving
 *   visible dead space at both ends instead of hugging the real edges. The
 *   track geometry below instead applies `CtaPill`'s own derivation (viewBox
 *   = box size − 2px, rect = viewBox − 2px margin each side, `rx`/`ry` =
 *   half the rect's height for a true pill trace) to this button's actual
 *   380×68 measurement: `viewBox="0 0 378 66"`, `rect 376×64 rx32 ry32`. Same
 *   `lg:block` breakpoint `CtaPill` uses for its Desktop variant. No Mobile
 *   track variant is added: this CTA's Mobile width is fluid (`w-full`, not
 *   a fixed size a trace rect could match), and the hover rule in
 *   `index.css` is already gated to `(hover: hover) and (pointer: fine)` —
 *   real touch input never matches it regardless, so nothing would render
 *   there anyway.
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
 */
export default function CameraPermissionCta({
  onClick,
  disabled,
}: {
  onClick?: () => void
  disabled?: boolean
}) {
  const { t } = useLanguage()

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cta-pill relative w-full overflow-hidden rounded-pill border-[1.5px] border-cta-border bg-linear-to-r from-cta-from via-cta-via to-cta-to px-cta-x py-cta-y text-center font-sans text-cta font-medium text-white backdrop-blur-cta drop-shadow-cta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70 lg:w-[380px]"
    >
      {/* Desktop-width track only — see doc comment above for why no Mobile variant exists. */}
      <svg
        aria-hidden="true"
        focusable="false"
        className="cta-border-svg pointer-events-none absolute inset-0 hidden lg:block"
        viewBox="0 0 378 66"
      >
        <rect
          className="cta-border-svg__track"
          x={1}
          y={1}
          width={376}
          height={64}
          rx={32}
          ry={32}
          pathLength={100}
        />
      </svg>
      <span className="relative z-10">{t.cameraPermission.ctaLabel}</span>
    </button>
  )
}
