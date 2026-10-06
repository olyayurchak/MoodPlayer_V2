import type { CSSProperties } from "react"
import type { BubbleSpec } from "../data/introBubbles"

/**
 * A single masked artwork bubble.
 *
 * Five nested layers keep concerns separate so future interactions can be
 * added without rebuilding the cluster:
 *
 * 1. placement — the approved frame-relative position (static, never animated);
 * 2. idle float — a calm, deterministic ambient drift (`.bubble-float*` in
 *    `index.css`), running on both Desktop and Mobile (reduced-motion-safe on
 *    both; `isMobile` softens the amplitude for Mobile's tighter composition,
 *    the tiers themselves are untouched). Its own layer so it never fights
 *    the placement transform above or the reserved motion layer below — each
 *    of the three animatable layers here owns exactly one concern, and any
 *    of them can change independently of the others;
 * 3. motion — reads `--bubble-shift-x` / `--bubble-shift-y`, both `0px` at
 *    rest. Driven by `MoodBubbleCluster`'s one-time scatter state machine,
 *    which finds this exact layer via its `.bubble-motion` class and reads
 *    its `data-bubble-id` / `data-bubble-size` / `data-bubble-visible-size`
 *    attributes (no per-bubble listeners or refs) to look up this bubble's
 *    explicit, designer-placed scatter target and write the two custom
 *    properties directly — once per state change, with a CSS transition set
 *    immediately beforehand, not a per-frame loop. It composes with the idle
 *    float above it rather than replacing it — both are plain nested
 *    `transform`s, and nested transforms stack visually regardless of which
 *    layer holds which one. This same layer is also where `index.css`'s
 *    CTA activation wave — a single 440ms `translate` + `scale` animation
 *    that lifts the bubble a few px and swells it to 1.035, then softly
 *    settles back to rest (not a hold) — runs once `IntroScreen` sets
 *    `data-intro-activating`. Its lift (`--bubble-wave-x` /
 *    `--bubble-wave-y`) and stagger (`--bubble-wave-delay`) are this
 *    bubble's own `responseX`/`responseY`/`responseDelay` props, set as
 *    custom properties just below — `MoodBubbleCluster` computes the delay
 *    from this bubble's distance to the top centre of the cluster, under
 *    the CTA, so the wave travels from the button through the cluster
 *    rather than every bubble moving at once. It composites on
 *    top of this layer's inline `transform`; the idle float above stays
 *    paused for the rest of the screen's life once activation starts, so
 *    nothing resumes drifting once the wave itself returns to rest;
 * 4. scale — reads `--bubble-scale`, `1` at rest. The approved idle
 *    composition and the approved Motion composition use different visible
 *    diameters for the same bubble (Figma's own Motion frame renders most
 *    bubbles smaller than their idle size), so the scatter state machine
 *    scales this dedicated layer down to the Motion-approved diameter
 *    without ever touching `size`/`maskSize` themselves — those stay the
 *    approved idle record. A separate layer (not a property added onto
 *    `.bubble-motion`) so the scale transform can never overwrite the
 *    shift/idle-float transforms it nests inside;
 * 5. artwork — a square (`aspect-ratio: 1 / 1`) box carrying the approved
 *    rotation, the alpha mask drawn at its native square size, and the artwork
 *    window.
 *
 * The mask never scales unevenly: a square mask in a square box, centred by
 * `maskInset`. The image is given its own size and offset purely to reproduce
 * Figma's crop window, and `object-fit: cover` keeps the source artwork's own
 * aspect ratio inside it, so nothing is stretched on a single axis.
 *
 * Bubbles are decorative: the cluster hides them from assistive technology and
 * they are not interactive.
 */
