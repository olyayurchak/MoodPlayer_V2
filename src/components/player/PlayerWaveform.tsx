import type { PlayerMoodAccent } from "../../data/playerMoodAccent"

/**
 * The track-progress waveform visualization + elapsed/total time row.
 *
 * The approved Figma frames render this as a decorative pre-rasterized
 * two-tone (pink/blue) bar-graph image — one of the elements this task's
 * own brief explicitly calls out ("brand waveform") as somewhere the
 * *current approved visual system*, not the Figma frame's own outdated
 * colors, must be used. There is no existing "waveform" component
 * anywhere else in this codebase to reuse, so this builds a small set of
 * plain bars using the approved brand gradient (`--color-cta-button-from/
 * via/to`, the same tokens every other gradient element in the app reads)
 * instead of importing Figma's own pink/blue export.
 *
 * Bar heights are fixed and deterministic — never `Math.random()` —
 * matching this codebase's own established rule for any decorative,
 * non-data-driven visual pattern (see `MoodBubble.tsx`'s float-timing
 * doc comment for the same reasoning applied elsewhere). `progress`
 * (0–1) tints bars up to that fraction with the gradient and the rest a
 * dim neutral, communicating playback position the same way the Figma
 * asset's own two-tone split does, without needing a real `<audio>`
 * element driving it in this UI-foundation milestone — `PlayerScreen`
 * passes a fixed placeholder fraction matching the placeholder elapsed/
 * total labels (`data/playerTrack.ts`), not a live-updating value.
 *
 * Visual refinement, round one: the original version's 48 bars, each
 * ~4-5px wide with a 2px gap and `rounded-full` caps, read as a row of
 * thick pill/capsule segments — closer to a segmented progress bar than
 * an audio waveform, and its hand-picked height array climbed and fell in
 * mostly smooth, uniform steps rather than the jagged, irregular texture
 * a real waveform has. That round increased bar count (48 → 64) and
 * softened the corners (`rounded-[1px]`, down from `rounded-full`).
 *
 * Visual refinement, round two: bars were still each sized via
 * `w-full`/`min-w-[1px]` — a flex-fill approach that stretches every bar
 * to claim an equal share of whatever width its container happens to
 * have, so the *rendered* bar thickness depended on the surrounding
 * layout, not a fixed value. Bars became a fixed `w-[2px] shrink-0`
 * (never flex-fill) so the physical bar thickness is identical on both
 * breakpoints by construction.
 *
 * Visual refinement, round three: the height pattern from rounds one/two
 * was still an invented `sin`-envelope-plus-jitter curve — smoother and
 * more symmetrical ("quiet edges / loud center") than the approved Figma
 * waveform at node `290:9505`, and the bars were vertically *centered* in
 * their row rather than bottom-anchored, which reads as a two-sided
 * symmetric waveform rather than the single-direction bar chart Figma
 * actually shows. `BAR_HEIGHTS` below is no longer generated — it's
 * measured directly from that node's own exported vector artwork (its
 * `minimal-sound-wave-banner-design-background…[Vectorized]` SVG, 317×42,
 * 62 bar paths): each entry is that bar's real path bounding-box height
 * divided by the artwork's 42px container height, in left-to-right order,
 * so the irregular peaks/quiet-section mix is Figma's actual silhouette,
 * not a decorative approximation of it. The row now renders with
 * `items-end` (bottom-anchored, matching the source art) instead of
 * `items-center`, and the bar width/gap geometry (`w-[2px]` bars, `3px`
 * gaps — up from `2px`) was tuned to match the source art's own ~2.2px
 * bar / ~3px gap rhythm.
 *
 * Visual refinement, round four (this task): round three's row still used
 * `justify-center`, which packs the 62 fixed-width bars into their own
 * content-width block (~307px) and then centers that block inside the
 * row — leaving an equal, empty margin on *both* sides (~8.5px each on
 * the Desktop 324px column) before the first/after the last bar. Because
 * the elapsed/total label row below it is a true edge-to-edge `w-full
 * justify-between`, those margins visibly offset the waveform's start/end
 * from the `1:24`/`3:56` labels directly under it — exactly the mismatch
 * this task's brief calls out. Switching to `justify-between` (bars still
 * fixed `w-[2px] shrink-0`, `gap-[3px]` as a floor) removes those margins:
 * the first bar's left edge and the last bar's right edge now sit flush
 * with the row's own edges, the same edges the label row spans, so the
 * waveform starts exactly above `1:24` and ends exactly above `3:56` on
 * any container width — `gap` still enforces the ≥3px minimum spacing,
 * and `justify-between` distributes only the small remainder (e.g. ~17px
 * over 61 gaps on the 324px Desktop column) evenly between bars, which is
 * imperceptible at this bar density.
 */
