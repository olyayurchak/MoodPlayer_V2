import { useEffect, useState } from "react"
import AppBackground from "../components/AppBackground"
import MoodPlayerLogo from "../components/MoodPlayerLogo"
import LanguageSwitcher from "../components/LanguageSwitcher"
import { gradientBorderStyle } from "../components/CameraPermissionVisual"
import PlayerMoodSelector from "../components/player/PlayerMoodSelector"
import PlayerWaveform from "../components/player/PlayerWaveform"
import PlayerControls from "../components/player/PlayerControls"
import GestureControlsPanel from "../components/player/GestureControlsPanel"
import UpNextPanel from "../components/player/UpNextPanel"
import { useLanguage } from "../localization/LanguageContext"
import type { MoodId } from "../data/moods"
import { currentTrack, upNextTracks } from "../data/playerTrack"
import { PLAYER_MOOD_ACCENTS } from "../data/playerMoodAccent"
import { formatPlaybackTime, usePlayerAudio } from "../hooks/usePlayerAudio"

/** Shared "how strong should the artwork glow feel" recipe — the same
 *  blur/spread/offset for every mood's artwork glow, whatever rgba color
 *  that mood itself uses (`ARTWORK_GLOW_STYLE`'s own color below for any
 *  mood without its own approved accent — currently Chill — or
 *  `accent.artworkGlowMobile`/`Desktop` for Happy/Melancholic). A first
 *  pass hardcoded `0 0 40px 0` separately at each of those call sites;
 *  centralizing it here is what lets later intensity-only requests touch
 *  one blur value instead of several duplicated shadow strings. 28px blur
 *  / 0 spread / no vertical offset — reads as a soft ambient glow, not a
 *  dominant halo, alongside each color's own alpha (normalized to 0.4
 *  across all three moods — see `ARTWORK_GLOW_STYLE` below and each
 *  mood's own `artworkGlowMobile`/`Desktop` in `data/playerMoodAccent.ts`
 *  for that normalization's own history) so the glow stays visually
 *  secondary to the artwork's own gradient ring, the track title, and the
 *  Play button/transport controls. */
function artworkGlowShadow(color: string) {
  return `0 0 28px 0 ${color}`
}

/** A soft ambient glow behind the album artwork panel, reusing the exact
 *  RGB triple already backing the approved `--color-glow-purple` token
 *  (`index.css`) at low opacity — not a new color, and not Figma's own
 *  one-off indigo `box-shadow` value, which this replaces. `AppBackground`
 *  supplies this screen's main ambient glow field — the shared universal
 *  set for any mood without its own approved override (below, `accent`
 *  passes Happy's own `backgroundGlows` through instead) — this is a
 *  small additional accent specifically on the artwork panel itself, the
 *  one element Figma gives its own glow. Alpha (0.4) matches the
 *  cross-mood glow-intensity normalization applied to Happy's and
 *  Melancholic's own `artworkGlowMobile`/`Desktop` in
 *  `data/playerMoodAccent.ts` — this is Chill's (and any other
 *  mood-without-its-own-accent's) equivalent, so all three read as
 *  equally strong even though only this one has no `PLAYER_MOOD_ACCENTS`
 *  entry yet. */
const ARTWORK_GLOW_STYLE = { boxShadow: artworkGlowShadow("rgba(87, 32, 111, 0.4)") }

/** The artwork panel's Happy-only gradient ring — same masked-gradient-
 *  ring technique (`mask-composite: exclude`) as the selected "Happy"
 *  mood-selector pill's ring and the Up Next current-track row's ring
 *  (`PlayerMoodSelector.tsx`/`UpNextPanel.tsx`), applied here instead of
 *  a real `border` so the artwork image itself keeps rendering at the
 *  panel's full `size-[196px]`/`size-[342px]` box rather than being
 *  inset by an actual border's own width. A first attempt used a real
 *  `border: 1.5px solid ${accent.artworkBorder*}` here, which read as one
 *  flat accent-color stroke rather than the full approved
 *  orange→coral→red gradient sweep Figma shows; this reuses the existing
 *  ring technique instead of that one-off solid border, matching every
 *  other Happy-only ring in this screen. */
function artworkRingStyle(gradient: string) {
  return {
    padding: "1.5px",
    background: gradient,
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude" as const,
  }
}

type PlayerScreenProps = {
  /** The mood the app already knows about — the same one Vibe Result's
   *  manual selector last confirmed (see `App.tsx`'s `handleStartPlaylist`).
   *  This screen doesn't own or duplicate that state; it just starts its
   *  own local `activeMood` (below) from whatever it's handed. */
  mood: MoodId
  /** Forwarded straight to both `MoodPlayerLogo` instances' own `onClick`
   *  (Mobile and Desktop each render their own copy of the header — see
   *  the doc comment above on why this screen uses two independent
   *  trees) — see `App.tsx`'s `handleLogoClick` for the actual "navigate
   *  to Intro" behavior; this screen has no navigation logic of its own. */
  onLogoClick?: () => void
}

