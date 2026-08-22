import type { MoodId } from "../data/moods"

/**
 * Typed English/Ukrainian translation dictionaries for every currently
 * implemented user-facing string in MoodPlayer (Intro + Camera Permission).
 *
 * Plain TypeScript objects, not JSON — `Record<Language, Translations>`
 * means both language entries are statically checked against the exact same
 * shape, so a missing Ukrainian key is a compile error, not a silent
 * fallback. No i18n dependency, no interpolation/pluralization engine: this
 * app has neither need today, so a direct object lookup (via
 * `useLanguage()`'s `t`, see `LanguageContext.tsx`) is the smallest
 * appropriate mechanism.
 *
 * `common.wordmark` is shared by `TextStack` (Intro's hero wordmark) and
 * `MoodPlayerLogo` (Camera Permission's header lockup) — one source for the
 * one brand name both screens render, rather than a hardcoded literal in one
 * and a content lookup in the other. The brand name itself, "MoodPlayer",
 * is intentionally identical in both languages — brand names aren't
 * translated.
 *
 * `cameraPermission.features` is keyed by the same stable `id`s already
 * used in `data/cameraPermissionFeatures.ts` (icon + label size stay purely
 * structural there; only this dictionary carries the label text).
 */
export type Language = "en" | "uk"

export type CameraPermissionFeatureId = "facial-cues" | "on-device" | "not-recorded"

