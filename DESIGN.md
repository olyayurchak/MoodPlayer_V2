---
name: MoodPlayer
description: A calm, glowing nocturnal music player that reads your vibe through a facial-cue scan.
colors:
  midnight-navy: "#050a18"
  text-primary: "#ffffff"
  text-secondary: "#f1f1f1"
  mood-gradient-from: "#a64ca6"
  mood-gradient-via: "#7458b8"
  mood-gradient-to: "#5576d8"
  cta-border: "rgb(255 255 255 / 0.25)"
  play-glyph: "#7351bb"
  glow-navy: "#172044"
  glow-purple: "#57206f"
  glow-magenta: "#8a255f"
  glow-magenta-deep: "#6e1d55"
  glow-blue: "#173b69"
  active-accent: "#d8b9ff"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontWeight: 700
  wordmark:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "54px"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-3px"
  wordmark-lg:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "140px"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-3px"
  tagline:
    fontFamily: "Geist, sans-serif"
    fontSize: "20px"
    fontWeight: 300
    lineHeight: 1.4
    letterSpacing: "-0.5px"
  tagline-lg:
    fontFamily: "Geist, sans-serif"
    fontSize: "28px"
    fontWeight: 300
    lineHeight: 1.4
    letterSpacing: "-0.5px"
  cta:
    fontFamily: "Geist, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: normal
rounded:
  pill: "200px"
spacing:
  stack-gap: "20px"
  hero-gap: "48px"
  cta-gap: "16px"
  cta-x: "36px"
  cta-h: "60px"
components:
  cta-pill:
    backgroundColor: "linear-gradient(to right, {colors.mood-gradient-from}, {colors.mood-gradient-via}, {colors.mood-gradient-to})"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "0 {spacing.cta-x}"
    height: "{spacing.cta-h}"
  glass-pill-inactive:
    backgroundColor: "rgba(255,255,255,0.08)"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
  glass-pill-active:
    backgroundColor: "rgba(255,255,255,0.08)"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
  play-button:
    backgroundColor: "linear-gradient(to right, {colors.mood-gradient-from}, {colors.mood-gradient-via}, {colors.mood-gradient-to})"
    textColor: "#ffffff"
    rounded: "9999px"
    size: "76px"
  icon-button:
    backgroundColor: "rgba(173,153,219,0.08)"
    textColor: "#ffffff"
    rounded: "9999px"
    size: "48px"
---

# Design System: MoodPlayer

## Overview

**Creative North Star: "The Night Aurora"**

MoodPlayer lives in a deep, near-black night sky — Midnight Navy (`#050a18`) — lit from within by soft violet, magenta, and blue glow fields that drift behind every screen like aurora light glimpsed through a dark window. Out of that calm dark field glows a restrained signature accent: the Mood Gradient (magenta → violet → blue), used primarily for primary actions and active states. Everything else stays quiet — deep navy, soft white glass, restrained white glows — so that gradient reads as the app's pulse, not decoration.

The system is calm, glowing, and intimate rather than flashy or busy — one deliberate light source (the aurora glow field, the gradient CTA) against a settled dark stage, never a crowded or high-energy composition. It deliberately avoids the look of a generic SaaS dashboard, streaming-platform grid, or glassmorphism-as-decoration trend piece: every glass surface and glow here exists to support the mood-detection ritual and the music, not to perform "modern UI" for its own sake.

**Key Characteristics:**
- Deep navy night-sky field with drifting ambient aurora glows (magenta/violet/blue/navy), never a flat solid background
- A restrained Mood Gradient signature accent, used primarily for primary actions and active states across the app
- Soft glass pill and panel surfaces (translucent white fill + backdrop-blur) rather than opaque cards
- Depth from light, not shadow: elevation reads as a glow, never a dark drop shadow
- Generous pill radii (`200px`) on every interactive control — no sharp rectangular buttons
- Restrained, purposeful motion only (border-travel hover, idle bubble float, staggered scan pulses) — nothing decorative or continuous without a state to communicate

## Colors

