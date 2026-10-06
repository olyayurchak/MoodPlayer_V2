import { useEffect, useRef, type KeyboardEvent } from "react"
import type { PlayerMoodAccent } from "../../data/playerMoodAccent"
import type { WaveformAnalyserHandle } from "../../hooks/useWaveformAnalyser"
import { copy as t } from "../../content/copy"

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
 *
 * Click/tap-to-seek (this task): the same bar row is now also the seek
 * control — clicking/tapping anywhere along it moves playback to that
 * horizontal position, reusing `usePlayerAudio`'s own existing `seekTo`
 * (`PlayerScreen`'s own `onSeek` prop below, a thin wrapper around it; see
 * that hook's own doc comment) rather than inventing a second, parallel
 * way to move playback — this component still owns no playback state of
 * its own, only a pointer-position → time *conversion*. `pointerdown`
 * (not `click`) is the one handler used for both mouse and touch (a
 * pointer event already unifies both input types, so no separate
 * touch-specific handling exists here), computed directly from the same
 * row's own `getBoundingClientRect()` at the moment of the event — never
 * a duplicated/cached measurement that could go stale if the row's real
 * width ever changes (e.g. a resize). No drag-to-scrub
 * exists (a `pointerdown` deliberately doesn't attach a `pointermove`
 * listener) — the brief asks for click/tap-to-seek, not a draggable
 * scrubber, and adding one would be new interaction surface beyond scope.
 *
 * The row's own accessible role changes from `role="img"` to
 * `role="slider"` here (a slider is exactly what this row now behaves
 * like) — `aria-valuemin`/`aria-valuemax`/`aria-valuenow` carry the real
 * numeric position a slider needs, `aria-valuetext` carries this file's
 * own pre-existing human-readable "`elapsed` of `duration`" string (moved
 * here from the old `aria-label`, since `aria-valuetext` — not `aria-
 * label` — is the correct place for a slider's *current value* to be
 * announced; `aria-label` now holds only the control's static purpose,
 * `t.player.controls.seek`, matching every other control in this screen).
 * `tabIndex={0}` plus an `onKeyDown` handling `ArrowLeft`/`ArrowRight`
 * (a fixed 5-second step — the same "small, sensible, unrelated to a
 * particular track's own length" convention most media players already
 * use) makes the same control keyboard-operable, not just pointer-driven.
 *
 * The row's own visual box is completely unchanged (still exactly
 * `h-[42px]`, same bars, same colors, same position) — no second visible
 * progress bar or scrubber handle was added, per this task's own explicit
 * "preserve the current waveform visual appearance" requirement. Mobile's
 * own ~44px comfortable touch target instead reuses the exact invisible-
 * hit-area `before:` pseudo-element technique `GestureControlsPanel.tsx`'s
 * On/Off toggle and `PlayerControls.tsx`'s Shuffle/Repeat buttons already
 * use for the same reason: growing the *hit area* only, not the rendered
 * box, so nothing here needs to move or resize to gain those two extra
 * pixels top and bottom. Desktop gets `cursor-pointer` instead (a mouse
 * has no comparable "hit area vs. visual size" concern — the existing 42px
 * height is already comfortable for a precise pointer — so this is purely
 * an affordance cue, not a functional change), reset back to
 * `cursor-default` nowhere else needed since a fresh `<div>` has no cursor
 * override by default.
 *
 * Real-audio reactivity (this task): bar *height* now animates from the
 * actual playing audio via `useWaveformAnalyser` (`PlayerScreen` owns the
 * one shared analyser instance — see that hook's own doc comment for why),
 * while everything else here — bar count, the measured `BAR_HEIGHTS`
 * silhouette, colors, dimensions, played/unplayed tinting via `progress` —
 * stays exactly as rounds one through four left it, per this task's own
 * "existing waveform design... should remain visually consistent"
 * requirement. Each bar's *base* height (`BAR_HEIGHTS[i]`) is treated as
 * its own resting silhouette, multiplied each frame by that bar's own
 * live audio-reactive scale (`1` at rest, below `1` for a quiet moment,
 * above `1` for a loud/bassy one) — never replaced by raw per-bin
 * frequency data, which would abandon the approved silhouette for a
 * generic spectrum-analyzer look.
 *
 * That per-frame height is applied by writing `style.height` directly on
 * each bar's own DOM node (via `barRefs` below) inside `analyser`'s
 * `subscribe` callback, deliberately *not* through React state — a
 * `requestAnimationFrame`-driven state update per bar, 62 times a frame,
 * would mean a full component re-render at animation-frame frequency for
 * no benefit React's own diffing would ever need; direct DOM mutation is
 * this file's own equivalent of `useFadeTransition.ts`'s "adjust the one
 * property that actually changed" discipline, just applied to Web Audio
 * output instead of a fade. This never conflicts with this component's
 * existing per-render JSX `style.height` (the played/unplayed base
 * value): React's own reconciliation only rewrites a DOM node's `style`
 * property when the *computed* value for that property actually differs
 * between renders, and `progress`/`accent` changes never touch `height`
 * (they only ever change `className`/`backgroundImage`) — so this
 * imperative animation and React's own re-renders coexist without either
 * fighting the other for the same bar.
 */
// Exported so `PlayerScreen` can size its one shared `useWaveformAnalyser`
// instance's per-bar scale array to match exactly, rather than that hook
// guessing/duplicating this file's own bar count.
export const BAR_COUNT = 62

/** Bar heights (0–1, fraction of the 42px-tall source artwork), measured
 *  left-to-right from Figma node `290:9505`'s own exported waveform vector
 *  — see this file's doc comment above for how. Not generated, not
 *  random: this *is* the approved waveform's silhouette. */
// `ArrowLeft`/`ArrowRight`'s own step size, in seconds — a fixed, small
// value (not a fraction of the track's own duration) so the step feels
// the same regardless of whether the current track is 3 minutes or 30,
// matching the same convention most media players/scrubbers already use.
const ARROW_KEY_SEEK_SECONDS = 5

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
  analyser,
  currentTime,
  duration,
  onSeek,
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
  /** `PlayerScreen`'s one shared `useWaveformAnalyser` instance —
   *  `undefined` only in the moment before that hook has returned a value
   *  (never in practice, since it's called unconditionally), handled the
   *  same "just render the static resting look" way `analyser` reporting
   *  no frames yet (reduced motion, not-yet-started) already is. See this
   *  file's own doc comment above for how frames are applied. */
  analyser?: WaveformAnalyserHandle
  /** The real `HTMLAudioElement.currentTime`, in seconds — used only for
   *  `aria-valuenow` and as the base for `ArrowLeft`/`ArrowRight` stepping;
   *  `progress`/`elapsedLabel` (above) still drive the actual visible bar
   *  tinting and text exactly as before, this prop adds nothing to that. */
  currentTime: number
  /** The real `HTMLAudioElement.duration`, in seconds — `0` before the
   *  browser reports real metadata (see `PlayerScreen`'s own
   *  `durationLabel` fallback), in which case seeking is a deliberate
   *  no-op below: a fraction of an unknown duration has nothing sensible
   *  to seek *to* yet. */
  duration: number
  /** Reuses `usePlayerAudio`'s own existing `seekTo` — `PlayerScreen`
   *  passes that same function straight through (see this file's own doc
   *  comment above); this component only ever computes *where* to seek,
   *  never how. */
  onSeek: (time: number) => void
}) {
  const playedBarCount = Math.round(BAR_COUNT * progress)
  const barRefs = useRef<(HTMLSpanElement | null)[]>([])
  const rowRef = useRef<HTMLDivElement | null>(null)

  // Shared by the pointer and keyboard handlers below — converts a real
  // seconds value into whatever `onSeek` (i.e. `usePlayerAudio.seekTo`)
  // itself expects, clamped to a valid position within the *actual*
  // current track. A `duration` that hasn't loaded yet (`0`, or any other
  // non-finite/non-positive value) has no valid range to clamp into, so
  // this is a no-op rather than seeking to a nonsensical `0`-length range.
  const seekToClamped = (time: number) => {
    if (!(duration > 0)) return
    onSeek(Math.min(duration, Math.max(0, time)))
  }

  // The one place `clientX` → track time is actually computed — reused by
  // both the pointer handler (from the real event's own `clientX`) and
  // nothing else; keyboard stepping below works in seconds directly
  // instead, since it has no pointer position to convert. Reads the row's
  // own live `getBoundingClientRect()` at the moment of the event (never a
  // cached measurement), per this task's own explicit formula.
  const handlePointerSeek = (clientX: number) => {
    const row = rowRef.current
    if (!row) return
    const rect = row.getBoundingClientRect()
    if (rect.width <= 0) return
    const relativePosition = (clientX - rect.left) / rect.width
    seekToClamped(relativePosition * duration)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      seekToClamped(currentTime - ARROW_KEY_SEEK_SECONDS)
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      seekToClamped(currentTime + ARROW_KEY_SEEK_SECONDS)
    }
  }

  useEffect(() => {
    if (!analyser) return
    return analyser.subscribe((scales) => {
      const bars = barRefs.current
      for (let index = 0; index < BAR_COUNT; index++) {
        const bar = bars[index]
        if (!bar) continue
        const scale = scales[index] ?? 1
        // Clamped to a `6%..100%` range: the same visible-sliver floor
        // (`Math.max(height * 100, 6)`) this file's static render already
        // used for a bar whose own measured height rounds near zero, and a
        // 100% ceiling so a loud/bassy peak's scale multiplier can never
        // push a bar taller than this row's own fixed 42px box (there is
        // no `overflow-hidden` here — see round three's doc comment on why
        // this row is bottom-anchored, not clipped — so an unclamped bar
        // could otherwise visibly overlap the title/artist text above it).
        const heightPercent = Math.min(100, Math.max(BAR_HEIGHTS[index] * scale * 100, 6))
        bar.style.height = `${heightPercent}%`
      }
    })
  }, [analyser])

  return (
    <div className="flex w-full flex-col items-center gap-[8px]">
      <div
        ref={rowRef}
        role="slider"
        aria-label={t.player.controls.seek}
        aria-valuemin={0}
        aria-valuemax={duration > 0 ? duration : 0}
        aria-valuenow={currentTime}
        aria-valuetext={`${elapsedLabel} of ${durationLabel} played`}
        tabIndex={0}
        onPointerDown={(event) => handlePointerSeek(event.clientX)}
        onKeyDown={handleKeyDown}
        // Mobile-only invisible hit-area growth (`before:-top-[1px]
        // before:-bottom-[1px]`, reset to `0` at `lg:`) — takes this row's
        // real ~42px touch target to ~44px without changing its own
        // rendered height by a single pixel; see this file's own doc
        // comment above for why Desktop instead only gets `cursor-pointer`.
        className="relative flex h-[42px] w-full cursor-pointer items-end justify-between gap-[3px] before:absolute before:inset-x-0 before:-top-[1px] before:-bottom-[1px] before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:before:top-0 lg:before:bottom-0"
      >
        {BAR_HEIGHTS.slice(0, BAR_COUNT).map((height, index) => (
          <span
            key={index}
            ref={(el) => {
              barRefs.current[index] = el
            }}
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
