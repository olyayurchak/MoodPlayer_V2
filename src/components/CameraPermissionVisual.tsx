import cameraOffIcon from "../imports/CameraPermission/camera-off-icon.svg"
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
 * - the panel itself: a dark diagonal-gradient rounded rect,
 *   `overflow-hidden` so nothing below spills past its corners, ringed by a
 *   top-to-bottom *gradient* border (pink → purple → blue — the same
 *   `--color-cta-from/via/to` tokens the CTA gradient already uses,
 *   confirmed by sampling the approved screenshot's actual border pixels:
 *   pink at the top edge, blue-purple at the bottom, purple in between).
 *   The design-context export only reports a single flat `#c43a86` (that
 *   gradient's own first stop) because it has no "gradient border" output
 *   primitive — the same kind of lossy simplification that turned the
 *   corner marks below into a plain dashed rect. Implemented via the
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
 * - one soft white overlay glow (a plain translucent+blurred rounded
 *   square, not an image — Figma's own layer, despite its stale
 *   "ChatGPT Image…" name, is just `rgba(255,255,255,0.24)` blurred);
 * - four corner marks (plain solid two-sided-border squares, no fill, no
 *   `border-dashed`) — a viewfinder-style framing cue for where the eventual
 *   live feed will sit. Figma's own metadata reports this as a single
 *   403×403 (Desktop) / 184×184 (Mobile) dashed-border rect, but the
 *   design's actual rendered screenshot shows only four short L-shaped
 *   marks at that rect's corners, not a continuous frame — a generic
 *   "dashed border" is the closest single-property approximation Figma's
 *   own export made of a stroke style it can't otherwise describe, so the
 *   screenshot (measured directly, arm length ≈100px of the 403px Desktop
 *   box, scaled proportionally for Mobile) is followed here instead of the
 *   metadata's literal rectangle;
 * - the camera-icon placeholder graphic itself, centered — a "camera-off"
 *   glyph (Figma component `camera_15846506 1`), one shared vector SVG
 *   used at both breakpoints' own container size rather than two
 *   per-frame exports, since as a vector it scales losslessly (unlike the
 *   three glow SVGs above, which really are baked-blur raster-equivalent
 *   exports at each breakpoint's own scale and can't be shared this way).
 *   The dimmed look isn't a CSS opacity on this wrapper — Figma's own
 *   export has none — it's `fill-opacity="0.4"` baked into the SVG's own
 *   paths, so this component doesn't add any opacity styling here either.
 *   Node ids `360:402` (Desktop, 116×116) / `360:391` (Mobile, 68×68) —
 *   both instances of the same component, confirmed via `get_design_context`
 *   on the current Figma frames. Replaces an earlier plain-camera PNG
 *   (`camera-icon.png`, still present in `imports/CameraPermission/` but
 *   unused as of this change — not deleted per this milestone's scope).
 *
 * Two independent trees (Mobile below `lg`, Desktop at `lg` and up) rather
 * than one tree with a `lg:` variant on every value — matches
 * `MoodBubbleCluster`'s own Mobile/Desktop split, and keeps each breakpoint
 * a direct, verifiable translation of its own Figma frame rather than an
 * interleaved merge of two different pixel sets. Each breakpoint's paint
 * order (corner marks vs. camera icon) is kept exactly as Figma has it,
 * even though the two frames don't agree on it — with the marks carrying no
 * fill, the difference is not visually significant, so it's preserved
 * rather than "corrected" to match.
 */
// The panel's own dark fill, unchanged from before — now painted as the
// *first* background layer (clipped to `padding-box`, i.e. only the area
// inside the border) rather than as the element's sole background.
const PANEL_FILL_GRADIENT =
  "linear-gradient(137.37deg, rgb(18,23,47) 1.76%, rgb(21,16,42) 49.85%, rgb(16,11,34) 97.95%)"
// The border's own gradient — the same `--color-cta-from/via/to` stops the
// CTA gradient uses, top-to-bottom, painted as the *second* background
// layer (clipped to `border-box`, the full element) so it only shows
// through the transparent-bordered ring the first layer doesn't cover.
const BORDER_GRADIENT = "linear-gradient(180deg, #c43a86, #963a9a, #5c63c8)"

/** Shared by both breakpoints below — only the border width differs.
 *  Exported so `ScanningVisual` (the post-permission scanning state) can
 *  reuse this exact panel-fill + gradient-border treatment rather than
 *  duplicating the technique. */
export function gradientBorderStyle(borderWidth: string) {
  return {
    border: `${borderWidth} solid transparent`,
    backgroundImage: `${PANEL_FILL_GRADIENT}, ${BORDER_GRADIENT}`,
    backgroundOrigin: "border-box" as const,
    backgroundClip: "padding-box, border-box",
  }
}

export default function CameraPermissionVisual() {
  return (
    <>
      {/* Mobile (below `lg`) — Figma node `347:372`. */}
      <div
        className="relative size-[224px] shrink-0 overflow-hidden rounded-[11px] lg:hidden"
        style={gradientBorderStyle("1px")}
      >
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
        <div className="absolute left-[calc(50%+0.68px)] top-[calc(50%+0.23px)] size-[229.035px] -translate-x-1/2 -translate-y-1/2 rounded-[10.994px] bg-[rgba(255,255,255,0.24)] blur-[2.748px]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[68px] -translate-x-1/2 -translate-y-1/2 overflow-clip">
          <div className="absolute inset-[1.12%_0_0.06%_0]">
            <img alt="" className="pointer-events-none absolute inset-0 block size-full max-w-none" src={cameraOffIcon} />
          </div>
        </div>
        {/* Corner marks: 1.2px / 40% opacity here (Mobile, pre-permission,
            "inactive") vs. 1.2px / 100% opacity in `ScanningVisual`'s
            Mobile tree (active scanning) — Desktop uses a thicker 3px in
            both files instead (see that tree's own corner marks below) —
            the same lengths/positions/geometry across every combination,
            just this thickness+opacity pair distinguishing state, and
            thickness alone distinguishing breakpoint. */}
        <div className="absolute left-[19.31px] top-[19.31px] size-[45.66px] border-t-[1.2px] border-l-[1.2px] border-white/40" />
        <div className="absolute left-[157.65px] top-[19.31px] size-[45.66px] border-t-[1.2px] border-r-[1.2px] border-white/40" />
        <div className="absolute left-[19.31px] top-[157.65px] size-[45.66px] border-b-[1.2px] border-l-[1.2px] border-white/40" />
        <div className="absolute left-[157.65px] top-[157.65px] size-[45.66px] border-b-[1.2px] border-r-[1.2px] border-white/40" />
      </div>

      {/* Desktop (`lg` and up) — Figma node `347:336`. */}
      <div
        className="relative hidden size-[491px] shrink-0 overflow-hidden rounded-[24px] lg:block"
        style={gradientBorderStyle("2px")}
      >
        <div className="absolute left-[-108.5px] top-[80.5px] size-[213px]">
          <div className="absolute inset-[-65.73%]">
            <img alt="" className="block size-full max-w-none" src={ellipse23Desktop} />
          </div>
        </div>
        <div className="absolute left-[364.5px] top-[218.5px] size-[213px]">
          <div className="absolute inset-[-75.12%]">
            <img alt="" className="block size-full max-w-none" src={ellipse24Desktop} />
          </div>
        </div>
        <div className="absolute left-[220.5px] top-[-133.5px] size-[269px]">
          <div className="absolute inset-[-59.48%]">
            <img alt="" className="block size-full max-w-none" src={ellipse25Desktop} />
          </div>
        </div>
        <div className="absolute left-[calc(50%+0.5px)] top-[calc(50%-0.5px)] size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-[rgba(255,255,255,0.24)] blur-[6px]" />
        {/* Corner marks: 3px / 40% opacity (Desktop uses a thicker line than
            Mobile's 1.2px) — see the Mobile tree's own note above for the
            pre-permission vs. scanning distinction this reflects. */}
        <div className="absolute left-[42.5px] top-[43.5px] size-[100px] border-t-[3px] border-l-[3px] border-white/40" />
        <div className="absolute left-[345.5px] top-[43.5px] size-[100px] border-t-[3px] border-r-[3px] border-white/40" />
        <div className="absolute left-[42.5px] top-[346.5px] size-[100px] border-b-[3px] border-l-[3px] border-white/40" />
        <div className="absolute left-[345.5px] top-[346.5px] size-[100px] border-b-[3px] border-r-[3px] border-white/40" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[116px] -translate-x-1/2 -translate-y-1/2 overflow-clip">
          <div className="absolute inset-[1.12%_0_0.06%_0]">
            <img alt="" className="pointer-events-none absolute inset-0 block size-full max-w-none" src={cameraOffIcon} />
          </div>
        </div>
      </div>
    </>
  )
}
