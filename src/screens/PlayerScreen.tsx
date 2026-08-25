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

/** Fixed placeholder progress fraction matching `currentTrack`'s own
 *  placeholder elapsed/total labels ("1:24" of "3:56") — 84s / 236s. See
 *  `PlayerWaveform`'s own doc comment on why this is a static value, not
 *  a live-updating one, in this UI-foundation-only milestone. */
const PLACEHOLDER_PROGRESS = 84 / 236

/** A soft ambient glow behind the album artwork panel, reusing the exact
 *  RGB triple already backing the approved `--color-glow-purple` token
 *  (`index.css`) at low opacity — not a new color, and not Figma's own
 *  one-off indigo `box-shadow` value, which this replaces. `AppBackground`
 *  already supplies this screen's main ambient glow field (shared,
 *  unmodified, by every screen — see that component's own doc comment);
 *  this is a small additional accent specifically on the artwork panel
 *  itself, the one element Figma gives its own glow. */
const ARTWORK_GLOW_STYLE = { boxShadow: "0 0 40px 0 rgba(87, 32, 111, 0.45)" }

type PlayerScreenProps = {
  /** The mood the app already knows about — the same one Vibe Result's
   *  manual selector last confirmed (see `App.tsx`'s `handleStartPlaylist`).
   *  This screen doesn't own or duplicate that state; it just starts its
   *  own local `activeMood` (below) from whatever it's handed. */
  mood: MoodId
}

/**
 * The Player screen — UI foundation only (see this task's own brief: no
 * audio engine, no gesture recognition, no new playlist/audio-switching
 * logic). Reached from Vibe Result's "Start listening" CTA (`App.tsx`).
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
export default function PlayerScreen({ mood }: PlayerScreenProps) {
  const { t } = useLanguage()
  const [activeMood, setActiveMood] = useState<MoodId>(mood)

  useEffect(() => {
    setActiveMood(mood)
  }, [mood])

  const moodName = t.vibeResult.moods[activeMood].name

  return (
    <main className="relative flex min-h-[max(100dvh,var(--spacing-frame-h))] items-center justify-center overflow-hidden bg-bg-base p-[24px] lg:min-h-[max(100dvh,var(--spacing-frame-h-lg))]">
      <AppBackground />
      <div className="relative flex w-full max-w-[382px] flex-col gap-[24px] rounded-[24px] backdrop-blur-[20px] lg:max-w-[1242px] lg:gap-[64px] lg:border-[1.5px] lg:border-[rgba(255,255,255,0.12)] lg:bg-[rgba(118,118,118,0.08)] lg:p-[64px]">
        {/* ---------- Mobile (below `lg`) ---------- */}
        <div className="flex w-full flex-col items-center gap-[24px] lg:hidden">
          <div className="flex w-full items-center justify-between">
            <MoodPlayerLogo />
            <LanguageSwitcher />
          </div>

          <PlayerMoodSelector activeMood={activeMood} onSelect={setActiveMood} />

          <div
            className="relative size-[196px] shrink-0 overflow-hidden rounded-[16px]"
            style={{ ...gradientBorderStyle("2px"), ...ARTWORK_GLOW_STYLE }}
          >
            <img src={currentTrack.artwork} alt="" className="absolute inset-0 size-full object-cover" />
          </div>

          <div className="flex w-full flex-col items-center gap-[8px] text-center tracking-[-0.2px]">
            <p className="w-full text-[24px] font-medium leading-[1.2] text-white">{currentTrack.title}</p>
            <p className="w-full text-[16px] font-light leading-[1.4] text-[#cfcfcf]">{currentTrack.artist}</p>
          </div>

          <PlayerWaveform
            progress={PLACEHOLDER_PROGRESS}
            elapsedLabel={currentTrack.elapsedLabel ?? "0:00"}
            durationLabel={currentTrack.durationLabel}
          />

          <PlayerControls />

          <GestureControlsPanel />

          <UpNextPanel mood={moodName} tracks={upNextTracks} />
        </div>

        {/* ---------- Desktop (`lg` and up) ---------- */}
        <div className="hidden w-full flex-col gap-[64px] lg:flex">
          <div className="flex w-full items-center justify-between">
            <MoodPlayerLogo />
            <PlayerMoodSelector activeMood={activeMood} onSelect={setActiveMood} />
            <LanguageSwitcher />
          </div>

          <div className="flex w-full items-center gap-[32px]">
            <div className="flex w-[698px] shrink-0 flex-col gap-[42px]">
              <div className="flex w-full items-start gap-[31px]">
                <div
                  className="relative size-[342px] shrink-0 overflow-hidden rounded-[24px]"
                  style={{ ...gradientBorderStyle("2px"), ...ARTWORK_GLOW_STYLE }}
                >
                  <img src={currentTrack.artwork} alt="" className="absolute inset-0 size-full object-cover" />
                </div>

                <div className="flex w-[324px] flex-col items-center gap-[29px]">
                  <div className="flex w-full flex-col items-center gap-[12px] text-center tracking-[-0.2px]">
                    <p className="w-full text-[28px] font-medium leading-[1.2] text-white">{currentTrack.title}</p>
                    <p className="w-full text-[18px] font-light leading-[1.4] text-[#cfcfcf]">{currentTrack.artist}</p>
                  </div>

                  <PlayerWaveform
                    progress={PLACEHOLDER_PROGRESS}
                    elapsedLabel={currentTrack.elapsedLabel ?? "0:00"}
                    durationLabel={currentTrack.durationLabel}
                  />

                  <PlayerControls />
                </div>
              </div>

              <GestureControlsPanel />
            </div>

            <UpNextPanel mood={moodName} tracks={upNextTracks} />
          </div>
        </div>
      </div>
    </main>
  )
}
