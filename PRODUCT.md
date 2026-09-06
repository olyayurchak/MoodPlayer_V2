# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Casual listeners reaching for background music in an ambient, low-effort moment (working, relaxing, commuting) — they want music matched to how they're feeling right now without browsing playlists themselves.

## Product Purpose

MoodPlayer is a responsive browser-based music player that suggests one of exactly three mood-based playlists (Happy, Melancholic, Chill) from an on-device facial-cue scan, then lets the user confirm, reject, retry, or manually override the suggestion before playing music with standard playback controls. Success means the user reaches playback for a mood that feels right — confirmed or manually chosen — with minimal friction and without ever misrepresenting the scan as more than a suggestion.

## Positioning

On-device, camera-based facial-cue mood detection as the input mechanism for choosing a playlist — not manual mood/playlist browsing, and not a claim of objectively knowing the user's emotional or psychological state. A competing mood-playlist product built on manual selection or listening-history inference could not truthfully copy this mechanism.

## Operating Context

Approved flow: Intro → camera permission → face scan → suggested vibe → user confirmation/manual override → player. Camera-based facial analysis is the core feature the user passes through, not an optional shortcut; there is no pre-scan skip-camera or choose-manually path (manual mood selection exists only after a suggestion has been produced). Runs in-browser on both mobile and desktop as one responsive product (shared component hierarchy, not separate apps). Supports English (default) and Ukrainian, switchable without losing playback/mood/navigation state. Optional gesture controls (approved mapping: open palm → play, closed fist → pause, thumb up → next track, thumb down → previous track) always have an equivalent standard UI control.

## Capabilities and Constraints

- Exactly three mood modes: Happy, Melancholic, Chill (`src/data/moods.ts`) — no others.
- Camera frames are processed on-device and must never be uploaded, stored, logged, or transmitted; no "never leaves your device" claim may be made until implementation is verified to behave that way.
- Camera/MediaPipe failures (permission denied, unavailable, load failure) must always offer a working `Try Again` recovery path; permission is requested only after an explicit user action, never on page load, and never re-requested automatically after denial.
- Mood-suggestion results must be described as a suggestion/current vibe/playlist recommendation — never as objective knowledge of emotional, psychological, or mental-health state.
- Gesture recognition uses current MediaPipe Tasks (`@mediapipe/tasks-vision`), not legacy FaceMesh terminology; the specific task (e.g. Pose Landmarker) is chosen only after inspecting the approved gesture mapping.
- **Open/undecided:** no real music catalog or licensing exists yet — `src/data/playerTrack.ts` is placeholder "Up next" content reproducing the approved Figma frames' exact placeholder copy, explicitly not a real content model. Future work should keep using placeholder/foundation data until a real catalog decision is made; do not invent a licensing source.
- Stack (already established by the existing codebase, not a greenfield choice): Vite + React 19 + TypeScript, Tailwind CSS v4, `@mediapipe/tasks-vision` for face/gesture processing.

## Brand Commitments

Name: MoodPlayer. No further binding brand/voice constraints confirmed beyond the approved Figma frames (visual system) referenced in `guidelines/Guidelines.md`.

## Evidence on Hand

- Approved Desktop and Mobile Figma frames (referenced in `guidelines/Guidelines.md`) are the visual source of truth; component exports live under `src/imports/`.
- No real audio/playlist catalog exists — only one unrelated intro sound effect (`src/assets/audio/bubble-scatter.mp3`) and placeholder track metadata/artwork for the Player screen. Do not treat placeholder track data as real content.
- No testimonials, case studies, press, or pricing/licensing evidence exists; none should be fabricated.

## Product Principles

1. The camera-based scan is the entry mechanism to the core flow, never an optional shortcut — but its result is always framed as a suggestion, never as psychological truth.
2. Manual mood selection is a required post-suggestion path, not a pre-scan escape hatch.
3. Privacy by construction: camera frames stay on-device; no unverified privacy claims.
4. One responsive product, not duplicated Desktop/Mobile apps — shared state, logic, and components throughout.
5. Every gesture control has a standard UI equivalent; nothing essential is gesture-only.

## Accessibility & Inclusion

Must remain usable with keyboard controls and with reduced motion (`prefers-reduced-motion` respected); camera access itself is required to progress through the core flow, but camera/MediaPipe failure states must still provide clear feedback and a working recovery path so the experience never appears silently broken. Minimum 44×44px touch targets on mobile. No product-specific accessibility requirement beyond these was established.
