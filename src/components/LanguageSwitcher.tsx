import { useLanguage } from "../localization/LanguageContext"

/**
 * EN / UA language toggle for the Camera Permission screen's header.
 *
 * Reads/writes the shared global `LanguageContext` (`../localization/
 * LanguageContext.tsx`) rather than owning local state — switching here now
 * actually retranslates every currently-implemented screen, persists the
 * choice, and updates `document.documentElement.lang`, all via the one
 * `setLanguage` call below. Markup and accessibility structure are
 * unchanged from the original visual-only version.
 *
 * The visible labels stay the literal strings "EN" / "UA" in both languages
 * — they're the language *names*, not translated UI copy — but the
 * internal code passed to `setLanguage` for the second button is `"uk"`,
 * never `"ua"`: `"ua"` is only ever a display label, the app's `Language`
 * type only ever has `"en" | "uk"`.
 */
export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  const baseClass =
    "px-[6px] pb-[4px] font-sans text-[16px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
  const activeClass = "border-b-[1.5px] border-white text-text-primary"
  const inactiveClass = "border-b-[1.5px] border-transparent text-[rgba(255,255,255,0.6)]"

  return (
    <div
      role="group"
      aria-label={t.languageSwitcher.ariaLabel}
      className="flex shrink-0 items-center gap-[4px]"
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        className={`${baseClass} ${language === "en" ? activeClass : inactiveClass}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("uk")}
        aria-pressed={language === "uk"}
        className={`${baseClass} ${language === "uk" ? activeClass : inactiveClass}`}
      >
        UA
      </button>
    </div>
  )
}
