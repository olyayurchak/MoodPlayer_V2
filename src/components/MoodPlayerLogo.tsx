import { useId } from "react"
import logoMark from "../imports/CameraPermission/logo-mark.svg"
import type { PlayerMoodAccent } from "../data/playerMoodAccent"
import { useLanguage } from "../localization/LanguageContext"

/** The five bar paths from `logo-mark.svg` itself — copied verbatim (same
 *  `d` values, same 31×22 viewBox) so the Happy-accent render below is
 *  pixel-identical in shape/size to the plain `<img>` render every other
 *  caller still uses; only which `<linearGradient>` fills them differs.
 *  Exported so `MobileUpNextSheet.tsx`'s own current-track equalizer-style
 *  indicator can reuse this exact shape (the approved Figma expanded Up
 *  Next frame's own current-row indicator is byte-identical in size —
 *  31×22 — to this mark) instead of a second, invented icon. */
export const LOGO_BAR_PATHS = [
  "M0 7.5C0 6.67157 0.671573 6 1.5 6C2.32843 6 3 6.67157 3 7.5V14.5C3 15.3284 2.32843 16 1.5 16C0.671573 16 0 15.3284 0 14.5V7.5Z",
  "M7 1.5C7 0.671573 7.67157 0 8.5 0C9.32843 0 10 0.671573 10 1.5V20.5C10 21.3284 9.32843 22 8.5 22C7.67157 22 7 21.3284 7 20.5V1.5Z",
  "M14 3.5C14 2.67157 14.6716 2 15.5 2C16.3284 2 17 2.67157 17 3.5V18.5C17 19.3284 16.3284 20 15.5 20C14.6716 20 14 19.3284 14 18.5V3.5Z",
  "M21 1.5C21 0.671573 21.6716 0 22.5 0C23.3284 0 24 0.671573 24 1.5V20.5C24 21.3284 23.3284 22 22.5 22C21.6716 22 21 21.3284 21 20.5V1.5Z",
  "M28 7.5C28 6.67157 28.6716 6 29.5 6C30.3284 6 31 6.67157 31 7.5V14.5C31 15.3284 30.3284 16 29.5 16C28.6716 16 28 15.3284 28 14.5V7.5Z",
]

