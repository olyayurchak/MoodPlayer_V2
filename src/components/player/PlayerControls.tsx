import type { CSSProperties } from "react"
import { liquidVars, type MoodSpectrum, type PlayerMoodAccent } from "../../data/playerMoodAccent"
import { copy as t } from "../../content/copy"
import { NextIcon, PauseGlyph, PlayGlyph, PreviousIcon, RepeatIcon, ShuffleIcon, VolumeIcon } from "./icons"

/** Existing approved accent used elsewhere for an active/highlighted
 *  gradient-adjacent state (`index.css`'s `.cta-border-svg__track`'s own
 *  `stroke: #d8b9ff`) — reused verbatim here for shuffle/repeat's "on"
 *  tint rather than inventing a new accent color for this one state. */
const ACTIVE_ACCENT_CLASS = "text-[#d8b9ff]"

const ICON_BUTTON_BASE =
  "flex items-center justify-center rounded-full bg-[rgba(173,153,219,0.08)] text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"

// Shuffle/Repeat's own approved Figma size is 36px on both breakpoints —
// fine for Desktop's mouse-driven pointer, but under Guidelines §12's
// "at least 44×44px" mobile touch-target minimum. Rather than shrink the
// *icon* to match a 44px circle (changing its Desktop appearance too),
// only the button's own hit area grows below `lg`; the icon itself and
// the surrounding 48px Previous/Next buttons are unaffected either way.

/**
 * Shuffle / Previous / Play-Pause / Next / Repeat row, plus the volume
 * slider beneath it — the "Central player" transport controls from the
 * approved Figma frames. Sizes are identical on Mobile and Desktop in
 * both approved frames (36px shuffle/repeat, 48px previous/next, 76px
 * play/pause), so this component itself carries no `lg:` breakpoint
 * logic — only its caller's surrounding layout differs per breakpoint.
 *
 * Shuffle/Repeat are now fully real playback modes too, controlled the
 * exact same way Play/Pause/Volume/Previous/Next already are —
 * `isShuffleOn`/`isRepeatOn` and their own `onToggleShuffle`/
 * `onToggleRepeat` handlers all live in `PlayerScreen`, not as local state
 * here. They used to be local `useState` in this component — one
 * independent copy per Mobile/Desktop `PlayerControls` instance, harmless
 * while nothing but their own tint read that state, but exactly the same
 * "two independent copies can desync across a breakpoint resize" bug this
 * file's own doc comment already describes Play/Pause/Volume/Previous/Next
 * being lifted to avoid (see below) — lifting these last two closes that
 * same gap now that real shuffle/repeat playback logic (`PlayerScreen`'s
 * own shuffle queue/history and repeat-at-end-of-playlist handling — see
 * that file's own doc comments) actually drives them. This component still
 * owns nothing but the `aria-pressed`/tint rendering; both toggles are
 * called on click, never touching local state here, same as every other
 * control in this row.
 * - Previous/Next are real `<button>`s wired to `PlayerScreen`'s own
 *   `onPrevious`/`onNext` handlers (which own the actual Previous
 *   3-second-threshold restart-vs-switch decision and the Next
 *   end-of-queue guard — see that screen's own doc comment), each with a
 *   real `disabled` attribute (`previousDisabled`/`nextDisabled`) rather
 *   than a `<div>` click target — keyboard-reachable, correctly
 *   announced, and (via `disabled:opacity-40`) visually distinguishable
 *   from an enabled control without any other change to this row's
 *   layout.
 *
 * Play/Pause and Volume are now fully controlled by the caller
 * (`PlayerScreen`'s own `usePlayerAudio` — see that hook's own doc
 * comment for why the real `<audio>` element it owns lives up there,
 * shared by both this screen's Mobile/Desktop `PlayerControls` copies,
 * rather than one independent `<audio>` per copy):
 * - `isPlaying` drives the glyph swap and `aria-pressed`, and reflects
 *   the real `<audio>` element's own state (its `play`/`pause`/`ended`
 *   events, not just "we clicked the button"), so a failed `play()`
 *   (autoplay policy, a missing source) never shows a stuck "playing"
 *   glyph the audio itself never actually reached.
 * - `onTogglePlay` is called on click; it never touches local state here.
 * - `volume`/`onVolumeChange` are the same native `<input type="range">`
 *   as before (0–100, genuinely keyboard- and screen-reader-accessible),
 *   now reporting to and reading from the real `HTMLAudioElement.volume`
 *   (converted to/from its own 0–1 range one level up) instead of a
 *   local number nothing else ever read.
 *
 * `accent` (`data/playerMoodAccent.ts`, `undefined` for any mood without
 * its own approved override yet) swaps the Play/Pause button's fill and
 * the volume slider's filled-track gradient from the universal Mood
 * Gradient to that mood's own approved gradient — the same two spots
 * `PlayerWaveform`'s own `accent` prop covers for the waveform's played
 * bars.
 */
