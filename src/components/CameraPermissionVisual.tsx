import faceScanVisual from "../imports/CameraPermission/face-scan-visual-v2.png"
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
 * - the person + simulated face-mesh visual, filling the panel edge-to-edge
 *   (`object-cover`) — now `face-scan-visual-v2.png`, the raw image fill
 *   exported directly from Figma node `450:302` (491×491, the same
 *   square size as the Desktop panel, so `object-cover` doesn't need to
 *   crop it there — only Mobile's smaller 224×224 box crops it, exactly
 *   the same responsive behavior the previous asset already had). A
 *   later, explicit task replaced the original `face-scan-visual.png`
 *   (sourced from node `398:11261`, still present in
 *   `imports/CameraPermission/` but no longer referenced here — not
 *   deleted, matching this file's own established precedent below for a
 *   superseded asset) with this newer node's own export — a different
 *   render of the same subject/style, not a re-crop or recolor of the
 *   old one. Opacity is `60%`, again a later explicit request (not
 *   itself sourced from Figma, whose own export for this node applies no
 *   opacity adjustment to the layer). Replaces the earlier small centered
 *   "camera-off" glyph entirely (that SVG,
 *   `camera-off-icon.svg`, is still present in `imports/CameraPermission/`
 *   but no longer referenced here — not deleted, matching this file's own
 *   established precedent for a superseded asset, e.g. `camera-icon.png`
 *   from the redesign before this one) — and replaces the soft white
 *   overlay glow that used to sit in this same layer position (a plain
 *   translucent+blurred rounded square this component previously painted
 *   here): that overlay washed this new image out to a flat, low-contrast
 *   haze rather than reading as the intended darker/purple atmosphere, so
 *   it's removed rather than layered underneath;
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
 *   metadata's literal rectangle. Desktop's vertical position (`top`) was
 *   re-measured against node `398:11261`'s own screenshot for this task —
 *   its raw rect metadata (`top: 40`, vs. this file's previous `43.5`) and
 *   a direct pixel scan of its screenshot (the corner mark's actual arm
 *   starts ≈y=41-42) agree closely, so Desktop's `top` moved from `43.5`
 *   to `40` (and the mirrored bottom marks from `346.5` to `343`, same
 *   303px span) to match; `left`/`345.5` (horizontal) is unchanged — this
 *   node's own rect metadata places it at the same `42.5`/`345.5` this
 *   file already had. Mobile has no equivalent fresh reference in this
 *   task, so its corner-mark position is intentionally left as-is;
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
// (`#A64CA6 → #7458B8 → #5576D8`), top-to-bottom, painted as the *second*
// background layer (clipped to `border-box`, the full element) so it
// only shows through the transparent-bordered ring the first layer
// doesn't cover. Exported so other screens needing this exact "MoodPlayer
// gradient" as a border (`ScanningVisual`'s own panel, `VibeResultScreen`'s
// photo panel) reuse it verbatim rather than re-deriving the same stops —
// every one of them now shares this single constant/value rather than
// each carrying its own recolor: an earlier, Camera-Permission-only
// update briefly routed through a separate `CAMERA_PERMISSION_BORDER_
// GRADIENT` while only this screen had approved the new gradient; now
// that every panel wants it, that override was removed as redundant.
export const BORDER_GRADIENT = "linear-gradient(180deg, #A64CA6, #7458B8, #5576D8)"

/** Shared by both breakpoints below — the face-recognition panel (this
 *  component and `ScanningVisual`, its post-permission scanning-state
 *  twin) uses `2px` at both Mobile and Desktop; `VibeResultScreen`'s own
 *  panel calls this same helper with its own independent value (`1.5px`)
 *  since it's a different, non-face-recognition panel, not part of this
 *  border-thickness requirement. The parameter stays generic rather than
 *  hard-coding either value here. Exported so `ScanningVisual` can reuse
 *  this exact panel-fill + gradient-border treatment rather than
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
        style={gradientBorderStyle("2px")}
      >
        <img
          alt=""
          className="pointer-events-none absolute inset-0 size-full rounded-[10.994px] object-cover opacity-[0.55]"
          src={faceScanVisual}
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
        <img
          alt=""
          className="pointer-events-none absolute inset-0 size-full rounded-[24px] object-cover opacity-[0.55]"
          src={faceScanVisual}
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
        {/* Corner marks: 3px / 40% opacity (Desktop uses a thicker line than
            Mobile's 1.2px) — see the Mobile tree's own note above for the
            pre-permission vs. scanning distinction this reflects. */}
        <div className="absolute left-[42.5px] top-[40px] size-[100px] border-t-[3px] border-l-[3px] border-white/40" />
        <div className="absolute left-[345.5px] top-[40px] size-[100px] border-t-[3px] border-r-[3px] border-white/40" />
        <div className="absolute left-[42.5px] top-[343px] size-[100px] border-b-[3px] border-l-[3px] border-white/40" />
        <div className="absolute left-[345.5px] top-[343px] size-[100px] border-b-[3px] border-r-[3px] border-white/40" />
      </div>
    </>
  )
}
