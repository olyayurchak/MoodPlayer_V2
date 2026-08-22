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
      {/* `whitespace-pre-line` only makes a difference for translations that
          actually contain a literal `\n` — both taglines now do (see each
          one's own comment in `translations.ts`), each forcing its line
          break between its two sentences instead of leaving the browser to
          wrap wherever it likes inside this fixed-width column. */}
      <p className="w-tagline-w whitespace-pre-line font-sans text-tagline font-light text-text-secondary lg:w-tagline-w-lg lg:text-tagline-lg">
        {t.intro.tagline}
      </p>
    </div>
  )
}
