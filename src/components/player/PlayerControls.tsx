import { useState } from "react"
import type { PlayerMoodAccent } from "../../data/playerMoodAccent"
import { useLanguage } from "../../localization/LanguageContext"
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
 * Shuffle/Repeat/Previous/Next remain UI foundation only, per this task's
 * explicit scope (real single-track playback now exists — see below —
 * but per-mood playlists/queue-switching/shuffle/repeat *logic* don't):
 * - Shuffle/Repeat are real toggle buttons (`aria-pressed`, tinted when
 *   "on") holding their own local UI-only state, with no shuffle/repeat
 *   *logic* behind them (this placeholder "playlist" is one track
 *   repeated).
 * - Previous/Next are plain buttons with a real accessible name but no
 *   handler wired — there is exactly one placeholder track, so "skip" has
 *   nothing real to do yet; still real `<button>` elements (never `<div>`
 *   click targets), so they remain keyboard-reachable and correctly
 *   announced, matching this task's "real semantic buttons" requirement.
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
}) {
  const { t } = useLanguage()
  const [isShuffleOn, setIsShuffleOn] = useState(false)
  const [isRepeatOn, setIsRepeatOn] = useState(false)

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
    <div className="flex w-full flex-col items-center gap-[35px]">
      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={() => setIsShuffleOn((on) => !on)}
          aria-pressed={isShuffleOn}
          aria-label={t.player.controls.shuffle}
          className={`${ICON_BUTTON_BASE} size-[44px] lg:size-[36px] ${isShuffleOn ? ACTIVE_ACCENT_CLASS : ""}`}
        >
          <ShuffleIcon size={20} />
        </button>

        <div className="flex items-center gap-[12px]">
          <button
            type="button"
            aria-label={t.player.controls.previous}
            className={`${ICON_BUTTON_BASE} size-[48px]`}
          >
            <PreviousIcon size={24} />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            disabled={playDisabled}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? t.player.controls.pause : t.player.controls.play}
            style={accent ? { backgroundImage: accent.gradient } : undefined}
            className={`flex size-[76px] items-center justify-center rounded-full text-white shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              accent ? "" : "bg-linear-to-r from-cta-button-from via-cta-button-via to-cta-button-to"
            }`}
          >
            {isPlaying ? <PauseGlyph size={28} /> : <PlayGlyph size={28} className="translate-x-[1px]" />}
          </button>

          <button type="button" aria-label={t.player.controls.next} className={`${ICON_BUTTON_BASE} size-[48px]`}>
            <NextIcon size={24} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsRepeatOn((on) => !on)}
          aria-pressed={isRepeatOn}
          aria-label={t.player.controls.repeat}
          className={`${ICON_BUTTON_BASE} size-[44px] lg:size-[36px] ${isRepeatOn ? ACTIVE_ACCENT_CLASS : ""}`}
        >
          <RepeatIcon size={20} />
        </button>
      </div>

      <div className="flex w-full items-center gap-[10px]">
        <VolumeIcon size={20} className="shrink-0 text-white" muted={volume === 0} />
        {/* Wrapped in a `min-h-[44px] flex items-center` container so the
            real drag/tap target meets Guidelines §12's 44px mobile
            minimum — the visible track itself stays a slim 8px (matching
            the approved Figma proportions), the extra height is purely
            invisible padding, same "small visual, larger hit area"
            technique already used for Shuffle/Repeat above. */}
        <div className="flex min-h-[44px] w-full flex-1 items-center">
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            aria-label={t.player.controls.volume}
            className="h-[8px] w-full appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:size-[16px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1.5px_rgba(255,255,255,0.4)] [&::-moz-range-thumb]:size-[16px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
            style={{
              background: accent
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