/**
 * Small header logo lockup — the audio-bars mark plus "MoodPlayer" wordmark
 * — used on the Mood Detection / Camera Permission screen's header row, and
 * on Vibe Result's own header row.
 *
 * Not the same thing as the Intro screen's `TextStack` hero wordmark (140px
 * Desktop / 54px Mobile, centered, no icon, no header row at all): this is
 * a compact top-left lockup that didn't exist anywhere in the codebase
 * before this screen. Sized 24px (Mobile) / 32px (Desktop) per Figma. The
 * icon is decorative — the adjacent text already conveys the brand name —
 * so it gets an empty `alt`, matching how decorative images are already
 * handled elsewhere in this codebase (e.g. `MoodBubble.tsx`).
 *
 * `logoMark` (`logo-mark.svg`) is the one shared icon asset every caller
 * renders — it now carries the approved brand gradient
 * (`#A64CA6 → #7458B8 → #5576D8`) directly, so every screen using this
 * component gets it automatically. An earlier, Camera-Permission-only
 * recolor briefly routed through an optional `iconSrc` prop (defaulting
 * to this same asset) plus a separate `logo-mark-brand.svg`, while only
 * that one screen had approved the new gradient; now that every caller
 * wants it, that per-screen override was removed as redundant rather
 * than left in place unused.
 *
 * `onClick` is optional (each caller wires it to its own "navigate to
 * Intro/Home" callback — see `App.tsx`'s `handleLogoClick` and each
 * screen's own `onLogoClick` prop): when provided, the whole lockup
 * renders as a real `<button>` (keyboard-reachable, a real click/Enter/
 * Space target) instead of a plain `<div>`, reset to look identical to
 * the original non-interactive markup (no default button border/
 * background/padding), with a `focus-visible` ring matching this app's
 * existing interactive-element convention (`CtaPill`,
 * `LanguageSwitcher`). The icon stays `alt=""` either way — decorative,
 * exactly as before — but the button itself gets an explicit
 * `aria-label` (`common.logoHomeAriaLabel`) rather than relying on the
 * visible wordmark text alone, since that text alone would announce the
 * brand name ("MoodPlayer"), not the action activating it performs.
 * Omitting `onClick` renders the original inert lockup, unchanged.
 *
 * A measured audit found the clickable button's real hit area was only
 * ~151×22px — its own box hugs the 22px-tall icon/text exactly, with no
 * padding at all (`p-0`), well under the ~44px iOS ergonomic baseline on
 * the height axis (width was already fine, so it's untouched here). Fixed
 * with the same invisible `before:` pseudo-element technique
 * `LanguageSwitcher.tsx` already uses: `-top-[12px] -bottom-[12px]` grows
 * the *clickable* area by 12px on each side (22px + 24px = 46px, clearing
 * 44px) without adding any real padding to the button itself — an
 * absolutely-positioned pseudo-element never affects its own parent's
 * flex sizing, so the header row it sits in (`justify-between` against
 * `LanguageSwitcher` on every current caller) keeps its exact height/
 * alignment, and the visible icon+wordmark don't shift at all. Left/right
 * stay at `before:left-0`/`before:right-0` (no horizontal growth) — a
 * live measurement found ~101px of clearance to `LanguageSwitcher` at the
 * narrowest supported Mobile width, so horizontal growth was never needed
 * to hit the ergonomic target and would only add unnecessary risk.
 *
 * `accent` (`data/playerMoodAccent.ts`, `undefined` for any mood without
 * its own approved override yet — only `PlayerScreen` ever passes this)
 * recolors just the icon mark, from the universal Mood Gradient baked
 * into `logo-mark.svg` to that mood's own `gradientFrom`/`gradientTo` —
 * the same two-stop gradient `PlayerWaveform`'s played bars and the
 * volume slider's filled track already reuse. Since the gradient is baked
 * into the shared SVG asset itself (every other caller of this component
 * needs the universal one, unrecolored), swapping it can't be a CSS
 * color override on an `<img>`.
 *
 * A first attempt tried a CSS `mask-image` pointing at the same `<img>`
 * asset (painting a gradient `<span>`, clipped to the SVG's shape) — the
 * same masked-gradient *technique* already used elsewhere in this
 * codebase (e.g. the selected mood pill's ring), but applied to an
 * *external* SVG resource rather than a same-document overlay. In
 * practice that rendered as a solid rectangular block, not the five-bar
 * shape — `mask-image: url(...)` on an external SVG resource depends on
 * the browser correctly deriving an alpha/luminance mask from a fetched
 * external document, which proved unreliable here. This renders the
 * mark as a real inline `<svg>` instead — the exact same five `d` path
 * values and 31×22 viewBox as `logo-mark.svg` itself (`LOGO_BAR_PATHS`
 * above), so shape/size are byte-identical to the plain `<img>` render —
 * with only its own `<linearGradient>` stops swapped to `accent`'s
 * `gradientFrom`/`gradientTo` when present, same geometry
 * (`x1=-1.5 y1=9 x2=36 y2=8`, `gradientUnits="userSpaceOnUse"`) as the
 * original asset's own gradient. `useId()` keys the gradient so two
 * simultaneously-mounted instances (this screen's own Mobile/Desktop
 * trees) never collide on the same `id`. The wordmark text itself is
 * untouched either way — Figma shows no Happy-specific change to it.
 */
export default function MoodPlayerLogo({
  onClick,
  accent,
}: {
  onClick?: () => void
  accent?: PlayerMoodAccent
}) {
  const { t } = useLanguage()
  const gradientId = useId()

  const icon = accent ? (
    <svg
      aria-hidden="true"
      width="31"
      height="22"
      viewBox="0 0 31 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-[22px] w-[31px] shrink-0"
    >
      {LOGO_BAR_PATHS.map((d) => (
        <path key={d} d={d} fill={`url(#${gradientId})`} />
      ))}
      <defs>
        <linearGradient id={gradientId} x1="-1.5" y1="9" x2="36" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor={accent.gradientFrom} />
          <stop offset="1" stopColor={accent.gradientTo} />
        </linearGradient>
      </defs>
    </svg>
  ) : (
    <img src={logoMark} alt="" className="h-[22px] w-[31px] shrink-0" />
  )

  const content = (
    <>
      {icon}
      {/* Mobile-only tracking loosened (-3px -> -1px) so the letters don't read as touching at 24px; Desktop's -3px is unchanged. */}
      <p className="whitespace-nowrap font-display text-[24px] font-bold leading-[0.9] tracking-[-1px] text-text-primary lg:text-[32px] lg:tracking-[-3px]">
        {t.common.wordmark}
      </p>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={t.common.logoHomeAriaLabel}
        className="relative flex shrink-0 items-center gap-[12px] border-0 bg-transparent p-0 text-left before:absolute before:-top-[12px] before:-bottom-[12px] before:left-0 before:right-0 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {content}
      </button>
    )
  }

  return <div className="flex shrink-0 items-center gap-[12px]">{content}</div>
}
