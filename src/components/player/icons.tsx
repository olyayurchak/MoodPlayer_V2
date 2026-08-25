/**
 * Player transport-control glyphs.
 *
 * Shuffle / Previous / Next / Repeat below are now the *exact* paths
 * exported from the approved Figma Player frames' own icon layers
 * ("Icon - Shuffle" `289:7719`, "Icon - Previous" `289:7729`, "Icon - Bold"
 * `289:7737`, "Icon - Repeat Music" `289:7743` — identical on both Mobile
 * and Desktop frames), fetched via Figma's own SVG export rather than
 * hand-approximated. An earlier version of this file redrew these by hand
 * (a single merged arrow+line stroke for Shuffle/Repeat, a thin stroked
 * line + a small triangle for Previous/Next) — visibly thinner/smaller
 * than Figma's actual geometry, which is exactly the "too little visual
 * area" / "too thin and weak" mismatch this task set out to fix. Every
 * `stroke`/`fill` below is `currentColor`, not Figma's own literal export
 * color (`#CFCFCF` stroke / `white` fill) — this app's existing
 * active/inactive color-driving (`PlayerControls.tsx`'s `ACTIVE_ACCENT_CLASS`
 * on Shuffle/Repeat, plain `text-white` otherwise) still has to work, and
 * hardcoding Figma's own literal colors here would silently break that
 * already-approved behavior. `viewBox`/coordinate geometry is otherwise
 * untouched from the export.
 *
 * Play/Pause remain hand-authored (see their own doc comment below) — the
 * approved Figma reference for that control (`289:7734`/`290:9547`, a
 * 76px circle) is a single flattened raster image with no separate vector
 * icon layer to export, unlike the other four.
 *
 * Every icon shares the same `size` prop convention (pixel number,
 * default matching each icon's own native viewBox) and is purely
 * decorative (`aria-hidden`) — the *button* wrapping each one carries the
 * real accessible name (see `PlayerControls.tsx`). Nominal `size` values
 * are unchanged from before this task (already confirmed, in an earlier
 * task, to match Figma's own icon-layer dimensions) — only the internal
 * path/stroke geometry changed.
 */
type IconProps = { size?: number; className?: string }

