import type { GlowSpec } from "./introGlows"
import type { MoodId } from "./moods"

/**
 * Per-mood accent overrides for the Player screen — the small, additive
 * theme mechanism this codebase didn't have before the Happy milestone
 * (see `DESIGN.md`'s "Mood Gradient" section, which documents a single
 * *universal* purple accent shared by every mood; this file is the new,
 * explicitly-approved layer that lets one mood — so far only Happy —
 * override that universal accent with its own approved colors, without
 * touching the universal one for the moods that don't have an approved
 * override yet).
 *
 * `PLAYER_MOOD_ACCENTS[mood]` is `undefined` for any mood without its own
 * approved Figma frame yet (currently Chill) — every consumer of this map
 * treats a missing entry as "keep today's existing universal purple
 * treatment, unchanged," never as a fallback to invented colors. That's
 * what lets this file grow one mood at a time without a broader refactor.
 *
 * All values below are copied verbatim from each mood's own approved
 * Figma frames (`f0SWAvXDVVtGkhXDm3DkNZ` — Happy: Desktop `284:3402` /
 * Mobile `289:8515`; Melancholic: Desktop `284:3764` / Mobile `290:9092`)
 * — see each field's own comment for exactly which node it came from.
 * None are derived, rounded, or invented.
 */
export type PlayerMoodAccent = {
  /** The artwork panel's ambient glow color (`box-shadow`, replacing this
   *  screen's universal `ARTWORK_GLOW_STYLE`) — each breakpoint's own
   *  accent color (Mobile `289:8617`, Desktop `284:3612`) at 40% alpha.
   *  Figma's own export used this same color at a much stronger 60%
   *  alpha with a `0 0 40px` blur/spread; a later "make the glow read as
   *  subtle/ambient, not a dominant halo" request first reduced that to
   *  20%, and a follow-up "normalize glow intensity across all three
   *  moods" request settled on the 40% used here (`ARTWORK_GLOW_STYLE`'s
   *  own fallback color below uses the same 40%) — `PlayerScreen`'s own
   *  `artworkGlowShadow` helper owns the shared blur/spread/offset applied
   *  to whichever color this field provides, so only the alpha channel
   *  changed, not the hue. The panel's
   *  own *ring* instead reuses `gradient` below (the same
   *  masked-gradient-ring technique the selected "Happy" mood-selector
   *  pill's ring and the Up Next current-track row's ring already reuse)
   *  — a first attempt painted this ring as a flat solid border in each
   *  breakpoint's own authored hex (`#f1a04e` Desktop / `#f18e4c` Mobile)
   *  instead, which read as one flat stroke rather than the full approved
   *  orange→coral→red sweep Figma shows. */
  artworkGlowMobile: string
  artworkGlowDesktop: string
  /** The Up Next current-track row's translucent fill tint — Figma's own
   *  `#f18e4c` at 10% alpha (`284:3712`), same on both breakpoints. The
   *  row's own *ring* instead reuses `gradient` below (the same
   *  masked-gradient-ring technique the selected "Happy" mood-selector
   *  pill's ring already reuses) — a first attempt painted this ring as a
   *  flat solid `#f18e4c` border instead, which read as one flat orange
   *  stroke rather than the full approved orange→coral→red sweep Figma
   *  shows. (An earlier revision of this type also had the gesture-panel
   *  action-label text read this same hex — since reverted to the
   *  universal neutral white `rgba(255,255,255,0.92)` for every mood, so
   *  this field's only remaining consumer is the row tint above.) */
  accentSecondaryTint: string
  /** The Play button's 3-stop CSS gradient, copied verbatim from its own
   *  exported SVG gradient definition (Desktop `284:5276`'s
   *  `paint0_linear_0_4`, Mobile `289:8662`'s `paint0_linear_0_21` — same
   *  geometry/stops, only the first stop's hex differs between the two,
   *  `#f1a04e` Desktop / `#f18e4c` Mobile — canonicalized to Desktop's
   *  value below rather than threading a second breakpoint-specific value
   *  through every shared consumer). Reused, at full opacity (this SVG's
   *  own `0.8` `fill-opacity` was specific to that asset's own
   *  blended-with-background look; every other gradient fill already
   *  established in this codebase — the universal Mood Gradient included
   *  — is full-opacity, so this follows that existing convention rather
   *  than the raw asset's own translucency), for: the Play button fill,
   *  the selected "Happy" mood-selector pill's ring, the Up Next
   *  current-track row's ring, the artwork panel's own ring
   *  (`PlayerScreen`'s `artworkRingStyle`), the header logo mark's icon
   *  fill (`MoodPlayerLogo`), and (`gradientFrom`/`gradientTo` below) the
   *  waveform's played bars and the volume slider's filled track — the
   *  same two spots the universal Mood Gradient's own `from`/`to` (no
   *  `via`) already cover today. */
  gradient: string
  /** `gradient`'s own first stop, Desktop's `#f1a04e` (see that field's
   *  own comment on the ~6-unit Mobile/Desktop discrepancy this
   *  canonicalizes away for every reader of this field). */
  gradientFrom: string
  /** `gradient`'s own last stop. */
  gradientTo: string
  /** This mood's own ambient background glow field, overriding
   *  `AppBackground`'s shared universal navy/violet/indigo set (see that
   *  component's own `mobileGlows`/`desktopGlows` override props) — the
   *  Player screen's own `<AppBackground>` call passes these through
   *  instead of rendering the default set.
   *
   *  Same 4-blob geometry as the shared set (position/size copied
   *  verbatim from Figma, which places these at the exact same
   *  frame-relative boxes `data/introGlows.ts` already uses), but two of
   *  the four are recolored for Happy: the box at `data/introGlows.ts`'s
   *  own "purple" position becomes a coral/magenta blob here (Desktop
   *  node `284:3404`, Mobile `289:8547`), and its "magenta" position
   *  becomes orange (Desktop `284:3405`, Mobile `289:8546`). The other
   *  two positions ("navy" `284:3403`/`291:9674`, "blue" `284:3406`/
   *  `289:8548`) keep this frame's own colors too, copied independently
   *  rather than reused from `introGlows.ts` — Figma's own "navy" here
   *  happens to match the shared value exactly, but its own "blue" here
   *  (`rgba(23,59,105,...)`) does not match the shared, already-repainted
   *  "blue" token (`rgba(67,94,184,...)`, a later universal change this
   *  Happy frame predates) — this field intentionally keeps this Happy
   *  frame's own exact 4 colors rather than mixing in the shared set's
   *  later "blue" repaint. */
  backgroundGlows: { mobile: GlowSpec[]; desktop: GlowSpec[] }
}

