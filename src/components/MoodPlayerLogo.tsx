import logoMark from "../imports/CameraPermission/logo-mark.svg"
import { useLanguage } from "../localization/LanguageContext"

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
 */
export default function MoodPlayerLogo({ onClick }: { onClick?: () => void }) {
  const { t } = useLanguage()

  const content = (
    <>
      <img src={logoMark} alt="" className="h-[22px] w-[31px] shrink-0" />
      <p className="whitespace-nowrap font-display text-[24px] font-bold leading-[0.9] tracking-[-3px] text-text-primary lg:text-[32px]">
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
        className="flex shrink-0 items-center gap-[12px] border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {content}
      </button>
    )
  }

  return <div className="flex shrink-0 items-center gap-[12px]">{content}</div>
}
