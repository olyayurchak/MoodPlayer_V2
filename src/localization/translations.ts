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
    /** Accessible name for `MoodPlayerLogo` when it's rendered as a
     *  clickable home/Intro link (see that component's own `onClick`
     *  prop) — the visible wordmark text alone would give a button its
     *  brand name as an accessible name ("MoodPlayer"), not the action
     *  clicking it performs, so this states that action explicitly. */
    logoHomeAriaLabel: string
  }
  intro: {
    tagline: string
    ctaLabel: string
  }
  cameraPermission: {
    heading: string
    body: string
    ctaLabel: string
    /** Shown in place of `ctaLabel` on the primary CTA while the browser's
     *  native permission prompt is in flight (`cameraStatus ===
     *  "requesting"` in `CameraPermissionScreen`) — the CTA is already
     *  `disabled` for that same duration to block a duplicate
     *  `getUserMedia` call; this string is the one thing that changes on
     *  top of that, so a user who glances away and back gets a clear
     *  "we're waiting on you" signal instead of a flat, unresponsive-
     *  looking button. Reuses `CameraPermissionCta`'s existing `label`
     *  override prop — no new mechanism. */
    requestingLabel: string
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
    /** Error-recovery states — replace `heading`/`body`/`ctaLabel` above
     *  (never rendered alongside them) whenever a camera or MediaPipe
     *  failure needs the user's attention; see `CameraPermissionScreen`'s
     *  own `errorKind` state for exactly when each applies. All three
     *  share one `tryAgainLabel` CTA rather than each having its own —
     *  the action ("retry whatever just failed") is identical in kind
     *  across all three, only the heading/subtitle explain which failure
     *  occurred. */
    errorDeniedHeading: string
    errorDeniedSubtitle: string
    errorUnavailableHeading: string
    errorUnavailableSubtitle: string
    errorMediaPipeHeading: string
    errorMediaPipeSubtitle: string
    tryAgainLabel: string
  }
  /** Vibe Result screen — reached automatically once scanning's completed
   *  state (above) is reached, no click required (see `App.tsx`).
   *  Approved Figma frames: Desktop `284:2584`/`284:2656`, Mobile `289:6988`,
   *  showing the "chill" and "happy" examples respectively — `name` for
   *  all three moods, in both languages, is each frame's/existing text
   *  verbatim. `description` for all three moods, in both languages, was
   *  replaced with explicitly-approved copy from a later task (not itself
   *  sourced from a Figma frame export) — this also resolved the
   *  Melancholic gap this comment used to document: earlier, Melancholic
   *  had no Figma reference at all and its Ukrainian `description` simply
   *  mirrored the English placeholder verbatim; both languages now have
   *  their own real, approved text like Chill and Happy already did. */
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
  /** Player screen — reached from Vibe Result's "Start listening" CTA (see
   *  `App.tsx`). UI foundation only: no Figma frame for this screen has an
   *  approved English/Ukrainian copy pair beyond what's captured here, and
   *  the placeholder track title/artist (`data/playerTrack.ts`) are treated
   *  as track metadata, not translatable UI chrome — song titles/artist
   *  names aren't localized in real music apps either, so they live in that
   *  data file, untranslated, rather than here.
   *
   *  `upNextSubtitle` is the one exception to this dictionary's usual
   *  "plain string, no interpolation" rule (see the type doc comment
   *  above): it needs the *current* mood's own translated name spliced in
   *  ("from the “Chill” playlist" / "from the “Happy” playlist" / ...),
   *  which a static string can't express. A plain function is still the
   *  smallest mechanism that covers this one case — no interpolation
   *  library added for a single call site. */
  player: {
    upNextHeading: string
    upNextSubtitle: (moodName: string) => string
    controls: {
      shuffle: string
      previous: string
      play: string
      pause: string
      next: string
      repeat: string
      volume: string
    }
    gestures: {
      heading: string
      on: string
      off: string
      openPalm: string
      closedFist: string
      thumbUp: string
      thumbDown: string
      /** The gesture legend's own action labels ("Open palm → Play",
       *  etc.) — deliberately *separate* strings from `controls.play/
       *  pause/next/previous` above, even though English happens to
       *  read identically for all four, because those `controls.*`
       *  strings are also the real Play/Pause/Next/Previous buttons' own
       *  `aria-label`s (see `PlayerControls.tsx`). A later task needed to
       *  shorten only the Ukrainian *gesture-legend* text ("Наступний
       *  трек" → "Наступний") without touching the real transport
       *  buttons' Ukrainian `aria-label`s — impossible while both read
       *  from the same key. */
      actionPlay: string
      actionPause: string
      actionNext: string
      actionPrevious: string
    }
  }
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      wordmark: "MoodPlayer",
      logoHomeAriaLabel: "MoodPlayer — Home",
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
      requestingLabel: "Requesting access…",
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
      errorDeniedHeading: "Camera access needed",
      errorDeniedSubtitle:
        "MoodPlayer needs camera access to scan your facial cues. Enable camera access in your browser settings, then try again.",
      errorUnavailableHeading: "Camera unavailable",
      errorUnavailableSubtitle: "We couldn't access your camera. Check that it's available and try again.",
      errorMediaPipeHeading: "Face analysis unavailable",
      errorMediaPipeSubtitle: "We couldn't start facial analysis. Try again to restart the scan.",
      tryAgainLabel: "Try Again",
    },
    vibeResult: {
      heading: "Your suggested vibe",
      scanAgainLabel: "Scan again",
      manualChooseLabel: "Or choose a mood manually",
      // Standardized across all three moods — see the `Translations` type
      // doc comment above.
      ctaLabel: "Start listening",
      moods: {
        chill: {
          name: "Chill",
          description: "Soft rhythms, atmospheric sounds, and calm visuals with gentle motion.",
        },
        happy: {
          name: "Happy",
          // A non-breaking space joins "a" to "bright" — without it, this
          // description's line wrap (at this screen's fixed 382px English
          // description width) stranded the standalone article "a" alone
          // at the end of the first line, with "bright interface..."
          // starting the second. Melancholic's own "and a moody visual..."
          // wraps fine as-is (its "a" already lands mid-line, glued to
          // "moody"), so only this one description needed the fix.
          description: "Energetic rhythms, cheerful melodies, and a bright interface with lively effects.",
        },
        melancholic: {
          name: "Melancholic",
          description: "Slow tempos, introspective tones, and a moody visual palette for reflective moments.",
        },
      },
    },
    languageSwitcher: {
      ariaLabel: "Language",
    },
    player: {
      upNextHeading: "Up next",
      upNextSubtitle: (moodName) => `from the “${moodName}” playlist`,
      controls: {
        shuffle: "Shuffle",
        previous: "Previous track",
        play: "Play",
        pause: "Pause",
        next: "Next track",
        repeat: "Repeat",
        volume: "Volume",
      },
      gestures: {
        heading: "Gesture controls",
        on: "On",
        off: "Off",
        openPalm: "Open palm",
        closedFist: "Closed fist",
        thumbUp: "Thumb up",
        thumbDown: "Thumb down",
        actionPlay: "Play",
        actionPause: "Pause",
        actionNext: "Next track",
        actionPrevious: "Previous track",
      },
    },
  },
  uk: {
    common: {
      wordmark: "MoodPlayer",
      logoHomeAriaLabel: "MoodPlayer — На головну",
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
      requestingLabel: "Запитуємо доступ…",
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
      errorDeniedHeading: "Потрібен доступ до камери",
      errorDeniedSubtitle:
        "MoodPlayer потрібен доступ до камери, щоб проаналізувати міміку. Дозволь доступ у налаштуваннях браузера та спробуй ще раз.",
      errorUnavailableHeading: "Камера недоступна",
      errorUnavailableSubtitle: "Не вдалося отримати доступ до камери. Перевір її доступність і спробуй ще раз.",
      errorMediaPipeHeading: "Не вдалося запустити аналіз",
      errorMediaPipeSubtitle: "Не вдалося запустити аналіз обличчя. Спробуй ще раз, щоб перезапустити сканування.",
      tryAgainLabel: "Спробувати ще раз",
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
          description: "М’які ритми, атмосферне звучання та спокійні візуальні ефекти з плавною анімацією.",
        },
        happy: {
          name: "Радість",
          description: "Енергійні ритми, життєрадісні мелодії та яскравий інтерфейс із динамічними ефектами.",
        },
        melancholic: {
          name: "Меланхолія",
          description: "Повільні темпи, задумливі мотиви та приглушена візуальна палітра для моментів роздумів.",
        },
      },
    },
    languageSwitcher: {
      ariaLabel: "Мова",
    },
    player: {
      upNextHeading: "Далі в черзі",
      upNextSubtitle: (moodName) => `з плейліста «${moodName}»`,
      controls: {
        shuffle: "Перемішати",
        previous: "Попередній трек",
        play: "Відтворити",
        pause: "Пауза",
        next: "Наступний трек",
        repeat: "Повтор",
        volume: "Гучність",
      },
      gestures: {
        heading: "Керування жестами",
        on: "Увімк.",
        off: "Вимк.",
        openPalm: "Долоня",
        closedFist: "Кулак",
        thumbUp: "Палець вгору",
        thumbDown: "Палець вниз",
        actionPlay: "Відтворити",
        actionPause: "Пауза",
        actionNext: "Наступний",
        actionPrevious: "Попередній",
      },
    },
  },
}
