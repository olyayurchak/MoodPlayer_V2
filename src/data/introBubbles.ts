/**
 * Mood bubble artwork configurations.
 *
 * Values are derived from the approved Figma frames (`IntroDesktop-1`,
 * `IntroMobile-1`), which are left untouched. The Figma export models each
 * bubble as an image window with a smaller square alpha mask offset inside it;
 * that produces a slightly non-square outer box (the artboard bounding box) even
 * though the bubble itself is always a square mask. This file normalises that
 * into an explicitly square bubble:
 *
 * - `size` is the square bubble box (rendered with `aspect-ratio: 1 / 1`).
 * - `maskSize` is the mask's native square viewBox side; `maskInset` centres it
 *   inside `size`, so the mask keeps its exact proportions and is never
 *   stretched on one axis.
 * - `imageLeft` / `imageTop` / `imageWidth` / `imageHeight` reproduce the
 *   original Figma image window *relative to the mask*, so `object-fit: cover`
 *   crops exactly the artwork region Figma showed.
 * - `dx` / `dy` place the mask square's centre relative to the frame centre —
 *   recomputed (through the rotation where present) from the Figma values so
 *   each bubble lands on its approved coordinate.
 *
 * Masks are imported per frame because Figma exports them at each frame's own
 * resolution; the artwork PNGs are byte-identical across frames, so the Desktop
 * folder supplies them for both.
 */
import {
  imgChatGptImage2020262223153 as mobileMaskCrowd,
  imgChatGptImage2120260038351 as mobileMaskHeadphonesWoman,
  imgChatGptImage2020262252164 as mobileMaskNoteSmall,
  imgChatGptImage2020262144201 as mobileMaskRound,
  imgChatGptImage2020262256161 as mobileMaskVinyl,
  imgChatGptImage2020262202141 as mobileMaskColorBurst,
  imgChatGptImage2020262134365 as mobileMaskHeadphonesPerson,
} from "../imports/IntroMobile-1/svg-lqzgi"
import {
  imgChatGptImage2020262223153 as desktopMaskCrowd,
  imgChatGptImage2120260038351 as desktopMaskHeadphonesWoman,
  imgChatGptImage2020262144201 as desktopMaskRound,
  imgChatGptImage2020262256161 as desktopMaskVinyl,
  imgChatGptImage2020262148232 as desktopMaskNoteLarge,
  imgChatGptImage2020262252164 as desktopMaskNoteSmall,
  imgChatGptImage2020262202141 as desktopMaskColorBurst,
  imgChatGptImage2120260050371 as desktopMaskKeyboard,
  imgChatGptImage2020262134365 as desktopMaskHeadphonesPerson,
} from "../imports/IntroDesktop-1/svg-2ldi1"
import imgCrowd from "../imports/IntroDesktop-1/d60e5c033929b04dca1ffdd453380c8bad7c35f2.png"
import imgHeadphonesWoman from "../imports/IntroDesktop-1/4930f3883cced96183608c523d2de1596b9556ee.png"
import imgLaughingMan from "../imports/IntroDesktop-1/2a94467dcb356926182761ab2f7ed2fada5a92a9.png"
import imgVinyl from "../imports/IntroDesktop-1/00f9b3e0e6b9e561139e93104ff634b3b4d0070d.png"
import imgNoteLarge from "../imports/IntroDesktop-1/1a6bd700a2ed6479b0a3e2a838b3883f8d57a5e9.png"
import imgNoteSmall from "../imports/IntroDesktop-1/b5c59d2987dcbf272914448a08faee09707c475f.png"
/** Finished Figma export of the small Desktop note bubble, already masked and rotated. */
import imgNoteSmallExport from "../imports/Mask_group.png"
import imgFlower from "../imports/IntroDesktop-1/7a90091ce757adfc455c5325ca983a232f4b43ef.png"
import imgColorBurst from "../imports/IntroDesktop-1/1522ae1fa1f9736d1d282f0c988303b1d2bdf48e.png"
import imgKeyboard from "../imports/IntroDesktop-1/8b7ddf9a8fd96193ec01a18ecca12f1890a7419b.png"
import imgHeadphonesPerson from "../imports/IntroDesktop-1/545733e42308802cca154c937dd52bf66bf6a170.png"
/**
 * Desktop-only content-identity fix (verified against Figma idle node
 * `292:10014`, `Intro / Desktop `, and motion node `325:2`,
 * `Intro / Desktop / Motion`): the four imports above — `imgCrowd`,
 * `imgHeadphonesWoman`, `imgLaughingMan`, `imgColorBurst` — each actually
 * contain a *different* bubble's photo (a four-way mislabel: `imgCrowd`'s
 * file is really the colour-splash art, `imgHeadphonesWoman`'s file is
 * really the concert-crowd art, `imgLaughingMan`'s file is really the
 * headphones-woman art, and `imgColorBurst`'s file is really the
 * laughing-man art). These four re-imports point each id at its correct
 * photo. Scoped to Desktop only, per this task's boundaries — `mobileBubbles`
 * below still uses the original (mismatched) aliases untouched; that shared
 * bug is flagged separately rather than fixed here.
 *
 * A second, related bug (found auditing `292:10014`): the *geometry*
 * (`dx`/`dy`/`size`/`maskSize`/`maskInset`/crop/`clipCircle`) in five
 * `desktopBubbles` entries below was, before this fix, each exactly one
 * artwork's Figma slot out of step with the id/photo pairing above — a
 * five-way rotation (`crowd` slot → really `color-burst`'s geometry;
 * `headphones-woman` slot → really `crowd`'s; `laughing-man` slot → really
 * `headphones-woman`'s; `flower` slot → really `laughing-man`'s;
 * `color-burst` slot → really `flower`'s), confirmed by matching every
 * `dx`/`dy`/`maskSize` pair against `292:10014`'s own mask-group centres and
 * sizes. The five entries below now carry each artwork's *complete* bundle
 * (id, image, and all geometry/crop/mask fields together) rather than the
 * photo alone, with the physical array order left exactly as it was — that
 * order already matches Figma's own paint order once read by artwork
 * instead of by the old id labels, so no entries were moved, only relabelled
 * in place.
 */
