import type { MoodId } from "../data/moods"

/**
 * Every user-facing string in MoodPlayer, in English — one typed object
 * (`copy`), imported directly by each component (`import { copy as t }`).
 * MoodPlayer is English-only: the former EN/UA dictionaries, language
 * context and switcher were removed. Strings stay centralized here rather
 * than inlined, so copy edits stay in one place.
 *
 * `common.wordmark` is shared by `TextStack` (Intro's hero wordmark) and
 * `MoodPlayerLogo` (the header lockup) — one source for the brand name.
 *
 * `cameraPermission.features` is keyed by the same stable `id`s already
 * used in `data/cameraPermissionFeatures.ts` (icon + label size stay purely
 * structural there; only this object carries the label text).
 */
export type CameraPermissionFeatureId = "facial-cues" | "on-device" | "not-recorded"

export type Copy = {
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
   *  all three moods is each frame's/existing text verbatim. `description`
   *  for all three moods is explicitly-approved copy from a later task
   *  (not itself sourced from a Figma frame export). */
  vibeResult: {
    heading: string
    scanAgainLabel: string
    manualChooseLabel: string
    /** The primary playlist CTA — standardized to the same copy for every
     *  mood ("Start listening"), so this is one shared
     *  string rather than living inside `moods` and being duplicated
     *  three times. `VibeResultScreen` reads this directly instead of
     *  `activeMood.ctaLabel` (which no longer exists). */
    ctaLabel: string
    moods: Record<MoodId, { name: string; description: string }>
  }
  /** Player screen — reached from Vibe Result's "Start listening" CTA (see
   *  `App.tsx`). The placeholder track title/artist (`data/playerTrack.ts`) are treated
   *  as track metadata, not UI chrome, so they live in that data file
   *  rather than here.
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
    /** Desktop Player utility rail's mood card heading (Figma node
     *  `549:1378`, "Choose Vibe"). */
    chooseVibeHeading: string
    upNextSubtitle: (moodName: string) => string
    /** Accessible name for the Mobile Up Next bottom sheet's drag-handle
     *  toggle (`MobileUpNextSheet.tsx`) — state-dependent (mirrors
     *  `controls.play`/`pause`'s own "label describes the action a press
     *  performs next" convention), read alongside a real `aria-expanded`
     *  so assistive tech gets both the action and the current state. */
    upNextSheetExpandLabel: string
    upNextSheetCollapseLabel: string
    /** A track row's own accessible name in the Mobile sheet (`title` +
     *  `artist`, per this feature's own explicit "must contain at least
     *  track title and artist" requirement) — a function, not a plain
     *  string, for the same reason `upNextSubtitle` above is: it needs
     *  per-track values spliced in. */
    selectTrack: (title: string, artist: string) => string
    /** Appended to `selectTrack`'s label (and shown as a small visible
     *  badge) on the Mobile sheet's current-track row only — a second,
     *  non-color signal for "this is the current track" alongside the
     *  existing gradient ring, per this feature's own explicit
     *  "don't rely only on color" requirement. */
    nowPlayingLabel: string
    /** Mobile Player closed-state triggers (`MobilePlayerTriggers.tsx`):
     *  the mood trigger's accessible name, and the gesture trigger's
     *  visible prefix ("Gestures · On"). */
    moodTriggerLabel: (moodName: string) => string
    gesturesTrigger: string
    controls: {
      shuffle: string
      previous: string
      play: string
      pause: string
      next: string
      repeat: string
      volume: string
      /** The waveform's own `role="slider"` accessible name (seeking) —
       *  the dynamic "elapsed of total" position itself is announced via
       *  that same control's `aria-valuetext`, not repeated here; this is
       *  only ever the control's static purpose, same as `volume` above
       *  is for the volume slider. */
      seek: string
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
       *  `aria-label`s (see `PlayerControls.tsx`), so the legend text can
       *  change without touching the transport buttons' names. */
      actionPlay: string
      actionPause: string
      actionNext: string
      actionPrevious: string
    }
  }
  /** `AppErrorBoundary`'s fallback, shown only after an unexpected render
   *  error anywhere in the app. */
  appError: {
    heading: string
    body: string
    reloadLabel: string
  }
}

export const copy: Copy = {
  common: {
    wordmark: "MoodPlayer",
    logoHomeAriaLabel: "MoodPlayer — Home",
  },
  intro: {
    // Literal `\n` between the two sentences — `TextStack`'s tagline `<p>` has
    // `whitespace-pre-line` so this renders as an actual line break
    // instead of the browser's own wrap. Copy itself is this task's own
    // explicit replacement text (was "Every mood has its sound. Let's
    // find yours.") — not a Figma-sourced string.
    tagline: "Every mood has its own sound.\nWe’ll find yours.",
    ctaLabel: "Turn on Your Music",
  },
  cameraPermission: {
    heading: "Find your vibe",
    // \u00A0 keeps "a playlist" from wrapping onto separate lines at mobile widths.
    body: "With your permission, MoodPlayer uses your camera to analyze facial cues and suggest a\u00A0playlist for your vibe.",
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
    // Standardized across all three moods — see the `Copy` type
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
  player: {
    upNextHeading: "Playlist",
    chooseVibeHeading: "Choose Vibe",
    upNextSubtitle: (moodName) => `from the “${moodName}” playlist`,
    upNextSheetExpandLabel: "Expand playlist",
    upNextSheetCollapseLabel: "Collapse playlist",
    selectTrack: (title, artist) => `Play ${title} by ${artist}`,
    nowPlayingLabel: "Now playing",
    moodTriggerLabel: (moodName) => `Vibe: ${moodName}. Switch vibe`,
    gesturesTrigger: "Gestures",
    controls: {
      shuffle: "Shuffle",
      previous: "Previous track",
      play: "Play",
      pause: "Pause",
      next: "Next track",
      repeat: "Repeat",
      volume: "Volume",
      seek: "Seek",
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
  appError: {
    heading: "Something went wrong",
    body: "MoodPlayer ran into an unexpected problem. Reload to start again.",
    reloadLabel: "Reload",
  },
}
