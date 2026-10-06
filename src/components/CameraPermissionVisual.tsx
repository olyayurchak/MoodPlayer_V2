import { useEffect, useRef } from "react"
import ellipse23Mobile from "../imports/CameraPermission/ellipse-23-mobile.svg"
import ellipse24Mobile from "../imports/CameraPermission/ellipse-24-mobile.svg"
import ellipse25Mobile from "../imports/CameraPermission/ellipse-25-mobile.svg"
import ellipse23Desktop from "../imports/CameraPermission/ellipse-23-desktop.svg"
import ellipse24Desktop from "../imports/CameraPermission/ellipse-24-desktop.svg"
import ellipse25Desktop from "../imports/CameraPermission/ellipse-25-desktop.svg"

/**
 * The camera-preview placeholder on the Camera Permission screen — a
 * rounded, bordered panel that will later host the user's live camera feed
 * once permission is granted. Redesigned per the approved Figma frames
 * `Mood Detection / Camera Permission`: Desktop `284:2422`/left-visual node
 * `347:336` (1440×1024, sourced via the newer `347:319` copy of this same
 * screen) and Mobile `287:6243`/left-visual node `347:372` (430×932). This
 * replaces the earlier static "note in a glass bubble" photo treatment
 * entirely — nothing from that version carries over, including its asset.
 *
 * Structure (identical intent on both breakpoints, only the values scale):
 * - the panel itself: now a borderless circle (`rounded-full` +
 *   `CIRCLE_FILL_STYLE`, same footprint as before), `overflow-hidden` so
 *   nothing below spills past its edge. It used to be a dark rounded rect
 *   ringed by a
 *   subtle-diagonal (`145deg`) *gradient* border (pink → purple → blue —
 *   the approved MoodPlayer palette, `BORDER_GRADIENT` below, the same
 *   colors every other gradient element in the app now uses). The
 *   design-context export only reports a single flat `#c43a86` (one stop
 *   of an earlier, since-superseded pink-dominant version of this
 *   gradient) because it has no "gradient border" output primitive — the
 *   same kind of lossy simplification that turned the corner marks below
 *   into a plain dashed rect. Implemented via the
 *   standard two-background-layer + `background-clip` technique (`style`
 *   prop, not Tailwind classes — this specific technique doesn't reduce
 *   cleanly to arbitrary utility syntax): a `border: <width> solid
 *   transparent` reserves the ring's width, one background layer painted
 *   only inside it (`background-clip: padding-box`) recreates the panel's
 *   own fill gradient, and a second layer painted across the *whole* box
 *   (`background-clip: border-box`) supplies the border's gradient, visible
 *   only where the transparent border leaves it uncovered by the first
 *   layer;
 * - three soft glow blobs — Figma's own exported blur SVGs, not a
 *   hand-rolled CSS blur. Each SVG's own canvas is intentionally larger
 *   than its visible glow (Figma bakes the blur filter into the export at
 *   a padded size), so each is wrapped in a box sized to the *visible*
 *   glow with a negative-inset child restoring the SVG's true, larger
 *   canvas at the right position — the exact technique Figma's own
 *   generated code uses, reproduced verbatim rather than approximated;
 * - the person + simulated face-mesh visual, filling the panel edge-to-edge
 *   (`object-cover`) — the `/vibe-result.mp4` decorative video
 *   (autoplaying, muted, inline, no controls, plays through once and holds
 *   on its final frame rather than looping; see the effect below for why
 *   it also respects `prefers-reduced-motion`), at its native full opacity.
 *   It has no `poster`: a `<video>` shows its poster until playback
 *   actually starts, so the earlier poster (the legacy static face-scan
 *   image) stayed visible on a slow load, a blocked/failed `play()`, a
 *   media error, or reduced motion. Now, while loading (or if the video
 *   fails), the orb's own dark fill, glows and glass show — the approved
 *   structure, empty — and whenever playback can't start (autoplay
 *   blocked, reduced motion) the browser shows the video's own first
 *   frame. The earlier static images, the "camera-off" glyph and the soft
 *   white overlay glow that used to sit in this layer are gone;
 * - no corner marks: the four viewfinder-style L-marks that used to frame a
 *   rectangular capture area were removed once the panel became a circle.
 *   `ScanningVisual`'s own corner marks (the active scan state) are separate
 *   and unaffected.
 *
 * Two independent trees (Mobile below `lg`, Desktop at `lg` and up) rather
 * than one tree with a `lg:` variant on every value — matches
 * `MoodBubbleCluster`'s own Mobile/Desktop split, and keeps each breakpoint
 * a direct, verifiable translation of its own Figma frame rather than an
 * interleaved merge of two different pixel sets.
 */