export type Translations = {
  common: {
    wordmark: string
  }
  intro: {
    tagline: string
    ctaLabel: string
  }
  cameraPermission: {
    heading: string
    body: string
    ctaLabel: string
    features: Record<CameraPermissionFeatureId, string>
    /** Scanning state — reached after the user grants camera access.
     *  `scanningCtaLabel` sits next to the animated 3-dot indicator (the
     *  dots are pure CSS, not baked into this string). The other three are
     *  small, non-blocking captions overlaid on the live preview for
     *  states the approved Figma frames don't depict (no live camera
     *  screenshot is possible there) — written in the same restrained tone
     *  as the rest of this screen's copy. */
    scanningCtaLabel: string
    scanningInitializing: string
    scanningNoFace: string
    scanningUnavailable: string
    /** Shown instead of the other scanning captions when the head is
     *  turned far enough that a front-facing expression scan is no
     *  longer visually trustworthy (see `useHeadPose`) — tracking itself
     *  hasn't failed, so this is deliberately worded as guidance rather
     *  than an error, matching this screen's existing restrained tone. */
    scanningFaceCamera: string
    scanningAriaLabel: string
    /** Replaces `scanningCtaLabel` + the animated dots once accumulated
     *  valid scanning time reaches its target duration (see
     *  `useScanProgress`) — rendered inside the existing `role="status"
     *  aria-live="polite"` pill, so it's announced the same way the
     *  scanning captions already are, with no separate aria-only string
     *  needed. */
    scanningCompleteLabel: string
  }
  /** Vibe Result screen — reached automatically once scanning's completed
   *  state (above) is reached, no click required (see `App.tsx`).
   *  Approved Figma frames: Desktop `284:2584`/`284:2656`, Mobile `289:6988`,
   *  showing the "chill" and "happy" examples respectively. `moods.chill`'s
   *  and `moods.happy`'s `name`/`description`/`ctaLabel` are each their own
   *  frame's English text verbatim. `moods.melancholic` still has no Figma
   *  reference at all — its English copy here is a placeholder in the same
   *  tone/pattern, clearly not design-approved, needed only so the manual
   *  mood-selector (which Figma's own control hierarchy requires
   *  supporting) has something non-empty to show for that mood. The screen chrome
   *  (`heading`/`scanAgainLabel`/`manualChooseLabel`) and `moods.chill`
   *  have real Ukrainian translations (a later task explicitly requested
   *  Chill-screen localization — Guidelines §10's "unless the current task
   *  explicitly requests translation work" applies). `moods.happy` now has
   *  a real Ukrainian translation too (a later task explicitly requested
   *  it, alongside implementing the Happy state itself from Figma frame
   *  `284:2656`). `moods.melancholic` still mirrors its English text
   *  verbatim — still out of scope and still no Figma reference. This
   *  remains a real, reportable gap for Melancholic, not a silent one. */
  vibeResult: {
    heading: string
    scanAgainLabel: string
    manualChooseLabel: string
    /** The primary playlist CTA — standardized to the same copy for every
     *  mood ("Start listening" / "Почати слухати"), so this is one shared
     *  string rather than living inside `moods` and being duplicated
     *  three times. `VibeResultScreen` reads this directly instead of
     *  `activeMood.ctaLabel` (which no longer exists). */
    ctaLabel: string
    moods: Record<MoodId, { name: string; description: string }>
  }
  languageSwitcher: {
    ariaLabel: string
  }
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      wordmark: "MoodPlayer",
    },
    intro: {
      // Literal `\n` between the two sentences, same technique/reason as
      // the Ukrainian tagline below — `TextStack`'s tagline `<p>` has
      // `whitespace-pre-line` so this renders as an actual line break
      // instead of the browser's own wrap. Copy itself is this task's own
      // explicit replacement text (was "Every mood has its sound. Let's
      // find yours.") — not a Figma-sourced string.
      tagline: "Every mood has its own sound.\nWe’ll find yours.",
      ctaLabel: "Turn on Your Music",
    },
    cameraPermission: {
      heading: "Find your vibe",
      body: "With your permission, MoodPlayer uses your camera to analyze facial cues and suggest a playlist for your vibe.",
      ctaLabel: "Allow Camera",
      features: {
        "facial-cues": "Analyzes facial cues",
        "on-device": "Works on your device",
        "not-recorded": "We don’t save your photos or videos",
      },
      scanningCtaLabel: "Scanning",
      scanningInitializing: "Preparing scan…",
      scanningNoFace: "No face detected",
      scanningUnavailable: "Camera unavailable",
      scanningFaceCamera: "Face the camera",
      scanningAriaLabel: "Scanning in progress",
      scanningCompleteLabel: "Vibe found",
    },
    vibeResult: {
      heading: "Your suggested vibe",
      scanAgainLabel: "Scan again",
      manualChooseLabel: "Or choose a mood manually",
      // Standardized across all three moods — see the `Translations` type
      // doc comment above.
      ctaLabel: "Start listening",
      moods: {
        // Figma-approved text, verbatim (frames `284:2584` / `289:6988`).
        chill: {
          name: "Chill",
          description: "Soft rhythms, atmospheric sounds, and a calm visual palette designed for your chill mood.",
        },
        // Figma-approved text, verbatim (frame `284:2656`).
        happy: {
          name: "Happy",
          description: "Energetic rhythms, cheerful melodies, and a bright, vibrant interface palette designed to lift your mood.",
        },
        // Placeholder — no Figma reference exists for this mood yet; see
        // this section's own doc comment on the `Translations` type above.
        melancholic: {
          name: "Melancholic",
          description: "Slow tempos, introspective tones, and a moody visual palette designed for your melancholic mood.",
        },
      },
    },
    languageSwitcher: {
      ariaLabel: "Language",
    },
  },
  uk: {
    common: {
      wordmark: "MoodPlayer",
    },
    intro: {
      // Literal `\n` between the two sentences — `TextStack`'s tagline
      // `<p>` has `whitespace-pre-line` specifically so this renders as an
      // actual line break there, instead of the browser's own wrap
      // landing on the lone word "твоє" per this task's explicit request.
      // Copy itself is unchanged from the plain-space version.
      tagline: "Кожен настрій має своє звучання.\nЗнайдемо твоє.",
      ctaLabel: "Увімкнути музику",
    },
    cameraPermission: {
      heading: "Знайди свій вайб",
      body: "З твого дозволу MoodPlayer використає камеру, щоб проаналізувати міміку й підібрати плейліст під твій вайб.",
      ctaLabel: "Дозволити камеру",
      features: {
        "facial-cues": "Аналізує міміку",
        "on-device": "Працює на твоєму пристрої",
        "not-recorded": "Ми не зберігаємо твої фото чи відео",
      },
      scanningCtaLabel: "Скануємо",
      scanningInitializing: "Готуємо скан…",
      scanningNoFace: "Обличчя не знайдено",
      scanningUnavailable: "Камера недоступна",
      scanningFaceCamera: "Повернись до камери",
      scanningAriaLabel: "Сканування триває",
      scanningCompleteLabel: "Вайб визначено",
    },
    // The screen chrome and `chill` below are real, requested Ukrainian
    // translations (not a mirror) — reusing this file's own established
    // terminology: "вайб" (already used for "vibe" in `cameraPermission`)
    // and "настрій" (already used for "mood" in `intro.tagline`). `happy`/
    // `melancholic` have real Ukrainian `name`s now too (a later task
    // explicitly requested those), but their `description`/`ctaLabel`
    // still mirror the English text verbatim — still out of scope and
    // still no Figma reference for either; see the `vibeResult` doc
    // comment on the `Translations` type above.
    vibeResult: {
      heading: "Твій вайб зараз",
      scanAgainLabel: "Сканувати ще раз",
      manualChooseLabel: "Або обери настрій самостійно",
      // Standardized across all three moods — see the `Translations` type
      // doc comment above.
      ctaLabel: "Почати слухати",
      moods: {
        chill: {
          name: "Чіл",
          description: "М'які ритми, атмосферні звуки та спокійна візуальна палітра для твого розслабленого настрою.",
        },
        happy: {
          name: "Радість",
          description: "Енергійні ритми, веселі мелодії та яскрава візуальна палітра, що піднімають настрій.",
        },
        melancholic: {
          name: "Меланхолія",
          description: "Slow tempos, introspective tones, and a moody visual palette designed for your melancholic mood.",
        },
      },
    },
    languageSwitcher: {
      ariaLabel: "Мова",
    },
  },
}