export const PLAYER_MOOD_ACCENTS: Partial<Record<MoodId, PlayerMoodAccent>> = {
  happy: {
    artworkGlowMobile: "rgba(241,142,76,0.4)",
    artworkGlowDesktop: "rgba(241,160,78,0.4)",
    accentSecondaryTint: "rgba(241,142,76,0.1)",
    gradient: "linear-gradient(105deg, #f1a04e 0%, #eb6e51 39.29%, #e54d56 100%)",
    gradientFrom: "#f1a04e",
    gradientTo: "#e54d56",
    backgroundGlows: {
      mobile: [
        {
          id: "navy",
          left: -122,
          top: -373,
          width: 412,
          height: 692,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 412 692' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.2614e-15 34.6 -20.6 2.1186e-15 206 346)'><stop stop-color='rgba(23,32,68,0.42)' offset='0'/><stop stop-color='rgba(23,32,68,0.18)' offset='0.55'/><stop stop-color='rgba(23,32,68,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
        {
          id: "coral",
          left: 238,
          top: -28,
          width: 360,
          height: 940,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 360 940' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.1022e-15 47 -18 2.8779e-15 180 470)'><stop stop-color='rgba(198,74,69,0.5)' offset='0'/><stop stop-color='rgba(164,49,88,0.22)' offset='0.5'/><stop stop-color='rgba(164,49,88,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
        {
          id: "orange",
          left: 28,
          top: 650,
          width: 380,
          height: 500,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 380 500' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.1634e-15 25 -19 1.5308e-15 190 250)'><stop stop-color='rgba(255,138,61,0.38)' offset='0'/><stop stop-color='rgba(217,75,87,0.18)' offset='0.48'/><stop stop-color='rgba(217,75,87,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
        {
          id: "blue",
          left: -112,
          top: 272,
          width: 380,
          height: 500,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 380 500' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.1634e-15 25 -19 1.5308e-15 190 250)'><stop stop-color='rgba(23,59,105,0.1)' offset='0'/><stop stop-color='rgba(23,59,105,0.05)' offset='0.55'/><stop stop-color='rgba(23,59,105,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
      ],
      desktop: [
        {
          id: "navy",
          left: -410,
          top: -410,
          width: 1380,
          height: 760,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1380 760' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(4.225e-15 38 -69 2.3268e-15 690 380)'><stop stop-color='rgba(23,32,68,0.42)' offset='0'/><stop stop-color='rgba(23,32,68,0.18)' offset='0.55'/><stop stop-color='rgba(23,32,68,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
        {
          id: "coral",
          left: 820,
          top: -40,
          width: 1040,
          height: 1120,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1040 1120' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(3.1841e-15 56 -52 3.429e-15 520 560)'><stop stop-color='rgba(198,74,69,0.46)' offset='0'/><stop stop-color='rgba(164,49,88,0.2)' offset='0.5'/><stop stop-color='rgba(164,49,88,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
        {
          id: "orange",
          left: 120,
          top: 690,
          width: 1200,
          height: 620,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1200 620' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(3.6739e-15 31 -60 1.8982e-15 600 310)'><stop stop-color='rgba(255,138,61,0.32)' offset='0'/><stop stop-color='rgba(217,75,87,0.18)' offset='0.48'/><stop stop-color='rgba(217,75,87,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
        {
          id: "blue",
          left: -380,
          top: 300,
          width: 620,
          height: 780,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 620 780' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.8982e-15 39 -31 2.3881e-15 310 390)'><stop stop-color='rgba(23,59,105,0.1)' offset='0'/><stop stop-color='rgba(23,59,105,0.05)' offset='0.55'/><stop stop-color='rgba(23,59,105,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
      ],
    },
  },
  melancholic: {
    // Unlike Happy's own ~6-unit Mobile/Desktop hex gap, Melancholic's
    // artwork glow is a genuinely different color per breakpoint in
    // Figma (Desktop `#4A4F9F`, the gradient's own last stop; Mobile
    // `#8B8BF2`, the gradient's own first stop/border color) — both kept
    // exactly as authored. Alpha normalized to 0.4 across all three
    // moods for consistent glow intensity (Figma's own export used a
    // stronger 60% here; a later explicit "normalize to 0.4" request
    // superseded that, same as Happy's own artwork-glow alpha below).
    artworkGlowMobile: "rgba(139,139,242,0.4)",
    artworkGlowDesktop: "rgba(74,79,159,0.4)",
    accentSecondaryTint: "rgba(139,139,242,0.1)",
    // Play button's own exported SVG gradient (Desktop `287:5308`, Mobile
    // `290:9239` — identical stops/geometry on both breakpoints, unlike
    // Happy's first-stop discrepancy, so no canonicalization is needed
    // here).
    gradient: "linear-gradient(105deg, #8b8bf2 0%, #6b6dc8 39.29%, #4a4f9f 100%)",
    gradientFrom: "#8b8bf2",
    gradientTo: "#4a4f9f",
    backgroundGlows: {
      mobile: [
        {
          id: "navy",
          left: -122,
          top: -373,
          width: 412,
          height: 692,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 412 692' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.2614e-15 34.6 -20.6 2.1186e-15 206 346)'><stop stop-color='rgba(23,32,68,0.42)' offset='0'/><stop stop-color='rgba(23,32,68,0.18)' offset='0.55'/><stop stop-color='rgba(23,32,68,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
        {
          id: "coral",
          left: 238,
          top: -28,
          width: 360,
          height: 940,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 360 940' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.1022e-15 47 -18 2.8779e-15 180 470)'><stop stop-color='rgba(83,98,143,0.5)' offset='0'/><stop stop-color='rgba(61,71,111,0.22)' offset='0.5'/><stop stop-color='rgba(61,71,111,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
        {
          id: "orange",
          left: 28,
          top: 650,
          width: 380,
          height: 500,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 380 500' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.1634e-15 25 -19 1.5308e-15 190 250)'><stop stop-color='rgba(107,91,131,0.38)' offset='0'/><stop stop-color='rgba(64,81,111,0.18)' offset='0.48'/><stop stop-color='rgba(64,81,111,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
        {
          id: "blue",
          left: -112,
          top: 272,
          width: 380,
          height: 500,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 380 500' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.1634e-15 25 -19 1.5308e-15 190 250)'><stop stop-color='rgba(23,59,105,0.1)' offset='0'/><stop stop-color='rgba(23,59,105,0.05)' offset='0.55'/><stop stop-color='rgba(23,59,105,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
      ],
      desktop: [
        {
          id: "navy",
          left: -410,
          top: -410,
          width: 1380,
          height: 760,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1380 760' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(4.225e-15 38 -69 2.3268e-15 690 380)'><stop stop-color='rgba(23,32,68,0.42)' offset='0'/><stop stop-color='rgba(23,32,68,0.18)' offset='0.55'/><stop stop-color='rgba(23,32,68,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
        {
          id: "coral",
          left: 820,
          top: -40,
          width: 1040,
          height: 1120,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1040 1120' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(3.1841e-15 56 -52 3.429e-15 520 560)'><stop stop-color='rgba(83,98,143,0.44)' offset='0'/><stop stop-color='rgba(61,71,111,0.2)' offset='0.5'/><stop stop-color='rgba(61,71,111,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
        {
          id: "orange",
          left: 120,
          top: 690,
          width: 1200,
          height: 620,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1200 620' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(3.6739e-15 31 -60 1.8982e-15 600 310)'><stop stop-color='rgba(107,91,131,0.28)' offset='0'/><stop stop-color='rgba(64,81,111,0.16)' offset='0.48'/><stop stop-color='rgba(64,81,111,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
        {
          id: "blue",
          left: -380,
          top: 300,
          width: 620,
          height: 780,
          gradient:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 620 780' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.8982e-15 39 -31 2.3881e-15 310 390)'><stop stop-color='rgba(23,59,105,0.1)' offset='0'/><stop stop-color='rgba(23,59,105,0.05)' offset='0.55'/><stop stop-color='rgba(23,59,105,0)' offset='1'/></radialGradient></defs></svg>\")",
        },
      ],
    },
  },
}

/**
 * Desktop Player gradient hierarchy — one 3-stop spectrum per mood, used
 * at decreasing strength: Play (full), artwork edge (soft), selected states
 * (faint edge), volume (flat `mid`). Stops reuse existing tokens where they
 * exist; the two marked "derived" are new in-between hues the requested
 * direction needed. Interpolated `in oklab` for smooth, banding-free blends.
 *
 * - Happy (coral → magenta → warm violet): `#eb6e51` (Happy's own coral),
 *   `#c43a86` (MoodPlayer's original Figma CTA magenta), `#7458b8`
 *   (`--color-cta-button-via`).
 * - Melancholic (slate blue → violet → muted cyan): `#4a4f9f` and `#6b6dc8`
 *   (Melancholic's own stops), `#6f9cbf` (derived muted cyan).
 * - Chill (magenta → violet → blue): the original Chill colours — the
 *   universal Mood Gradient Chill always used on the Player
 *   (`--color-cta-button-from/via/to`: `#a64ca6`, `#7458b8`, `#5576d8`),
 *   with violet as the `mid` so blue never dominates.
 */
export type MoodSpectrum = { start: string; mid: string; end: string }

export const PLAYER_SPECTRUM: Record<MoodId, MoodSpectrum> = {
  happy: { start: "#eb6e51", mid: "#c43a86", end: "#7458b8" },
  melancholic: { start: "#4a4f9f", mid: "#6b6dc8", end: "#6f9cbf" },
  chill: { start: "#a64ca6", mid: "#7458b8", end: "#5576d8" },
}

/** `strength` < 1 fades every stop toward transparent (for the softer
 *  artwork / selected-state edges) without changing the hues. */
export function spectrumGradient(spectrum: MoodSpectrum, strength = 1, angle = 105) {
  const stop = (color: string) =>
    strength >= 1 ? color : `color-mix(in oklab, ${color} ${Math.round(strength * 100)}%, transparent)`
  return `linear-gradient(${angle}deg in oklab, ${stop(spectrum.start)} 0%, ${stop(spectrum.mid)} 50%, ${stop(spectrum.end)} 100%)`
}

/**
 * Desktop Play button's liquid gradient (`.play-liquid` in `index.css`) —
 * Play only; every other desktop gradient keeps `PLAYER_SPECTRUM`.
 * Happy uses its original approved Play gradient stops verbatim
 * (`PLAYER_MOOD_ACCENTS.happy.gradient`, Figma Desktop `284:5276`:
 * orange → coral → red), so the moving Play still reads as the original
 * Happy theme. Melancholic and Chill keep their `PLAYER_SPECTRUM` stops.
 */
export const PLAY_LIQUID: Record<MoodId, MoodSpectrum> = {
  happy: { start: "#f1a04e", mid: "#eb6e51", end: "#e54d56" },
  melancholic: PLAYER_SPECTRUM.melancholic,
  chill: PLAYER_SPECTRUM.chill,
}

/** `PLAY_LIQUID` colours as the `--liquid-a/b/c` CSS variables read by
 *  `.liquid-soft` (`index.css`) — the desktop artwork border and volume
 *  fill. */
export function liquidVars(liquid: MoodSpectrum) {
  return {
    "--liquid-a": liquid.start,
    "--liquid-b": liquid.mid,
    "--liquid-c": liquid.end,
  } as Record<string, string>
}