// The panel's own dark fill, unchanged from before — now painted as the
// *first* background layer (clipped to `padding-box`, i.e. only the area
// inside the border) rather than as the element's sole background.
const PANEL_FILL_GRADIENT =
  "linear-gradient(137.37deg, rgb(18,23,47) 1.76%, rgb(21,16,42) 49.85%, rgb(16,11,34) 97.95%)"
// The border's own gradient — the approved brand gradient
// (`#A64CA6 → #7458B8 → #5576D8`), painted as the *second* background
// layer (clipped to `border-box`, the full element) so it only shows
// through the transparent-bordered ring the first layer doesn't cover.
// Exported so other screens needing this exact "MoodPlayer gradient" as a
// border (`ScanningVisual`'s own panel, `VibeResultScreen`'s photo panel)
// reuse it verbatim rather than re-deriving the same stops — every large
// visual panel across the app now shares this single constant/value
// rather than each carrying its own recolor or its own angle. Direction
// is a subtle diagonal `145deg` (was a straight `180deg` top-to-bottom):
// an earlier task moved `VibeResultScreen`'s own panel to `145deg` first,
// via a one-off override passed into `gradientBorderStyle` below, while
// Camera Permission's and `ScanningVisual`'s panels stayed at the
// original `180deg`; now that every panel has approved the same diagonal,
// this constant itself was updated and that override mechanism removed
// as redundant.
export const BORDER_GRADIENT = "linear-gradient(145deg, #A64CA6, #7458B8, #5576D8)"

/** Shared by both breakpoints below, and by every large visual panel
 *  across the app (this component, `ScanningVisual`'s own panel,
 *  `VibeResultScreen`'s photo panel) — all now consistently `2px`, though
 *  the parameter stays generic (not hard-coded) since it's still each
 *  caller's own explicit choice, not a hidden assumption of this
 *  function. Exported so `ScanningVisual`/`VibeResultScreen` can reuse
 *  this exact panel-fill + gradient-border technique rather than
 *  duplicating it. */
export function gradientBorderStyle(borderWidth: string) {
  return {
    border: `${borderWidth} solid transparent`,
    backgroundImage: `${PANEL_FILL_GRADIENT}, ${BORDER_GRADIENT}`,
    backgroundOrigin: "border-box" as const,
    backgroundClip: "padding-box, border-box",
  }
}

// A later, explicit task's request: the decorative video should read as
// playing faster than its own natural speed, clearly enough for the
// speed increase itself to be perceptible (an audited 1.5x read as too
// subtle to notice). `HTMLMediaElement.playbackRate` (not a video
// re-export/re-encode) is the standard way to do this; it can be set at
// any point in the element's lifecycle, before or after playback actually
// starts, and the browser applies it once frames are actually rendered.
const PLAYBACK_RATE = 1.8

/** This pre-permission visual is a borderless circle: same panel fill as
 *  `gradientBorderStyle`, minus its gradient border. The shared helper itself
 *  is untouched — `ScanningVisual`, Vibe Result and Player still use it.
 *  `size-*` is a border-box size, so the outer footprint is unchanged.
 *  Also used by `ScanningVisual`, so the live scan sits in the same orb. */
export const CIRCLE_FILL_STYLE = { backgroundImage: PANEL_FILL_GRADIENT }