/**
 * The Player screen. Reached from Vibe Result's "Start listening" CTA
 * (`App.tsx`). Real single-track playback exists (`usePlayerAudio`,
 * below) — no gesture recognition, per-mood playlists, queue/Next/
 * Previous, or shuffle/repeat logic yet, all still explicitly out of
 * scope for the milestone that added real audio.
 *
 * Approved Figma frames: Mobile `289:7420` (430×932 — a duplicated-and-
 * repurposed "iPhone 14 & 15 Pro Max - Intro" frame; its actual content is
 * the Player screen, not the Intro screen — confirmed by inspecting its
 * real content, not its stale layer name), Desktop `290:9470` (1440×1024,
 * "Frame 172"). Colors, gradients, ambient glow, borders, active states,
 * and the waveform are deliberately *not* copied from those frames verbatim
 * (their own accent is a flat `#c43a86` pink, an outdated palette per this
 * task's explicit instruction) — every one of those instead reuses this
 * app's own current approved system: `gradientBorderStyle`/`BORDER_GRADIENT`
 * (`CameraPermissionVisual.tsx`), the `--color-cta-button-from/via/to`
 * brand gradient, and the same glass-pill (`bg-[rgba(255,255,255,0.08)]` +
 * `backdrop-blur-[20px]`) treatment `VibeResultScreen.tsx` already
 * established. Layout, spacing, dimensions, and composition hierarchy
 * *do* come from those two frames.
 *
 * Two independent trees (`lg:hidden` / `hidden lg:flex`), not one tree with
 * `lg:` variants throughout — necessary here (unlike `VibeResultScreen`'s
 * single responsive tree) because Mobile and Desktop don't just resize the
 * same elements, they *reorder* them: Desktop's header is one row (logo |
 * mood selector | language), while Mobile splits that into two stacked
 * rows (logo+language, then the mood selector on its own) per this task's
 * own explicit required Mobile order. A single `lg:`-varianted tree can't
 * express "same three groups, different row structure" without duplicating
 * most of the markup anyway, so this follows `CameraPermissionVisual.tsx`'s
 * own established precedent for exactly this situation instead.
 *
 * `activeMood` is local UI state seeded from the `mood` prop (the same
 * "seed from a prop, re-sync if it ever changes while mounted" pattern
 * `VibeResultScreen.tsx` already uses for its own `selectedMood`) — the
 * header mood-selector pills can visually switch which of the three moods
 * is highlighted, matching this task's "same component structure supports
 * all three moods" requirement, but this never re-triggers a scan, never
 * mutates `App.tsx`'s own confirmed-mood state, and (no playlist logic
 * exists yet) never reloads a different playlist either.
 */
