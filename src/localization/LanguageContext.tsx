import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { translations, type Language, type Translations } from "./translations"

const STORAGE_KEY = "moodplayer-language"

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "uk"
}

/** No valid stored language (first visit, or a corrupted/unexpected stored
 *  value) → English, the approved default. Read once, at module-level call
 *  time, mirroring the existing `?screen=` initial-state pattern in
 *  `App.tsx` — a plain synchronous read, no loading state needed. */
function initialLanguage(): Language {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isLanguage(stored) ? stored : "en"
}

type LanguageContextValue = {
  language: Language
  /** Switches the active language, persists it, and (via the effect below)
   *  updates `document.documentElement.lang` — the one place all of that
   *  happens, so every caller (today, only `LanguageSwitcher`) just needs
   *  to call this. */
  setLanguage: (language: Language) => void
  /** The current language's full translation object — components read
   *  straight through it (e.g. `t.intro.ctaLabel`) rather than calling a
   *  lookup function, since nothing here needs interpolation/pluralization. */
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

/**
 * Global language preference for the whole app — mounted once, above
 * `App`, in `main.tsx`, so every screen (present and future) can read it via
 * `useLanguage()` with no prop-drilling. Persists to `localStorage` on every
 * change and keeps `document.documentElement.lang` in sync, satisfying
 * Guidelines §10 ("remember the user's choice") without a routing or
 * loading-state change of any kind — this is pure state or the current
 * screens wouldn't need to change to read it.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function setLanguage(next: Language) {
    setLanguageState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

/** Throws outside a `LanguageProvider` rather than silently defaulting —
 *  every current and future consumer is expected to be mounted under the
 *  one app-wide provider in `main.tsx`, so a missing provider is a real
 *  wiring bug worth surfacing immediately, not a state to design around. */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