import imgCrowdDesktopFix from "../imports/IntroDesktop-1/4930f3883cced96183608c523d2de1596b9556ee.png"
import imgHeadphonesWomanDesktopFix from "../imports/IntroDesktop-1/2a94467dcb356926182761ab2f7ed2fada5a92a9.png"
import imgColorBurstDesktopFix from "../imports/IntroDesktop-1/d60e5c033929b04dca1ffdd453380c8bad7c35f2.png"
/**
 * A third, independent mislabel — this one mine, found only now by fetching
 * each file in isolation rather than trusting a prior read of a five-image
 * batch: `imgFlower` (`7a90091c...png`) is actually the laughing-man photo,
 * and the file at `1522ae1f...png` (previously aliased `imgLaughingManDesktopFix`
 * above) is actually the flower photo — the reverse of what an earlier pass
 * in this file assumed. Desktop's `flower` and `laughing-man` entries below
 * were each already sitting at their own correct Figma `292:10014` position
 * and size (verified independently — that part was right), just showing
 * each other's artwork. Retired `imgLaughingManDesktopFix` (no longer
 * accurate) in favour of the two below. `mobileBubbles`' `flower` (still on
 * `imgFlower`) and `color-burst` (still on `imgColorBurst`, the same
 * `1522ae1f...png`) have this identical swap and are left as-is — out of
 * scope here, same as the other Mobile mismatches already flagged above.
 */
import imgLaughingManDesktopTrue from "../imports/IntroDesktop-1/7a90091ce757adfc455c5325ca983a232f4b43ef.png"
import imgFlowerDesktopTrue from "../imports/IntroDesktop-1/1522ae1fa1f9736d1d282f0c988303b1d2bdf48e.png"