export default function PlayerScreen({ mood, onLogoClick }: PlayerScreenProps) {
  const { t } = useLanguage()
  const [activeMood, setActiveMood] = useState<MoodId>(mood)

  useEffect(() => {
    setActiveMood(mood)
  }, [mood])

  const moodName = t.vibeResult.moods[activeMood].name

  // `undefined` for any mood without its own approved accent yet
  // (currently Melancholic and Chill) — every component below already
  // treats that as "keep the existing universal Mood Gradient treatment
  // unchanged," so nothing here needs its own mood-by-mood branching.
  const accent = PLAYER_MOOD_ACCENTS[activeMood]

  // The one real `<audio>` element for `currentTrack`'s own `audioSrc` —
  // owned here, not inside either `PlayerControls` copy below, so both
  // the Mobile and Desktop transport rows (and both `PlayerWaveform`
  // copies) stay in sync with the exact same playback no matter which
  // breakpoint's tree is currently visible. See `usePlayerAudio`'s own
  // doc comment for the full reasoning.
  const audio = usePlayerAudio(currentTrack.audioSrc)
  const isPlaying = audio.status === "playing"
  const playDisabled = audio.status === "error"
  // `0–100` for `PlayerControls`' own existing slider range — converted
  // here, at the one boundary between this screen and the `0–1` range
  // `HTMLAudioElement.volume` (and this hook) actually use.
  const volume = Math.round(audio.volume * 100)
  const handleVolumeChange = (next: number) => audio.setVolume(next / 100)

  // Real playback progress once metadata/time updates land; falls back
  // to the placeholder duration label (`data/playerTrack.ts`) only until
  // the browser reports a real `duration` — elapsed always reflects the
  // real `currentTime` (which starts at `0`, so no placeholder is needed
  // there), per this task's own "use real audio metadata for duration
  // where practical" requirement.
  const waveformProgress = audio.duration > 0 ? audio.currentTime / audio.duration : 0
  const elapsedLabel = formatPlaybackTime(audio.currentTime)
  const durationLabel = audio.duration > 0 ? formatPlaybackTime(audio.duration) : currentTrack.durationLabel

  return (
    <main className="relative flex min-h-[max(100dvh,var(--spacing-frame-h))] items-center justify-center overflow-hidden bg-bg-base p-[24px] lg:min-h-[max(100dvh,var(--spacing-frame-h-lg))]">
      <AppBackground mobileGlows={accent?.backgroundGlows.mobile} desktopGlows={accent?.backgroundGlows.desktop} />
      <div className="relative flex w-full max-w-[382px] flex-col gap-[24px] rounded-[24px] backdrop-blur-[20px] lg:max-w-[1242px] lg:gap-[64px] lg:border-[1.5px] lg:border-[rgba(255,255,255,0.12)] lg:bg-[rgba(118,118,118,0.08)] lg:p-[64px]">
        {/* ---------- Mobile (below `lg`) ---------- */}
        <div className="flex w-full flex-col items-center gap-[24px] lg:hidden">
          <div className="flex w-full items-center justify-between">
            <MoodPlayerLogo onClick={onLogoClick} accent={accent} />
            <LanguageSwitcher />
          </div>

          <PlayerMoodSelector activeMood={activeMood} onSelect={setActiveMood} accent={accent} />

          <div
            className="relative size-[196px] shrink-0 overflow-hidden rounded-[16px]"
            style={accent ? { boxShadow: artworkGlowShadow(accent.artworkGlowMobile) } : { ...gradientBorderStyle("2px"), ...ARTWORK_GLOW_STYLE }}
          >
            <img src={currentTrack.artwork} alt="" className="absolute inset-0 size-full object-cover" />
            {accent && (
              <span
                aria-hidden="true"
                style={artworkRingStyle(accent.gradient)}
                className="pointer-events-none absolute inset-0 rounded-[16px]"
              />
            )}
          </div>

          <div className="flex w-full flex-col items-center gap-[8px] text-center tracking-[-0.2px]">
            <p className="w-full text-[24px] font-medium leading-[1.2] text-white">{currentTrack.title}</p>
            <p className="w-full text-[16px] font-light leading-[1.4] text-[#cfcfcf]">{currentTrack.artist}</p>
          </div>

          <PlayerWaveform
            progress={waveformProgress}
            elapsedLabel={elapsedLabel}
            durationLabel={durationLabel}
            accent={accent}
          />

          <PlayerControls
            accent={accent}
            isPlaying={isPlaying}
            onTogglePlay={audio.toggle}
            playDisabled={playDisabled}
            volume={volume}
            onVolumeChange={handleVolumeChange}
          />

          <GestureControlsPanel />

          <UpNextPanel mood={moodName} tracks={upNextTracks} accent={accent} />
        </div>

        {/* ---------- Desktop (`lg` and up) ---------- */}
        <div className="hidden w-full flex-col gap-[64px] lg:flex">
          <div className="flex w-full items-center justify-between">
            <MoodPlayerLogo onClick={onLogoClick} accent={accent} />
            <PlayerMoodSelector activeMood={activeMood} onSelect={setActiveMood} accent={accent} />
            <LanguageSwitcher />
          </div>

          <div className="flex w-full items-center gap-[32px]">
            <div className="flex w-[698px] shrink-0 flex-col gap-[42px]">
              <div className="flex w-full items-start gap-[31px]">
                <div
                  className="relative size-[342px] shrink-0 overflow-hidden rounded-[24px]"
                  style={accent ? { boxShadow: artworkGlowShadow(accent.artworkGlowDesktop) } : { ...gradientBorderStyle("2px"), ...ARTWORK_GLOW_STYLE }}
                >
                  <img src={currentTrack.artwork} alt="" className="absolute inset-0 size-full object-cover" />
                  {accent && (
                    <span
                      aria-hidden="true"
                      style={artworkRingStyle(accent.gradient)}
                      className="pointer-events-none absolute inset-0 rounded-[24px]"
                    />
                  )}
                </div>

                <div className="flex w-[324px] flex-col items-center gap-[29px]">
                  <div className="flex w-full flex-col items-center gap-[12px] text-center tracking-[-0.2px]">
                    <p className="w-full text-[28px] font-medium leading-[1.2] text-white">{currentTrack.title}</p>
                    <p className="w-full text-[18px] font-light leading-[1.4] text-[#cfcfcf]">{currentTrack.artist}</p>
                  </div>

                  <PlayerWaveform
                    progress={waveformProgress}
                    elapsedLabel={elapsedLabel}
                    durationLabel={durationLabel}
                    accent={accent}
                  />

                  <PlayerControls
                    accent={accent}
                    isPlaying={isPlaying}
                    onTogglePlay={audio.toggle}
                    playDisabled={playDisabled}
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                  />
                </div>
              </div>

              <GestureControlsPanel />
            </div>

            <UpNextPanel mood={moodName} tracks={upNextTracks} accent={accent} />
          </div>
        </div>
      </div>
    </main>
  )
}
