import { useLanguage } from "../localization/LanguageContext"

/** Wordmark and tagline pair. Reads the global language preference — Intro
 *  has no switcher of its own, it just renders in whichever language is
 *  currently active. */
export default function TextStack() {
  const { t } = useLanguage()

  return (
    <div className="flex w-full flex-col items-center gap-stack-gap text-center wrap-break-word">
      <h1 className="font-display text-wordmark font-bold text-text-primary lg:text-wordmark-lg">
        {t.common.wordmark}
      </h1>
      <p className="w-tagline-w font-sans text-tagline font-light text-text-secondary lg:w-tagline-w-lg lg:text-tagline-lg">
        {t.intro.tagline}
      </p>
    </div>
  )
}