export default function PlayerControls({
  accent,
  isPlaying,
  onTogglePlay,
  playDisabled,
  volume,
  onVolumeChange,
  onPrevious,
  previousDisabled,
  onNext,
  nextDisabled,
  isShuffleOn,
  onToggleShuffle,
  isRepeatOn,
  onToggleRepeat,
  layout = "default",
  spectrum,
  liquid,
}: {
  accent?: PlayerMoodAccent
  isPlaying: boolean
  onTogglePlay: () => void
  /** `true` once the current track's source is confirmed unplayable
   *  (`usePlayerAudio`'s own `"error"` status) — disables the Play/Pause
   *  button so clicking it can't look like it should do something when
   *  nothing can play, without changing any of the button's own visual
   *  classes (a real `disabled` attribute only changes default browser
   *  interaction affordances, not this app's own styling). */
  playDisabled?: boolean
  /** `0–100`, this control's own existing slider range — unrelated to
   *  `HTMLAudioElement.volume`'s own `0–1` range; `PlayerScreen` converts
   *  at the boundary so this component's own markup/behavior stays
   *  exactly as it already was. */
  volume: number
  onVolumeChange: (volume: number) => void
  /** `PlayerScreen`'s own Previous handler — the 3-second-threshold
   *  restart-vs-switch decision lives entirely up there (see that
   *  screen's own doc comment); this component only ever forwards the
   *  click. */
  onPrevious: () => void
  /** `true` only at the very first track within its own first few
   *  seconds (see `PlayerScreen`'s own `previousDisabled`) — same plain
   *  `disabled` attribute technique as `playDisabled` above, no new
   *  visual classes. */
  previousDisabled?: boolean
  /** `PlayerScreen`'s own Next handler. */
  onNext: () => void
  /** `true` only at the final track (normal order) or once a shuffled
   *  cycle is exhausted, and only when Repeat is off in either case — see
   *  `PlayerScreen`'s own `nextDisabled`; Repeat wraps/reshuffles instead
   *  of stopping, so Next never disables while Repeat is on. */
  nextDisabled?: boolean
  /** Whether Shuffle mode is currently on — drives this button's own
   *  `aria-pressed`/tint exactly like `isPlaying` does for Play/Pause; the
   *  actual shuffled-order/history logic lives entirely in `PlayerScreen`
   *  (see that file's own doc comments). */
  isShuffleOn: boolean
  onToggleShuffle: () => void
  /** Whether playlist Repeat is currently on — same "just reflect it"
   *  role as `isShuffleOn` above; the actual repeat-at-end-of-playlist
   *  behavior lives in `PlayerScreen`. */
  isRepeatOn: boolean
  onToggleRepeat: () => void
  /** `"wide"` is the Desktop Player's Now Playing column (Figma node
   *  `549:1194`/`549:1225`, 479px wide): the transport row keeps Figma's
   *  centred 328px group (16px inner gaps) instead of spreading to the
   *  column edges, rows sit 28px apart, and the volume row's 44px hit
   *  area is pulled back (`-my-[12px]`) to Figma's 20px layout height.
   *  `"default"` is the original layout (Mobile). Markup and behavior are
   *  otherwise identical. */
  layout?: "default" | "wide"
  /** Desktop gradient hierarchy (`PLAYER_SPECTRUM`): when set, Play gets
   *  the volume fill becomes a flat `mid` accent. Unset (Mobile) keeps
   *  the original treatment. */
  spectrum?: MoodSpectrum
  /** Desktop Play's liquid-gradient colours (`PLAY_LIQUID`) — separate
   *  from `spectrum` so Happy's Play keeps its original orange → coral →
   *  red. The filled volume progress uses the same palette as a softer
   *  drifting layer (`.liquid-soft--volume`). */
  liquid?: MoodSpectrum
}) {
  const isWide = layout === "wide"

  return (
    // The gap here is the only spacing between this component's two rows
    // (playback buttons, volume) — Figma node `290:9501` puts this same
    // gap at 28px (its buttons row ends at absolute y=294, its volume
    // row starts at y=322: 322−294=28), a deliberate jump from the tight
    // 10px this codebase originally used, and Figma places the volume
    // row's own bottom edge (y=342) flush with the album artwork's own
    // bottom edge (also y=342 — the artwork is exactly this row's height,
    // by design). This codebase's own title-to-waveform gap already sits
    // at 29px where that same Figma frame uses 36px (an existing, out-of-
    // scope-here difference — waveform/title are both on this task's own
    // "do not change" list), which makes everything above this component
    // render shorter than Figma's own stack — so Figma's raw 28px number
    // alone doesn't land the volume row's bottom edge on the artwork's
    // own bottom edge in this actual rendered layout.
    //
    // A first pass (22px) measured that shortfall directly and closed it
    // to within ~0.2px of exact — but a follow-up visual comparison
    // against Figma judged that result still slightly high, asking for a
    // further ~12–14px of additional drop (deliberately overshooting
    // flush alignment, matching Figma's own visual weighting rather than
    // this component's raw measured geometry). This value (35px = 22 +
    // 13, the middle of that requested range) is that second, smallest
    // adjustment on top of the first — not a re-measurement from scratch.
    <div className={`flex w-full flex-col items-center ${isWide ? "gap-[28px]" : "gap-[35px]"}`}>
      <div className={`flex items-center justify-between ${isWide ? "w-[328px]" : "w-full"}`}>
        <button
          type="button"
          onClick={onToggleShuffle}
          aria-pressed={isShuffleOn}
          aria-label={t.player.controls.shuffle}
          className={`${ICON_BUTTON_BASE} size-[44px] lg:size-[36px] ${isShuffleOn ? ACTIVE_ACCENT_CLASS : ""}`}
        >
          <ShuffleIcon size={20} />
        </button>

        <div className={`flex items-center ${isWide ? "gap-[16px]" : "gap-[12px]"}`}>
          <button
            type="button"
            onClick={onPrevious}
            disabled={previousDisabled}
            aria-label={t.player.controls.previous}
            className={`${ICON_BUTTON_BASE} size-[48px] disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <PreviousIcon size={24} />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            disabled={playDisabled}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? t.player.controls.pause : t.player.controls.play}
            style={
              liquid
                ? ({
                    "--liquid-a": liquid.start,
                    "--liquid-b": liquid.mid,
                    "--liquid-c": liquid.end,
                  } as CSSProperties)
                : accent
                  ? { backgroundImage: accent.gradient }
                  : undefined
            }
            className={`flex size-[76px] items-center justify-center rounded-full text-white shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              liquid ? "play-liquid" : accent ? "" : "bg-linear-to-r from-cta-button-from via-cta-button-via to-cta-button-to"
            }`}
          >
            {isPlaying ? <PauseGlyph size={28} /> : <PlayGlyph size={28} className="-translate-x-[1px]" />}
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            aria-label={t.player.controls.next}
            className={`${ICON_BUTTON_BASE} size-[48px] disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <NextIcon size={24} />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleRepeat}
          aria-pressed={isRepeatOn}
          aria-label={t.player.controls.repeat}
          className={`${ICON_BUTTON_BASE} size-[44px] lg:size-[36px] ${isRepeatOn ? ACTIVE_ACCENT_CLASS : ""}`}
        >
          <RepeatIcon size={20} />
        </button>
      </div>

      <div className={`flex w-full items-center gap-[10px] ${isWide ? "-my-[12px]" : ""}`}>
        <VolumeIcon size={20} className="shrink-0 text-white" muted={volume === 0} />
        {/* Wrapped in a `min-h-[44px] flex items-center` container so the
            real drag/tap target meets Guidelines §12's 44px mobile
            minimum — the visible track itself stays a slim 8px (matching
            the approved Figma proportions), the extra height is purely
            invisible padding, same "small visual, larger hit area"
            technique already used for Shuffle/Repeat above. */}
        <div className="relative flex min-h-[44px] w-full flex-1 items-center">
          {/* Desktop: the filled progress is a separate, track-shaped clip
              layer (`.liquid-soft--volume`) under the input, so its colours
              can drift while staying clipped to `volume`%; the input then
              paints only the unfilled track. */}
          {liquid && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/2 h-[8px] -translate-y-1/2 overflow-hidden rounded-full"
            >
              <span
                className="liquid-soft liquid-soft--volume block h-full"
                style={{ ...liquidVars(liquid), width: `${volume}%` }}
              />
            </span>
          )}
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            aria-label={t.player.controls.volume}
            className="relative h-[8px] w-full appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:size-[16px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1.5px_rgba(255,255,255,0.4)] [&::-moz-range-thumb]:size-[16px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
            style={{
              background: spectrum
                ? `linear-gradient(90deg, ${liquid ? "transparent" : spectrum.mid} ${volume}%, rgba(255,255,255,0.18) ${volume}%)`
                : accent
                ? `linear-gradient(90deg, ${accent.gradientFrom}, ${accent.gradientTo} ${volume}%, rgba(255,255,255,0.18) ${volume}%)`
                : `linear-gradient(90deg, var(--color-cta-button-from), var(--color-cta-button-to) ${volume}%, rgba(255,255,255,0.18) ${volume}%)`,
            }}
          />
        </div>
        <VolumeIcon size={20} className="shrink-0 text-white" />
      </div>
    </div>
  )
}