const BAR_COUNT = 62

/** Bar heights (0–1, fraction of the 42px-tall source artwork), measured
 *  left-to-right from Figma node `290:9505`'s own exported waveform vector
 *  — see this file's doc comment above for how. Not generated, not
 *  random: this *is* the approved waveform's silhouette. */
const BAR_HEIGHTS = [
  0.337, 0.158, 0.37, 0.304, 0.174, 0.283, 0.653, 0.538, 0.321, 0.489, 0.315,
  0.255, 0.202, 0.478, 0.299, 0.382, 0.305, 0.467, 0.217, 0.261, 0.571, 0.625,
  0.158, 0.533, 0.886, 0.728, 0.81, 0.359, 0.289, 0.37, 0.217, 0.663, 0.207,
  0.848, 0.946, 0.603, 0.745, 0.228, 0.19, 0.283, 0.304, 0.892, 0.43, 0.207,
  0.217, 0.484, 0.278, 0.647, 0.462, 0.397, 0.533, 0.62, 0.598, 0.288, 0.391,
  0.441, 0.571, 0.304, 0.343, 0.424, 0.234, 0.375,
]

export default function PlayerWaveform({
  progress,
  elapsedLabel,
  durationLabel,
  accent,
}: {
  /** 0–1 fraction of the track considered "played" — see this file's own
   *  doc comment on why this is a fixed placeholder, not a live value. */
  progress: number
  elapsedLabel: string
  durationLabel: string
  /** From `data/playerMoodAccent.ts`, `undefined` for any mood without
   *  its own approved override yet. When present, played bars use that
   *  mood's own `gradientFrom`/`gradientTo` instead of the universal
   *  Mood Gradient's `from`/`to` — the same two-stop (no `via`) reuse
   *  this codebase's volume slider already established for this same
   *  "brand gradient, from/to only" treatment. */
  accent?: PlayerMoodAccent
}) {
  const playedBarCount = Math.round(BAR_COUNT * progress)

  return (
    <div className="flex w-full flex-col items-center gap-[8px]">
      <div
        role="img"
        aria-label={`${elapsedLabel} of ${durationLabel} played`}
        className="flex h-[42px] w-full items-end justify-between gap-[3px]"
      >
        {BAR_HEIGHTS.slice(0, BAR_COUNT).map((height, index) => (
          <span
            key={index}
            className={
              index < playedBarCount
                ? accent
                  ? "w-[2px] shrink-0 rounded-[1px]"
                  : "w-[2px] shrink-0 rounded-[1px] bg-linear-to-b from-cta-button-from to-cta-button-to"
                : "w-[2px] shrink-0 rounded-[1px] bg-[rgba(255,255,255,0.18)]"
            }
            style={{
              height: `${Math.max(height * 100, 6)}%`,
              ...(index < playedBarCount && accent
                ? { backgroundImage: `linear-gradient(180deg, ${accent.gradientFrom}, ${accent.gradientTo})` }
                : null),
            }}
          />
        ))}
      </div>
      <div className="flex w-full items-center justify-between text-[14px] font-light tracking-[-0.2px] text-white">
        <span>{elapsedLabel}</span>
        <span>{durationLabel}</span>
      </div>
    </div>
  )
}