export default function CameraPermissionVisual() {
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null)
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null)

  // `autoPlay` alone doesn't respect `prefers-reduced-motion` — this pauses
  // both breakpoints' `<video>` elements (only one is ever visually shown,
  // but both are mounted, matching the Mobile/Desktop split below) whenever
  // the user has that preference set, and resumes them if it changes
  // mid-session. Mirrors the `matchMedia("(prefers-reduced-motion: reduce)")`
  // listener pattern `MoodBubbleCluster` already uses for its own motion,
  // rather than a new one-off approach.
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const videos = [mobileVideoRef.current, desktopVideoRef.current].filter(
      (video): video is HTMLVideoElement => video !== null,
    )

    function applyMotionPreference() {
      for (const video of videos) {
        if (reducedMotion.matches) {
          video.pause()
        } else {
          video.play().catch(() => {})
        }
      }
    }

    applyMotionPreference()
    reducedMotion.addEventListener("change", applyMotionPreference)
    return () => reducedMotion.removeEventListener("change", applyMotionPreference)
  }, [])

  // `PLAYBACK_RATE` applied here (on mount, to both refs directly) rather
  // than only via the `<video>` elements' own `onLoadedMetadata` below —
  // this covers the case where metadata is already loaded (e.g. cached)
  // by the time this effect runs, which `onLoadedMetadata` alone would
  // miss (that event only fires once, the first time metadata loads).
  // `onLoadedMetadata` stays too, as the reliable path for the normal
  // case where metadata *hasn't* loaded yet at mount — some browsers only
  // durably honor a `playbackRate` write once the media element has an
  // actual decoded source to apply it to, so setting it in just one place
  // isn't reliable across browsers/timings; both together are. Applying it
  // doesn't touch `loop`/`autoPlay`/`muted`/`playsInline`/`controls`, the
  // reduced-motion pause/resume above, or anything else about playback —
  // it only changes the rate frames advance at once playback is already
  // happening (or about to).
  useEffect(() => {
    for (const video of [mobileVideoRef.current, desktopVideoRef.current]) {
      if (video) video.playbackRate = PLAYBACK_RATE
    }
  }, [])

  return (
    <>
      {/* Mobile (below `lg`) — Figma node `347:372`. */}
      <div
        className="relative size-[224px] shrink-0 overflow-hidden rounded-full lg:hidden"
        style={CIRCLE_FILL_STYLE}
      >
        <video
          ref={mobileVideoRef}
          src="/vibe-result.mp4"
          autoPlay
          muted
          playsInline
          controls={false}
          aria-hidden="true"
          onLoadedMetadata={(event) => {
            event.currentTarget.playbackRate = PLAYBACK_RATE
          }}
          className="scanner-orb-media pointer-events-none absolute inset-0 size-full rounded-full object-cover"
        />
        <div className="absolute left-[-49.7px] top-[36.87px] size-[97.569px]">
          <div className="absolute inset-[-65.73%]">
            <img alt="" className="block size-full max-w-none" src={ellipse23Mobile} />
          </div>
        </div>
        <div className="absolute left-[166.97px] top-[100.09px] size-[97.569px]">
          <div className="absolute inset-[-75.12%]">
            <img alt="" className="block size-full max-w-none" src={ellipse24Mobile} />
          </div>
        </div>
        <div className="absolute left-[101px] top-[-61.15px] size-[123.221px]">
          <div className="absolute inset-[-59.48%]">
            <img alt="" className="block size-full max-w-none" src={ellipse25Mobile} />
          </div>
        </div>
        {/* Glass-orb treatment (`.scanner-orb-glass` in `index.css`) — topmost, static, edge-weighted so the face stays clear. */}
        <div aria-hidden="true" className="scanner-orb-glass" />
      </div>

      {/* Desktop (`lg` and up) — Figma node `347:336`. */}
      <div
        className="relative hidden size-[491px] shrink-0 overflow-hidden rounded-full lg:block"
        style={CIRCLE_FILL_STYLE}
      >
        <video
          ref={desktopVideoRef}
          src="/vibe-result.mp4"
          autoPlay
          muted
          playsInline
          controls={false}
          aria-hidden="true"
          onLoadedMetadata={(event) => {
            event.currentTarget.playbackRate = PLAYBACK_RATE
          }}
          className="scanner-orb-media pointer-events-none absolute inset-0 size-full rounded-full object-cover"
        />
        <div className="absolute left-[-108.5px] top-[77px] size-[213px]">
          <div className="absolute inset-[-65.73%]">
            <img alt="" className="block size-full max-w-none" src={ellipse23Desktop} />
          </div>
        </div>
        <div className="absolute left-[364.5px] top-[215px] size-[213px]">
          <div className="absolute inset-[-75.12%]">
            <img alt="" className="block size-full max-w-none" src={ellipse24Desktop} />
          </div>
        </div>
        <div className="absolute left-[220.5px] top-[-137px] size-[269px]">
          <div className="absolute inset-[-59.48%]">
            <img alt="" className="block size-full max-w-none" src={ellipse25Desktop} />
          </div>
        </div>
        {/* Glass-orb treatment (`.scanner-orb-glass` in `index.css`) — topmost, static, edge-weighted so the face stays clear. */}
        <div aria-hidden="true" className="scanner-orb-glass" />
      </div>
    </>
  )
}