export function ShuffleIcon({ size = 20, className }: IconProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M2.5 14.9829L4.62499 14.9913C5.38332 14.9913 6.09166 14.6163 6.50833 13.9913L11.8333 6.00796C12.25 5.38296 12.9583 4.99961 13.7167 5.00795L17.5083 5.02463"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.834 16.6491L17.5007 14.9824"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.40835 7.18327L6.50833 5.93327C6.08333 5.3416 5.39999 4.99161 4.67499 4.99994L2.5 5.00828"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.8086 12.8164L11.8253 14.1247C12.2503 14.6747 12.9169 14.9997 13.6169 14.9997L17.5086 14.9831"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5007 5.01628L15.834 3.34961"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PreviousIcon({ size = 24, className }: IconProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3.75977 18.9303C3.34977 18.9303 3.00977 18.5903 3.00977 18.1803V5.82031C3.00977 5.41031 3.34977 5.07031 3.75977 5.07031C4.16977 5.07031 4.50977 5.41031 4.50977 5.82031V18.1803C4.50977 18.5903 4.16977 18.9303 3.75977 18.9303Z"
        fill="currentColor"
      />
      <path
        d="M20.239 7.21957V16.7896C20.239 18.7496 18.109 19.9796 16.409 18.9996L12.259 16.6096L8.10898 14.2096C6.40898 13.2296 6.40898 10.7796 8.10898 9.79957L12.259 7.39957L16.409 5.00957C18.109 4.02957 20.239 5.24957 20.239 7.21957Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function NextIcon({ size = 24, className }: IconProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3.75977 7.21957V16.7896C3.75977 18.7496 5.88977 19.9796 7.58977 18.9996L11.7398 16.6096L15.8898 14.2096C17.5898 13.2296 17.5898 10.7796 15.8898 9.79957L11.7398 7.39957L7.58977 5.00957C5.88977 4.02957 3.75977 5.24957 3.75977 7.21957Z"
        fill="currentColor"
      />
      <path
        d="M20.2402 18.9303C19.8302 18.9303 19.4902 18.5903 19.4902 18.1803V5.82031C19.4902 5.41031 19.8302 5.07031 20.2402 5.07031C20.6502 5.07031 20.9902 5.41031 20.9902 5.82031V18.1803C20.9902 18.5903 20.6602 18.9303 20.2402 18.9303Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function RepeatIcon({ size = 20, className }: IconProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M11.6665 2.5L13.6998 4.45002L7.07479 4.43334C4.09979 4.43334 1.65812 6.87502 1.65812 9.86669C1.65812 11.3584 2.26645 12.7167 3.24978 13.7"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33412 17.5008L6.30078 15.5508L12.9258 15.5674C15.9008 15.5674 18.3424 13.1258 18.3424 10.1341C18.3424 8.64243 17.7341 7.28411 16.7508 6.30078"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** The bigger center transport button's own glyph. The approved Figma
 *  reference for this control (`289:7734`/`290:9547`) is a single
 *  flattened 76px raster image — unlike Shuffle/Previous/Next/Repeat
 *  above, there is no separate vector icon layer inside it to export, so
 *  this remains hand-authored (same rounded-triangle shape/style
 *  `PlayIconGlow` already uses elsewhere in the app, re-authored at this
 *  control's own viewBox/scale since that component bundles its own
 *  circular backdrop, which this button supplies separately).
 *
 *  Visually comparing this shape against the Figma reference image showed
 *  its triangle reads noticeably chunkier/larger relative to the circle
 *  than this glyph's original (unscaled) proportions did. Rather than
 *  bump the `size` prop (which would also grow the glyph's own bounding
 *  box/padding, not just its visible ink), the exact original path is
 *  scaled up in place — preserving its precise rounded-corner shape and
 *  center point, just larger, closer to the reference's own visual
 *  weight. Composed as `translate(14 14) scale(K) translate(-14 -14)`
 *  (SVG `transform` lists apply right-to-left) rather than the CSS
 *  `transform-origin` property/attribute, which has inconsistent support
 *  on SVG `<path>` presentation attributes across engines — this
 *  translate/scale/translate composition scales about the 28px box's own
 *  center (14, 14) using only baseline `transform` matrix math, so it
 *  works identically everywhere.
 *
 *  `K` started at `1.28` (an earlier task), then `1.45`, then `1.55`
 *  (each still read as too small against the Figma reference), and is
 *  now `1.65`. Checked against clipping each time: the unscaled path's
 *  own bounding box is roughly x:[10.25, 21.05] y:[7.87, 20.14] (a
 *  10.8×12.27 box, off-center within the 28×28 viewBox toward the
 *  bottom-right, matching a right-pointing play triangle's own
 *  asymmetric shape). Scaled by `1.65` about the (14, 14) center, that
 *  lands at roughly x:[7.8, 25.6] y:[3.9, 24.1] — still inside the
 *  28×28 box on every side, though the margin is narrowing (≈2.4–3.9px
 *  left/right/top/bottom) — any further increase from here should
 *  re-check this margin carefully rather than assume it still holds. */
export function PlayGlyph({ size = 28, className }: IconProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M20.417 12.926 12.234 8.04c-.834-.497-1.984.117-1.984 1.074v9.772c0 .958 1.15 1.572 1.984 1.074l8.183-4.885a1.226 1.226 0 0 0 0-2.148Z"
        fill="currentColor"
        transform="translate(14 14) scale(1.65) translate(-14 -14)"
      />
    </svg>
  )
}

/** Bars widened/heightened to match `PlayGlyph`'s own enlarged visual
 *  weight above (still hand-authored, same reasoning — no separate Pause
 *  vector layer exists in Figma's flattened Play/Pause asset either),
 *  rather than left at their previous, comparatively slighter size. */
export function PauseGlyph({ size = 28, className }: IconProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x={7} y={6} width={5} height={16} rx={1.5} fill="currentColor" />
      <rect x={16} y={6} width={5} height={16} rx={1.5} fill="currentColor" />
    </svg>
  )
}

export function VolumeIcon({ size = 20, className, muted = false }: IconProps & { muted?: boolean }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M2.5 7.5h2.917L9.375 4.17a.417.417 0 0 1 .625.36v11.14a.417.417 0 0 1-.625.361L5.417 12.5H2.5a.417.417 0 0 1-.417-.417v-4.166c0-.23.187-.417.417-.417Z"
        fill="currentColor"
      />
      {!muted && (
        <path
          d="M13.5 7.083a4.167 4.167 0 0 1 0 5.834"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      )}
      {muted && (
        <path d="m14.5 8 4 4m0-4-4 4" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
      )}
    </svg>
  )
}
