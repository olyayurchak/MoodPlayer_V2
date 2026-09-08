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
 *
 * A measured audit found each button's real hit area was only ~34×29px —
 * well under the ~44×44px iOS ergonomic baseline — with just ~3px between
 * the two, a real mis-tap risk. Fixed here with the same "small visual,
 * larger hit area" technique this codebase already uses for Shuffle/Repeat
 * and the volume slider (`PlayerControls.tsx`), adapted for a case those
 * don't have: two *adjacent* controls whose hit areas must not collide.
 *
 * The visible text/underline stay on an inner `<span>` — completely
 * unchanged (`baseClass`/`activeClass`/`inactiveClass` are byte-identical
 * to before) — while the real `<button>` around it grows via an invisible
 * `before:` pseudo-element (`content-['']`, `absolute`, no dependency on
 * an extra DOM node): a plain CSS technique for exactly this, expanding
 * the *clickable* box without moving the button's own layout size (an
 * absolutely-positioned pseudo-element never affects its own parent's
 * flex sizing) or the text/underline inside it (that's the real content,
 * laid out completely normally, untouched).
 *
 * The expansion is deliberately *asymmetric*, not a uniform larger box
 * centered on each button: each button's pseudo-element only grows
 * *outward*, away from its neighbor (`before:-left-[10px]` in EN's case,
 * `before:-right-[10px]` for UA — the other three sides just reach this
 * button's own existing edge, `before:right-0`/`before:left-0`), so the
 * two enlarged hit areas can never overlap however wide they grow. Vertical
 * growth (`before:-top-[8px] before:-bottom-[8px]`) has no such neighbor to
 * worry about, so it's symmetric on both buttons. Together this measures
 * ~44×45px per button — meeting the ~44×44px target on both axes.
 *
 * That asymmetric growth alone would still leave only the original ~4px
 * `gap-[4px]` between the two now-larger hit areas (each grows only
 * outward, so the *inward*-facing edges — EN's right, UA's left — never
 * move at all, meaning that gap is exactly the flex `gap` between the two
 * buttons, unchanged by this file's own growth). Reaching the requested
 * ~8px of real separation therefore needs the one small, deliberate,
 * in-scope exception to "don't move anything": `gap-[4px]` → `gap-[8px]`.
 * Because the parent's own row is always anchored to its container's right
 * edge (Intro: `right-[24px]` on the wrapper `PlayerScreen.tsx`/
 * `CameraPermissionScreen.tsx`/`VibeResultScreen.tsx`: `justify-between`
 * flush against the header row's own right edge) in every caller, growing
 * this internal gap only shifts EN 4px further left; UA — the rightmost,
 * anchor-adjacent button — stays in exactly its previous position on every
 * screen this renders on.
 */
export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  const baseClass = "font-sans text-[16px] font-medium"
  const activeClass = "border-b-[1.5px] border-white text-text-primary"
  const inactiveClass = "border-b-[1.5px] border-transparent text-[rgba(255,255,255,0.6)]"

  return (
    <div role="group" aria-label={t.languageSwitcher.ariaLabel} className="flex shrink-0 items-center gap-[8px]">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        className="relative before:absolute before:-top-[8px] before:-bottom-[8px] before:-left-[10px] before:right-0 before:content-[''] inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span className={`px-[6px] pb-[4px] ${baseClass} ${language === "en" ? activeClass : inactiveClass}`}>EN</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage("uk")}
        aria-pressed={language === "uk"}
        className="relative before:absolute before:-top-[8px] before:-bottom-[8px] before:left-0 before:-right-[10px] before:content-[''] inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span className={`px-[6px] pb-[4px] ${baseClass} ${language === "uk" ? activeClass : inactiveClass}`}>UA</span>
      </button>
    </div>
  )
}
