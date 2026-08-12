import logoMark from "../imports/CameraPermission/logo-mark.svg"
import { useLanguage } from "../localization/LanguageContext"

/**
 * Small header logo lockup — the audio-bars mark plus "MoodPlayer" wordmark
 * — used on the Mood Detection / Camera Permission screen's header row.
 *
 * Not the same thing as the Intro screen's `TextStack` hero wordmark (140px
 * Desktop / 54px Mobile, centered, no icon, no header row at all): this is
 * a compact top-left lockup that didn't exist anywhere in the codebase
 * before this screen. Sized 24px (Mobile) / 32px (Desktop) per Figma. The
 * icon is decorative — the adjacent text already conveys the brand name —
 * so it gets an empty `alt`, matching how decorative images are already
 * handled elsewhere in this codebase (e.g. `MoodBubble.tsx`).
 */
export default function MoodPlayerLogo() {
  const { t } = useLanguage()

  return (
    <div className="flex shrink-0 items-center gap-[12px]">
      <img src={logoMark} alt="" className="h-[22px] w-[31px] shrink-0" />
      <p className="whitespace-nowrap font-display text-[24px] font-bold leading-[0.9] tracking-[-3px] text-text-primary lg:text-[32px]">
        {t.common.wordmark}
      </p>
    </div>
  )
}