export type BubbleSpec = {
  id: string
  image: string
  mask: string
  /** Mask-square centre offset from the frame centre. */
  dx: number
  dy: number
  /** Square bubble box side. */
  size: number
  /** Native square side of the mask's SVG viewBox. */
  maskSize: number
  /** Offset that centres the mask inside `size`. */
  maskInset: number
  /** Figma image window, positioned relative to the bubble box. */
  imageLeft: number
  imageTop: number
  imageWidth: number
  imageHeight: number
  /** Approved static rotation, in degrees. Absent means unrotated. */
  rotation?: number
  objectPosition?: string
  /**
   * Clip this bubble as a true circle (`border-radius: 50%` on a square
   * wrapper) instead of using its exported SVG alpha mask.
   *
   * Two Desktop bubbles render as ovals when the silhouette is derived from
   * their exported mask bounds. For those the circle is defined geometrically
   * from `maskSize` (the approved diameter) and the mask asset is unused;
   * their `imageLeft/Top/Width/Height` is instead derived from the source
   * PNG's alpha bounds so the artwork's glass edge meets the clip. `size` and
   * `maskInset` are retained as the Figma record but are not used to render.
   */
  clipCircle?: true
  /**
   * Render this bubble as a finished exported PNG: no mask, no clip, no
   * rotation, drawn at `size` square. Used where Figma supplied the bubble
   * already composited and rotated, so the only job left is placement.
   */
  flatImage?: true
}

/** 8 bubbles, frame 430x932. Array order is paint order (z-index). */
export const mobileBubbles: BubbleSpec[] = [
  {
    id: "crowd",
    image: imgCrowd,
    mask: mobileMaskCrowd,
    dx: 137.931,
    dy: 138.549,
    size: 143.063,
    maskSize: 110.131,
    maskInset: 16.466,
    imageLeft: 0.269,
    imageTop: 0.271,
    imageWidth: 142.523,
    imageHeight: 143.063,
  },
  {
    id: "headphones-woman",
    image: imgHeadphonesWoman,
    mask: mobileMaskHeadphonesWoman,
    dx: -141.17,
    dy: 156.359,
    size: 120.389,
    maskSize: 103.653,
    maskInset: 8.368,
    imageLeft: 0.27,
    imageTop: 0.811,
    imageWidth: 120.389,
    imageHeight: 119.309,
    objectPosition: "bottom",
  },
  {
    id: "laughing-man",
    image: imgLaughingMan,
    mask: mobileMaskRound,
    dx: -72.076,
    dy: 130.444,
    size: 139.554,
    maskSize: 106.892,
    maskInset: 16.331,
    imageLeft: 0.136,
    imageTop: 0.136,
    imageWidth: 139.554,
    imageHeight: 139.554,
  },
  {
    id: "vinyl",
    image: imgVinyl,
    mask: mobileMaskVinyl,
    dx: 70.45,
    dy: 155.82,
    size: 141.983,
    maskSize: 109.052,
    maskInset: 16.466,
    imageLeft: 0.271,
    imageTop: 0.271,
    imageWidth: 141.983,
    imageHeight: 141.983,
  },
  {
    // Paints after the laughing-man and vinyl bubbles and before the flower
    // bubble, matching this bubble's position in the approved Mobile frame's
    // layer order (`MaskGroup4`).
    id: "note-small",
    image: imgNoteSmall,
    mask: mobileMaskNoteSmall,
    // Approved Mobile screen bounds are X 176, Y 537, 85x85. The cluster
    // container is the full 430x932 frame, so container coordinates are screen
    // coordinates: the centre (218.5, 579.5) is 3.5 / 113.5 from the container
    // centre. Circle-clipped: this source PNG's own alpha shape is an oval
    // (855x716 inside a 1024x799 canvas), so the window is sized from those
    // alpha bounds scaled uniformly until they cover the 85px circle, then
    // centred on it — the circle crops the artwork instead of squashing it.
    // `size` and `maskInset` are kept as the Figma record.
    dx: 3.5,
    dy: 113.5,
    size: 103.972,
    maskSize: 85,
    maskInset: 9.486,
    imageLeft: -18.46,
    imageTop: -3.918,
    imageWidth: 121.564,
    imageHeight: 94.853,
    clipCircle: true,
  },
  {
    id: "flower",
    image: imgFlower,
    mask: mobileMaskRound,
    dx: -1.345,
    dy: 188.754,
    size: 117.42,
    maskSize: 106.892,
    maskInset: 5.264,
    imageLeft: 0.405,
    imageTop: -0.134,
    imageWidth: 117.42,
    imageHeight: 117.42,
  },
  {
    id: "color-burst",
    image: imgColorBurst,
    mask: mobileMaskColorBurst,
    dx: -78.009,
    dy: 193.609,
    size: 108.512,
    maskSize: 77.7399,
    maskInset: 15.386,
    imageLeft: 0.269,
    imageTop: 0.271,
    imageWidth: 108.512,
    imageHeight: 108.512,
  },
  {
    id: "headphones-person",
    image: imgHeadphonesPerson,
    mask: mobileMaskHeadphonesPerson,
    dx: 122.281,
    dy: 193.071,
    size: 96.095,
    maskSize: 78.8196,
    maskInset: 8.638,
    imageLeft: -0.001,
    imageTop: -0.001,
    imageWidth: 96.095,
    imageHeight: 96.095,
  },
]