export default function MoodBubble({
  id,
  index,
  image,
  mask,
  dx,
  dy,
  size,
  maskSize,
  maskInset,
  imageLeft,
  imageTop,
  imageWidth,
  imageHeight,
  rotation,
  objectPosition,
  clipCircle,
  flatImage,
  isMobile,
  responseX,
  responseY,
  responseDelay,
}: BubbleSpec & {
  index: number
  isMobile?: boolean
  responseX: number
  responseY: number
  responseDelay: number
}) {
  // A `flatImage` bubble is already a finished, circular, pre-rotated export,
  // so it needs no mask, no clip and no rotation — just the PNG at its own
  // square size. A circle-clipped bubble is its own square: the wrapper side
  // *is* the approved diameter, so the silhouette never depends on the exported
  // mask bounds. `border-radius` plus `overflow: hidden` cut the circle, and the
  // artwork window (sized in the data from the source's alpha bounds) scales
  // uniformly to cover it — so a source whose own alpha shape is an oval is
  // cropped by the circle rather than squashed into it.
  const side = clipCircle ? maskSize : size

  const placement: CSSProperties = {
    left: `calc(50% + ${dx}px)`,
    top: `calc(50% + ${dy}px)`,
    width: side,
  }

  // Idle-float tuning, entirely deterministic from this bubble's own visible
  // mask diameter (`maskSize`, not the wider `size` bounding box) and its
  // stable array index — never `Math.random()` or anything that could differ
  // between reloads, so the composition is pixel-identical on every visit.
  // Tiered by `maskSize`: >=180px is the calmest tier (3px amplitude, 8s base
  // period), >=130px a middle tier (4px, 7s), anything smaller the liveliest
  // tier (4.5px, 6s) — still restrained enough to read as a single calm
  // constellation, preserving the approved cluster's intentional overlaps.
  // Vertical amplitude is 70% of horizontal, as before. `floatVariant` (1 of
  // 3 keyframe shapes) plus a small deterministic per-index period offset
  // (`index % 4` x 0.3s, capped at 9s) keep bubbles from visibly moving as
  // one synchronized group.
  //
  // On Mobile, every bubble in the dataset already sits under the
  // Desktop-tuned 130px/180px thresholds (Mobile's own bubbles only run
  // ~78-110px), so tiering on raw `maskSize` would always land Mobile
  // bubbles in the liveliest tier regardless of how large they read *within
  // Mobile's own composition*. Rescaling by Mobile's own largest-bubble
  // size relative to Desktop's (~0.55) before tiering lets Mobile's own
  // biggest bubbles land in the same calm tier as Desktop's biggest —
  // comparable large-sphere slowness — while the separate 0.7 amplitude
  // multiplier (unchanged) still softens Mobile's raw pixel amplitude
  // regardless of which tier a bubble lands in.
  const MOBILE_FLOAT_AMPLITUDE_SCALE = 0.7
  const MOBILE_FLOAT_SIZE_RESCALE = 0.55
  const floatTierSize = isMobile ? maskSize / MOBILE_FLOAT_SIZE_RESCALE : maskSize
  const [floatAmplitudeTierX, floatPeriodBase] =
    floatTierSize >= 180 ? [3, 8] : floatTierSize >= 130 ? [4, 7] : [4.5, 6]
  const floatAmplitudeX = isMobile
    ? floatAmplitudeTierX * MOBILE_FLOAT_AMPLITUDE_SCALE
    : floatAmplitudeTierX
  const floatAmplitudeY = floatAmplitudeX * 0.7
  const FLOAT_PERIOD_INDEX_STEP_S = 0.3
  const FLOAT_PERIOD_CAP_S = 9
  const floatDuration = Math.min(
    floatPeriodBase + (index % 4) * FLOAT_PERIOD_INDEX_STEP_S,
    FLOAT_PERIOD_CAP_S,
  ) // 6-9s
  // Positive delay, starting at/after the 450ms mount entrance, with a small
  // stagger — the drift begins at zero displacement, never mid-cycle.
  const FLOAT_START_DELAY_S = 0.45
  const floatDelay = FLOAT_START_DELAY_S + (index % 6) * 0.08
  const floatVariant = (index % 3) + 1 // 1 | 2 | 3

  const floatStyle = {
    "--bubble-float-x": `${floatAmplitudeX}px`,
    "--bubble-float-y": `${floatAmplitudeY}px`,
    animationDuration: `${floatDuration}s`,
    animationDelay: `${floatDelay}s`,
  } as CSSProperties

  const artwork: CSSProperties = flatImage
    ? {}
    : clipCircle
    ? { transform: rotation === undefined ? undefined : `rotate(${rotation}deg)` }
    : {
        transform: rotation === undefined ? undefined : `rotate(${rotation}deg)`,
        maskImage: `url("${mask}")`,
        WebkitMaskImage: `url("${mask}")`,
        maskMode: "alpha",
        maskRepeat: "no-repeat",
        maskSize: `${maskSize}px ${maskSize}px`,
        maskPosition: `${maskInset}px ${maskInset}px`,
      }

  return (
    <div
      className="absolute aspect-square -translate-x-1/2 -translate-y-1/2"
      style={placement}
    >
      <div
        className={`bubble-float bubble-float-${floatVariant} size-full`}
        style={floatStyle}
      >
        <div
          className="bubble-motion size-full"
          data-bubble-id={id}
          data-bubble-size={side}
          data-bubble-visible-size={maskSize}
          style={
            {
              transform:
                "translate3d(var(--bubble-shift-x, 0px), var(--bubble-shift-y, 0px), 0)",
              "--bubble-wave-x": `${responseX}px`,
              "--bubble-wave-y": `${responseY}px`,
              "--bubble-wave-delay": `${responseDelay}ms`,
            } as CSSProperties
          }
        >
          <div
            className="bubble-scale size-full"
            style={{ transform: "scale(var(--bubble-scale, 1))" }}
          >
            <div
              className={
                clipCircle && !flatImage
                  ? "relative aspect-square size-full overflow-hidden rounded-full"
                  : "relative size-full"
              }
              style={artwork}
            >
              <img
                src={image}
                alt=""
                className="pointer-events-none absolute max-w-none object-cover"
                style={{
                  left: imageLeft,
                  top: imageTop,
                  width: imageWidth,
                  height: imageHeight,
                  objectPosition,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
