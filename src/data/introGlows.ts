/**
 * Ambient background glow layers.
 *
 * Each `gradient` string is the exact radial-gradient payload exported from the
 * approved Figma frames — copied verbatim so no color, stop, or geometry value
 * is re-derived. Positions are in frame pixels relative to the frame's top-left
 * corner (Mobile 430x932, Desktop 1440x1024).
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
      "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 360 940' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.1022e-15 47 -18 2.8779e-15 180 470)'><stop stop-color='rgba(87,32,111,0.5)' offset='0'/><stop stop-color='rgba(87,32,111,0.22)' offset='0.5'/><stop stop-color='rgba(87,32,111,0)' offset='1'/></radialGradient></defs></svg>\")",
  },
  {
    id: "magenta",
    left: 28,
    top: 650,
    width: 380,
    height: 500,
    gradient:
      "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 380 500' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.1634e-15 25 -19 1.5308e-15 190 250)'><stop stop-color='rgba(138,37,95,0.38)' offset='0'/><stop stop-color='rgba(110,29,85,0.18)' offset='0.48'/><stop stop-color='rgba(110,29,85,0)' offset='1'/></radialGradient></defs></svg>\")",
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
      "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1040 1120' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(3.1841e-15 56 -52 3.429e-15 520 560)'><stop stop-color='rgba(87,32,111,0.5)' offset='0'/><stop stop-color='rgba(87,32,111,0.22)' offset='0.55'/><stop stop-color='rgba(87,32,111,0)' offset='1'/></radialGradient></defs></svg>\")",
  },
  {
    id: "magenta",
    left: 120,
    top: 690,
    width: 1200,
    height: 620,
    gradient:
      "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1200 620' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(3.6739e-15 31 -60 1.8982e-15 600 310)'><stop stop-color='rgba(138,37,95,0.38)' offset='0'/><stop stop-color='rgba(110,29,85,0.18)' offset='0.48'/><stop stop-color='rgba(110,29,85,0)' offset='1'/></radialGradient></defs></svg>\")",
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
]