/** 10 bubbles, frame 1440x1024. Adds two music notes and the keyboard bubble. */
export const desktopBubbles: BubbleSpec[] = [
  {
    // Slot geometry verified against Figma idle node `292:10014` mask-group
    // `292:10019` (centre 985,694 → dx 265,182; mask 204×204) — this bundle
    // previously sat under `id: "crowd"` with the crowd photo; both the
    // geometry and (per its raw import name, a colour-splash-labelled asset)
    // the mask below have always been colour-burst's own, so only the id and
    // image needed correcting here.
    id: "color-burst",
    image: imgColorBurstDesktopFix,
    mask: desktopMaskCrowd,
    dx: 265,
    dy: 182,
    size: 265,
    maskSize: 204,
    maskInset: 30.5,
    imageLeft: 0.5,
    imageTop: 0.5,
    imageWidth: 264,
    imageHeight: 265,
  },
  {
    // Slot geometry verified against `292:10014` mask-group `292:10022`
    // (centre 468,727 → dx -252,215; mask 192×192) — previously sat under
    // `id: "headphones-woman"`. Circle-clipped: the window is sized from the
    // source PNG's own alpha bounds (873x678 of 1024x768 — the artwork is an
    // oval) scaled uniformly until those bounds cover the 192px circle, then
    // centred on it. Aspect is the source's exactly, so nothing is
    // stretched; the oval's wide sides are cropped by the circle. This oval
    // math is crowd's own — the photo now correctly assigned here is the
    // 1024×768 oval concert shot, not the previous (square) resident.
    id: "crowd",
    image: imgCrowdDesktopFix,
    mask: desktopMaskHeadphonesWoman,
    dx: -252,
    dy: 215,
    size: 223,
    maskSize: 192,
    maskInset: 15.5,
    imageLeft: -46.867,
    imageTop: -12.177,
    imageWidth: 289.982,
    imageHeight: 217.487,
    clipCircle: true,
  },
  {
    // Slot geometry verified against `292:10014` mask-group `292:10025`
    // (centre 596,679 → dx -124,167; mask 198×198) — previously sat under
    // `id: "laughing-man"`.
    id: "headphones-woman",
    image: imgHeadphonesWomanDesktopFix,
    mask: desktopMaskRound,
    dx: -124,
    dy: 167,
    size: 259,
    maskSize: 198,
    maskInset: 30.5,
    imageLeft: 0.5,
    imageTop: 0.5,
    imageWidth: 258,
    imageHeight: 259,
  },
  {
    id: "vinyl",
    image: imgVinyl,
    mask: desktopMaskVinyl,
    dx: 140,
    dy: 214,
    size: 263,
    maskSize: 202,
    maskInset: 30.5,
    imageLeft: 0.5,
    imageTop: 0.5,
    imageWidth: 263,
    imageHeight: 263,
  },
  {
    id: "note-large",
    image: imgNoteLarge,
    mask: desktopMaskNoteLarge,
    dx: -364.081,
    dy: 251.587,
    size: 230.505,
    maskSize: 156,
    maskInset: 37.253,
    // Circle-clipped: window sized from the source PNG's alpha bounds
    // (687x684 of 1024x1024) scaled uniformly until they cover the 156px
    // circle, then centred on it — so the glass edge meets the clip exactly.
    imageLeft: -38.886,
    imageTop: -34.211,
    imageWidth: 233.544,
    imageHeight: 233.544,
    rotation: 16.88,
    clipCircle: true,
  },
  {
    id: "note-small",
    // Finished 148x148 Figma export: its solid bubble core measures 124x123 —
    // the approved diameter — inside a soft halo, with the 10.3deg rotation
    // already baked in. `dy` places that core (whose centre sits 6.5px above
    // the canvas centre) on the approved centre of 143.243.
    image: imgNoteSmallExport,
    mask: desktopMaskNoteSmall,
    dx: 29.935,
    dy: 149.743,
    size: 148,
    maskSize: 124,
    maskInset: 13.838,
    imageLeft: 0,
    imageTop: 0,
    imageWidth: 148,
    imageHeight: 148,
    flatImage: true,
  },
  {
    // Slot geometry verified against `292:10014` mask-group `292:10040`
    // (centre 585,796 → dx -135,284; mask 144×144) — previously sat under
    // `id: "color-burst"`; the mask below (per its raw import name, a
    // colour-burst-labelled asset) is actually flower's own too. `image`
    // corrected separately (see the comment by `imgFlowerDesktopTrue` above)
    // — this slot's position/size were already right, only the photo was
    // wrong (showing laughing-man's).
    //
    // Painted before `laughing-man` (below), not after: the two mask-groups'
    // circles genuinely overlap in Figma (centre distance 142.3px < combined
    // radii 171px), and `292:10014` shows laughing-man's edge in front,
    // clipping flower's — so flower must be the earlier (further-back) array
    // entry of the two, opposite of this file's previous order for them.
    id: "flower",
    image: imgFlowerDesktopTrue,
    mask: desktopMaskColorBurst,
    dx: -135,
    dy: 284,
    size: 201,
    maskSize: 144,
    maskInset: 28.5,
    imageLeft: 0.5,
    imageTop: 0.5,
    imageWidth: 201,
    imageHeight: 201,
  },
  {
    // Slot geometry verified against `292:10014` mask-group `292:10037`
    // (centre 727,787 → dx 7,275; mask 198×198) — previously sat under
    // `id: "flower"`. Painted after `flower` (above) so it renders in front,
    // matching Figma's own overlap at this pair. `image` corrected
    // separately (see the comment by `imgLaughingManDesktopTrue` above) —
    // this slot's position/size were already right, only the photo was
    // wrong (showing flower's).
    id: "laughing-man",
    image: imgLaughingManDesktopTrue,
    mask: desktopMaskRound,
    dx: 7,
    dy: 275,
    size: 218,
    maskSize: 198,
    maskInset: 10,
    imageLeft: 1,
    imageTop: 0,
    imageWidth: 217,
    imageHeight: 218,
  },
  {
    id: "keyboard",
    image: imgKeyboard,
    mask: desktopMaskKeyboard,
    dx: 392,
    dy: 216,
    size: 175,
    maskSize: 150,
    maskInset: 12.5,
    imageLeft: 0.5,
    imageTop: 0.5,
    imageWidth: 175,
    imageHeight: 174,
    objectPosition: "bottom",
  },
  {
    id: "headphones-person",
    image: imgHeadphonesPerson,
    mask: desktopMaskHeadphonesPerson,
    dx: 236,
    dy: 283,
    size: 178,
    maskSize: 146,
    maskInset: 16,
    imageLeft: 0,
    imageTop: 0,
    imageWidth: 178,
    imageHeight: 178,
  },
]
