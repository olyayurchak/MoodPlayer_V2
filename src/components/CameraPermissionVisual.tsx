import { useEffect, useRef } from "react"
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
 *   (`object-cover`) — now the `/vibe-result.mp4` decorative video
 *   (autoplaying, muted, inline, no controls, plays through once and holds
 *   on its final frame rather than looping; see the effect below for why
 *   it also respects `prefers-reduced-motion`), replacing the earlier
 *   static `face-scan-visual-v2.png` image fill entirely. That still image
 *   (exported from Figma node `450:302`, 491×491, the same square size as
 *   the Desktop panel) is kept on as the video's own `poster` — shown
 *   instantly on first paint so the panel never flashes blank while the
 *   video itself loads, exactly the role it played as the sole visual
 *   before. It, in turn, had replaced the original `face-scan-visual.png`
 *   (sourced from node `398:11261`, still present in
 *   `imports/CameraPermission/` but no longer referenced here — not
 *   deleted, matching this file's own established precedent below for a
 *   superseded asset) — a different render of the same subject/style, not
 *   a re-crop or recolor of the old one. That still image's own `opacity-50`
 *   (carried over onto the video unchanged when the video first replaced
 *   it) was later removed again, per a follow-up, explicit request — a
 *   50%-opacity still image read as an intentionally moody, low-contrast
 *   graphic, but the same 50% opacity on a full-motion video read as
 *   visibly faded/washed-out instead (constant partial transparency is far
 *   more noticeable across genuine motion than across one static frame),
 *   so the video now renders at its native full opacity; nothing else
 *   about it changed. Replaces the earlier small
 *   centered "camera-off" glyph entirely (that SVG,
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
 *   task, so its corner-mark position is intentionally left as-is.
 *
 *   A later, explicit task shortened Desktop's arm length from `100px` to
 *   `62px` (≈38% shorter, inside the requested 35–40%/60–65px range) so
 *   the marks read as a lighter, less "actively scanning" framing cue —
 *   they're only meant to suggest a scan *area* on this pre-permission
 *   screen, unlike `ScanningVisual`'s own full-opacity corner marks during
 *   a real scan. Each corner mark's own true vertex — the point where its
 *   two border sides actually meet (`top`/`left` for the top-left mark,
 *   `left + size`/`top` for top-right, `top + size`/`left` for
 *   bottom-left, `left + size`/`top + size` for bottom-right) — is kept
 *   fixed at exactly its previous position; only the `size` shrinks, so
 *   the marks still frame the same panel corners, just with a shorter
 *   reach inward. Concretely: the two `top`-anchored marks keep their
 *   `top` unchanged and the two `left`-anchored marks keep their `left`
 *   unchanged; the opposite offset (`left` for the right-side marks,
 *   `top` for the bottom marks) is recomputed as `old-offset + old-size -
 *   new-size` to hold that same vertex fixed. Stroke thickness (`3px`)
 *   and opacity (`40%`, `border-white/40` — already the requested value,
 *   unchanged) are both left as they were; `3px` didn't read as
 *   disproportionately heavy against the shorter `62px` arm, so it wasn't
 *   thinned. Mobile's own arms were scaled by that same ~38% factor
 *   applied to its *existing* size (`45.66px → 28.31px`) rather than
 *   re-deriving a Desktop-relative ratio from scratch — matching this
 *   file's own established Mobile/Desktop scaling precedent (the two
 *   already differ by roughly the same 224:491 panel-size ratio) — with
 *   its own vertices held fixed by the identical position-recompute rule;
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
// playing very slightly faster than its own natural speed — subtle, not a
// noticeably sped-up effect. `HTMLMediaElement.playbackRate` (not a video
// re-export/re-encode) is the standard way to do this; it can be set at
// any point in the element's lifecycle, before or after playback actually
// starts, and the browser applies it once frames are actually rendered.
const PLAYBACK_RATE = 1.5

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
        className="relative size-[224px] shrink-0 overflow-hidden rounded-[11px] lg:hidden"
        style={gradientBorderStyle("2px")}
      >
        <video
          ref={mobileVideoRef}
          src="/vibe-result.mp4"
          poster={faceScanVisual}
          autoPlay
          muted
          playsInline
          controls={false}
          aria-hidden="true"
          onLoadedMetadata={(event) => {
            event.currentTarget.playbackRate = PLAYBACK_RATE
          }}
          className="pointer-events-none absolute inset-0 size-full rounded-[10.994px] object-cover"
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
        {/* Corner marks: 1.2px / 30% opacity here (Mobile, pre-permission,
            "inactive") vs. 1.2px / 100% opacity in `ScanningVisual`'s
            Mobile tree (active scanning) — Desktop uses a thicker 3px in
            both files instead (see that tree's own corner marks below).
            Arm length (the `size` below) no longer matches `ScanningVisual`'s
            own marks 1:1, though — a later, explicit task shortened only
            this pre-permission screen's marks (`45.66px` → `28.31px`, the
            same ~38% reduction as Desktop's below) so they read as a
            lighter, less "actively scanning" cue here specifically;
            `ScanningVisual`'s own corner marks (the real in-progress state)
            are unaffected — see this file's own top-level doc comment for
            the full before/after geometry and the position-recompute rule
            that keeps each mark's outer vertex fixed while its arm
            shrinks. Opacity itself was later lowered again, `40%` → `30%`
            (still just this pre-permission screen, not `ScanningVisual`'s
            own marks), per a further explicit request to read as even more
            subtle/secondary to the face-mesh video beneath it — size,
            position, stroke thickness, and color are all unaffected by
            that one-property change. */}
        <div className="absolute left-[19.31px] top-[19.31px] size-[28.31px] border-t-[1.2px] border-l-[1.2px] border-white/30" />
        <div className="absolute left-[175px] top-[19.31px] size-[28.31px] border-t-[1.2px] border-r-[1.2px] border-white/30" />
        <div className="absolute left-[19.31px] top-[175px] size-[28.31px] border-b-[1.2px] border-l-[1.2px] border-white/30" />
        <div className="absolute left-[175px] top-[175px] size-[28.31px] border-b-[1.2px] border-r-[1.2px] border-white/30" />
      </div>

      {/* Desktop (`lg` and up) — Figma node `347:336`. */}
      <div
        className="relative hidden size-[491px] shrink-0 overflow-hidden rounded-[24px] lg:block"
        style={gradientBorderStyle("2px")}
      >
        <video
          ref={desktopVideoRef}
          src="/vibe-result.mp4"
          poster={faceScanVisual}
          autoPlay
          muted
          playsInline
          controls={false}
          aria-hidden="true"
          onLoadedMetadata={(event) => {
            event.currentTarget.playbackRate = PLAYBACK_RATE
          }}
          className="pointer-events-none absolute inset-0 size-full rounded-[24px] object-cover"
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
        {/* Corner marks: 3px / 30% opacity (Desktop uses a thicker line than
            Mobile's 1.2px) — see the Mobile tree's own note above for the
            pre-permission vs. scanning distinction this reflects, and for
            the later `40%` → `30%` opacity-only reduction. Arm length
            shortened from `100px` to `62px` (see this file's own top-level
            doc comment) — each mark's `left`/`top` below is the same
            recomputed-to-hold-the-vertex-fixed position that comment
            describes, not the original `42.5`/`345.5`/`40`/`343` pairing
            unchanged. */}
        <div className="absolute left-[42.5px] top-[40px] size-[62px] border-t-[3px] border-l-[3px] border-white/30" />
        <div className="absolute left-[383.5px] top-[40px] size-[62px] border-t-[3px] border-r-[3px] border-white/30" />
        <div className="absolute left-[42.5px] top-[381px] size-[62px] border-b-[3px] border-l-[3px] border-white/30" />
        <div className="absolute left-[383.5px] top-[381px] size-[62px] border-b-[3px] border-r-[3px] border-white/30" />
      </div>
    </>
  )
}
