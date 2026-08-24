/**
 * Ambient background glow layers — shared by every screen that renders
 * `AppBackground` (Intro, Camera Permission/Scanning, Vibe Result).
 *
 * Positions/sizes/blur are in frame pixels relative to the frame's
 * top-left corner (Mobile 430x932, Desktop 1440x1024), copied verbatim
 * from the approved Figma frames — no geometry value is re-derived.
 *
 * Colors are the approved cooler navy/violet/indigo balance (a later,
 * explicit request to move away from the original frames' more
 * pink-dominant palette): "navy" is unchanged from Figma's own export
 * (`#172044`, already the coolest/most neutral of the four and not part
 * of the requested repaint); "purple" is now violet `#624FA8`; "blue" is
 * now indigo `#435EB8`; "magenta" is now `#8A4B91`, with its two opacity
 * stops also nudged down a little (`0.38→0.30`, `0.18→0.14`) per this
 * palette's own explicit "keep it subtle" requirement for that one color
 * — the one deliberate opacity adjustment among an otherwise color-only
 * change. Every other stop-opacity/offset and all geometry stayed
 * exactly as approved.
 *
 * This one shared array (per breakpoint) is the *only* copy of this
 * data — no screen keeps its own recolor of it. An Intro-only variant of
 * this same palette existed briefly as a separate override, applied via
 * `AppBackground`'s own `mobileOverrides`/`desktopOverrides` props, while
 * only Intro had approved the new colors; now that every screen using
 * `AppBackground` shares them, that override mechanism and the
 * Intro-only color set it carried were removed as redundant rather than
 * left in place unused.
 */
export type GlowSpec = {
  id: string
  left: number
  top: number
  width: number
  height: number
  gradient: string
}

export const mobileGlows: GlowSpec[] = [
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
    id: "purple",
    left: 238,
    top: -28,
    width: 360,
    height: 940,
    gradient:
      "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 360 940' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.1022e-15 47 -18 2.8779e-15 180 470)'><stop stop-color='rgba(98,79,168,0.5)' offset='0'/><stop stop-color='rgba(98,79,168,0.22)' offset='0.5'/><stop stop-color='rgba(98,79,168,0)' offset='1'/></radialGradient></defs></svg>\")",
  },
  {
    id: "magenta",
    left: 28,
    top: 650,
    width: 380,
    height: 500,
    gradient:
      "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 380 500' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.1634e-15 25 -19 1.5308e-15 190 250)'><stop stop-color='rgba(138,75,145,0.30)' offset='0'/><stop stop-color='rgba(110,60,116,0.14)' offset='0.48'/><stop stop-color='rgba(110,60,116,0)' offset='1'/></radialGradient></defs></svg>\")",
  },
  {
    id: "blue",
    left: -112,
    top: 272,
    width: 380,
    height: 500,
    gradient:
      "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 380 500' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.1634e-15 25 -19 1.5308e-15 190 250)'><stop stop-color='rgba(67,94,184,0.1)' offset='0'/><stop stop-color='rgba(67,94,184,0.05)' offset='0.55'/><stop stop-color='rgba(67,94,184,0)' offset='1'/></radialGradient></defs></svg>\")",
  },
]

export const desktopGlows: GlowSpec[] = [
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
    id: "purple",
    left: 820,
    top: -40,
    width: 1040,
    height: 1120,
    gradient:
      "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1040 1120' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(3.1841e-15 56 -52 3.429e-15 520 560)'><stop stop-color='rgba(98,79,168,0.5)' offset='0'/><stop stop-color='rgba(98,79,168,0.22)' offset='0.55'/><stop stop-color='rgba(98,79,168,0)' offset='1'/></radialGradient></defs></svg>\")",
  },
  {
    id: "magenta",
    left: 120,
    top: 690,
    width: 1200,
    height: 620,
    gradient:
      "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1200 620' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(3.6739e-15 31 -60 1.8982e-15 600 310)'><stop stop-color='rgba(138,75,145,0.30)' offset='0'/><stop stop-color='rgba(110,60,116,0.14)' offset='0.48'/><stop stop-color='rgba(110,60,116,0)' offset='1'/></radialGradient></defs></svg>\")",
  },
  {
    id: "blue",
    left: -380,
    top: 300,
    width: 620,
    height: 780,
    gradient:
      "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 620 780' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.8982e-15 39 -31 2.3881e-15 310 390)'><stop stop-color='rgba(67,94,184,0.1)' offset='0'/><stop stop-color='rgba(67,94,184,0.05)' offset='0.55'/><stop stop-color='rgba(67,94,184,0)' offset='1'/></radialGradient></defs></svg>\")",
  },
]