The palette is a near-monochrome dark field (Midnight Navy, near-black glow hues) punctuated by a restrained warm accent — the Mood Gradient.

### Primary
- **Mood Gradient** (`#a64ca6` → `#7458b8` → `#5576d8`, left-to-right on buttons/sliders, ~145° diagonal on large visual panels): the app's signature accent, used universally (the same three stops regardless of which of the three moods is active) on primary CTAs (`CtaPill`, Camera Permission CTA, Scanning CTA, Vibe Result CTA) and everywhere on Intro/Camera Permission/Scanning/Vibe Result. On the **Player** screen specifically, this is now the *default* — the treatment a mood falls back to until its own Player Mood Accent (below) is approved — rather than a value every mood is guaranteed to keep forever.
- **Player Mood Accent** (`src/data/playerMoodAccent.ts`, `PLAYER_MOOD_ACCENTS`): a small, additive, Player-screen-only override layer, one mood at a time. A mood without its own approved Figma frame simply has no entry in this map, and every Player component treats a missing entry as "render the universal Mood Gradient above, unchanged." Currently populated:
  - **Happy** (`#f1a04e` → `#eb6e51` → `#e54d56`, ~105° left-to-right — see the data file's own field-by-field comments for exactly which Figma node each value was copied from): replaces the Mood Gradient on the Player screen's Play/Pause button fill, the waveform's played bars, the volume slider's filled track, the header logo mark's icon (a real inline `<svg>` reusing the shared mark's own five bar paths/viewBox with its own `<linearGradient>` stops swapped in, not a separate asset and not a CSS mask), and the *ring* (not a solid border — an earlier pass tried a flat solid stroke here, corrected to reuse the same masked-gradient-ring technique the universal Mood Gradient's own selected-pill ring already uses) around: the artwork panel (plus its own ambient glow, a solid `box-shadow` color, not part of the ring), the selected "Happy" mood-selector pill, and the Up Next current-track row (plus its own translucent fill tint). It also overrides `AppBackground`'s own ambient glow field (see that component's `mobileGlows`/`desktopGlows` override props) with this mood's own approved warm coral/orange blobs, in place of the universal navy/violet/indigo set, at the same frame-relative positions. The gesture-panel action-label text and the Up Next duration labels are deliberately *not* part of this accent — both read one shared neutral color (`rgba(255,255,255,0.92)` and `#cfcfcf` respectively) across all three moods, an explicit "neutral regardless of mood" request superseding an earlier Happy-only accent on the gesture labels. Every other Player element (icon buttons, glass pills/panels, the gesture toggle, scrollbars, all typography) is unaffected and still reads from the shared tokens below.
  - Melancholic and Chill: no entry yet — their own Player Mood Accent awaits their own approved Figma frames; until then the Player screen renders identically to how it did before this Happy milestone.

### Neutral
- **Midnight Navy** (`#050a18`): the base background for every screen (`<main>` on every screen carries this — never left to the browser's own white canvas, including during screen transitions).
- **Text Primary** (`#ffffff`): headings, body copy, primary labels.
- **Text Secondary** (`#f1f1f1`): supporting copy (e.g. the Intro tagline).
- **Glow field** (`#172044` navy, `#57206f` purple, `#8a255f` magenta, `#6e1d55` deep magenta, `#173b69` blue): the ambient background glow layers (`AppBackground`), shared unmodified across Intro, Camera Permission/Scanning, and Vibe Result.
- **Glass fill** (`rgba(255,255,255,0.08)`): the translucent fill for every glass pill and panel surface.
- **Glass border** (`rgba(255,255,255,0.25)`): the default border on inactive glass pills and the primary CTA's outer border.
- **Active Accent** (`#d8b9ff`): a light violet used for small "on" tints — shuffle/repeat toggle icons, the CTA hover border-travel stroke — a lighter, single-hue cousin of the Mood Gradient for small accent moments that don't need the full three-stop treatment.
- **Play Glyph** (`#7351bb`): reserved token for the play icon glyph fill.

## Typography

**Display Font:** Space Grotesk (with sans-serif fallback)
**Body Font:** Geist (with sans-serif fallback)

**Character:** A tight, bold geometric display face (Space Grotesk, heavy negative tracking) paired with a light, humanist body face (Geist) — confident headline, quiet supporting text underneath it.

### Hierarchy
- **Wordmark / Display** (700 weight, 54px mobile / 140px desktop, line-height 0.9, letter-spacing -3px): the MoodPlayer wordmark, both the Intro hero treatment and the compact 24px/32px header lockup (`MoodPlayerLogo`).
- **Tagline / Body** (300 weight, 20px mobile / 28px desktop, line-height 1.4, letter-spacing -0.5px): supporting copy under the hero wordmark.
- **CTA Label** (500 weight, 20px, line-height normal): primary button labels.
- **UI Label** (500 weight, 16px): mood-selector pills, language switcher, control labels.

### Named Rules
**The Tight Wordmark Rule.** The wordmark's aggressive negative tracking (-3px) and 0.9 line-height are constant across every size it appears at (24px through 140px) — never loosen it to "improve readability"; the compression is the brand's type signature.

## Layout

One shared responsive tree per screen (`lg:` Tailwind variants), not separate Desktop/Mobile component trees, except where a large visual panel's own gradient-border technique requires separate Mobile/Desktop markup (documented per-component, e.g. `CameraPermissionVisual`, `ScanningVisual`, Vibe Result's photo panel). The structural breakpoint is `lg` (1024px), matching the approved Desktop (1440×1024) and Mobile (430×932) Figma frames. Content is centered in a fixed-width column (`--container-content`: 430px mobile / 800px desktop) rather than fluid full-bleed text. Spacing is drawn directly from Figma's own measured values (e.g. 20px stack gap, 48px hero gap, 35px control-row gap) rather than forced into a generic 4/8px scale — exact values are preserved even when they don't round cleanly.

## Elevation & Depth

**Glow-as-elevation.** This system never uses dark box-shadows for depth. Every surface is flat at rest; depth and hierarchy come from two things instead: soft *white* ambient glows under elevated elements (the CTA's `drop-shadow-cta`, the play button's and selected pill's white glow shadow), and `backdrop-blur` glass panels that let the ambient background glow show through, distinguishing "floating" glass surfaces from the flat night-sky field behind them. The gradient border technique (a transparent border + two-layer background-clip) is the system's other depth device: it reads as a lit edge around a panel, not a cast shadow.

### Shadow Vocabulary
- **CTA glow** (`0 12px 12px rgb(255 255 255 / 0.1)`): under every primary gradient CTA pill.
- **Elevated glass glow** (`0px 12px 24px 0px rgba(255,255,255,0.08)`): under the Play/Pause button and the selected mood pill.

### Named Rules
**The No-Dark-Shadow Rule.** Nothing in this system casts a dark shadow. Depth is always a soft white glow or a backdrop-blur reveal of the ambient light behind it — never `rgba(0,0,0,...)`.

## Shapes

Pill radius (`200px`, effectively a full stadium shape) governs every interactive control: CTA buttons, mood-selector pills, the icon-button row, the play button. Large visual panels (camera preview, scanning frame, Vibe Result photo) use a 2px gradient border rather than a sharp rectangle edge. Decorative mood bubbles are circular masks over square artwork, never square or organic-blob shapes. There are no hard right-angle interactive surfaces anywhere in the system.

## Components

### Buttons
- **Primary CTA (`cta-pill`):** Pill radius (`200px`), Mood Gradient fill (left-to-right), 60px height, 1.5px translucent white border (`rgba(255,255,255,0.25)`), white CTA-glow drop shadow. Desktop-only hover: a traced SVG stroke travels once around the border on `:hover`. Focus-visible and reduced-motion both fall back to a static brighter border, never the moving stroke. Press feedback: `scale(0.98)`.
- **Play/Pause (icon-only):** 76px circle, Mood Gradient fill, elevated glass glow shadow. Swaps glyph on toggle; no border.
- **Icon buttons (shuffle/repeat/prev/next):** Circular, `rgba(173,153,219,0.08)` fill, no border. 48px for previous/next; 36px desktop / 44px mobile (touch-target minimum) for shuffle/repeat. "On" state tints the icon `#d8b9ff` (Active Accent) rather than changing the fill.
- **Focus/Active states (every button in the system):** `focus-visible` gets a 2px solid white outline, 2–4px offset. `:active` press gets `scale(0.98)`. No default browser outline is ever left in place.

### Pills (Mood Selector / Toggle)
- **Style:** Glass fill (`rgba(255,255,255,0.08)`), pill radius, `backdrop-blur(20px)`.
- **Inactive:** 1.5px `rgba(255,255,255,0.25)` border.
- **Active/selected:** same glass fill and 1.5px *transparent* border (to preserve identical sizing), plus a separate absolutely-positioned overlay painting the Mood Gradient as a 1.5px ring via the `mask-composite: exclude` technique — never a gradient smeared behind the blur.

### Large Visual Panels (Camera / Scanning / Photo frames)
- **Style:** 2px Mood Gradient border (diagonal, ~145°) via transparent-border + dual-background-layer `background-clip` technique; deep-navy-toward-violet interior fill gradient (`linear-gradient(137.37deg, rgb(18,23,47), rgb(21,16,42), rgb(16,11,34))`) behind it.

### Sliders (Volume)
- **Track:** 8px height, filled portion in the Mood Gradient (from/to stops only) up to the current value, remainder `rgba(255,255,255,0.18)`.
- **Thumb:** 16px white circle with a subtle `rgba(255,255,255,0.4)` ring.
- **Hit area:** invisible padding expands the tap target to 44px minimum without growing the visible 8px track.

### Toggles (Gesture Controls On/Off)
- **Style:** a sliding active indicator (`left`/`width` transition) rather than independently-styled buttons; reduced motion drops the slide to an instant jump.

### Scrollbars (Up Next panel, Desktop only)
- **Style:** narrow 4px thumb, `rgba(217,217,217,0.35)` idle / `0.55` hover, transparent track, no end-cap buttons — never hidden outright.

### Decorative Bubbles
- **Style:** circular masked artwork, idle float animation (translate3d only, three keyframe variants, deterministic per-bubble timing derived from index — never random), disabled under reduced motion. Purely decorative: hidden from assistive technology.

## Do's and Don'ts

### Do:
- **Do** use the Mood Gradient (`#a64ca6 → #7458b8 → #5576d8`) as the system's restrained signature accent — primarily on primary CTAs, active/selected states, play controls, and other key mood-related accents; on the Player screen, a mood's own Player Mood Accent (see above) takes over instead, once approved.
- **Do** convey elevation with a soft white glow or a backdrop-blur reveal of the ambient glow field behind a surface — never a dark shadow.
- **Do** use pill radius (`200px`) on every interactive control; there are no sharp-cornered buttons in this system.
- **Do** keep `<main>` on Midnight Navy (`#050a18`) on every screen, including during transitions, so no white flash of the browser's default canvas is ever visible.
- **Do** give every gesture-controlled action a real, equivalent standard UI control (button, slider) — gestures are never the only way to trigger something.
- **Do** provide a static brighter-border fallback for any hover-only motion effect, for both keyboard focus and `prefers-reduced-motion`.

### Don't:
- **Don't** use `rgba(0,0,0,...)` box-shadows anywhere; this system has no dark-shadow vocabulary.
- **Don't** reach for generic SaaS-dashboard, streaming-platform-grid, or glassmorphism-as-decoration patterns — glass and glow exist here to support the mood-scan ritual and the music, not to perform "modern UI."
- **Don't** treat the camera-based mood scan as an optional shortcut, or add a pre-scan skip/choose-manually control — manual mood selection is a post-suggestion path only (Guidelines §2, §8).
- **Don't** describe a mood-suggestion result as psychological fact in copy or UI language — always "suggested," "vibe," or "recommendation."
