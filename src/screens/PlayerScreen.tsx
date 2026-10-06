import { useEffect, useRef, useState } from "react"
import AppBackground from "../components/AppBackground"
import MoodPlayerLogo from "../components/MoodPlayerLogo"
import { gradientBorderStyle } from "../components/CameraPermissionVisual"
import PlayerMoodSelector from "../components/player/PlayerMoodSelector"
import PlayerWaveform, { BAR_COUNT } from "../components/player/PlayerWaveform"
import PlayerControls from "../components/player/PlayerControls"
import GestureControlsPanel from "../components/player/GestureControlsPanel"
import ChooseVibeCard from "../components/player/ChooseVibeCard"
import UpNextPanel from "../components/player/UpNextPanel"
import MobileUpNextSheet from "../components/player/MobileUpNextSheet"
import { copy as t } from "../content/copy"
import type { MoodId } from "../data/moods"
import { testTracks } from "../data/playerTrack"
import { PLAYER_MOOD_ACCENTS, PLAYER_SPECTRUM, PLAY_LIQUID, liquidVars } from "../data/playerMoodAccent"
import { formatPlaybackTime, usePlayerAudio } from "../hooks/usePlayerAudio"
import { useWaveformAnalyser } from "../hooks/useWaveformAnalyser"

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

/** Previous's own "restart vs. actually go back" threshold, per this
 *  milestone's explicit spec: past this many seconds into the current
 *  track, Previous restarts it at `0:00` instead of switching tracks —
 *  the usual media-player convention (a press well into a track almost
 *  never means "I meant the *previous* track", it means "start this one
 *  over"). Below/at this threshold (and only if an earlier track exists),
 *  Previous switches back instead. */
const PREVIOUS_RESTART_THRESHOLD_SECONDS = 3

/**
 * Returns a random permutation of every valid `testTracks` index (Fisher–
 * Yates), then — when there's an actual alternative (`length > 1`) —
 * guarantees the *first* entry never equals `excludeIndex` by swapping it
 * with the second one if it landed there. `excludeIndex` is always the
 * track already playing when a new shuffled run starts (either Shuffle
 * just turned on, or the previous shuffled cycle just finished), which is
 * exactly this feature's own "don't immediately repeat the current track
 * when alternatives exist" requirement — a single targeted swap, not a
 * rejection-sampling loop, since one swap is enough to fix the only
 * position that can ever violate it (every position deeper in the array is
 * already guaranteed different from `excludeIndex` because Fisher–Yates
 * produces a permutation with no duplicates). */
function buildShuffleQueue(excludeIndex: number): number[] {
  const indices = testTracks.map((_, index) => index)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  if (indices.length > 1 && indices[0] === excludeIndex) {
    ;[indices[0], indices[1]] = [indices[1], indices[0]]
  }
  return indices
}

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
function artworkRingStyle(gradient: string | undefined, thickness = "1.5px") {
  return {
    padding: thickness,
    ...(gradient ? { background: gradient } : {}),
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
 * (`App.tsx`). Real playback exists (`usePlayerAudio`, below), including
 * real Shuffle/Repeat playback modes (`isShuffleOn`/`isRepeatOn` and the
 * shuffle queue/history/`"ended"`-auto-advance logic further down this
 * file) — no gesture recognition or per-mood playlists yet, still
 * explicitly out of scope.
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
 * own established precedent for exactly this situation instead. Up Next
 * itself now genuinely diverges between the two trees for the same
 * reason: Mobile renders `MobileUpNextSheet` (a draggable bottom sheet,
 * portaled to `document.body` — see that component's own doc comment),
 * Desktop keeps rendering the plain `UpNextPanel` it always has, fully
 * unchanged; both are still driven by this same `currentTrackIndex`/
 * `selectTrack` below, never a second independent copy of that state.
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
  // Desktop gradient hierarchy (Play → artwork → selected states → flat volume).
  const spectrum = PLAYER_SPECTRUM[activeMood]
  const liquid = PLAY_LIQUID[activeMood]

  // Real Previous/Next state — an index into `testTracks` (see that
  // file's own doc comment for why it replaced the old single static
  // `currentTrack` + cloned `upNextTracks`). Owned here, not inside
  // `UpNextPanel`/`PlayerControls`, for the same "one shared source of
  // truth above both the Mobile and Desktop trees" reason `usePlayerAudio`
  // itself is owned here (see that hook's own doc comment).
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const currentTrack = testTracks[currentTrackIndex]
  const isFirstTrack = currentTrackIndex === 0
  const isLastTrack = currentTrackIndex === testTracks.length - 1

  // Shuffle/Repeat playback modes — both off by default (no persisted
  // preference exists anywhere in this codebase to read instead), lifted
  // here rather than left as `PlayerControls`' own former local UI-only
  // state for the same "one shared source of truth above both the Mobile
  // and Desktop trees" reason every other piece of playback state already
  // is (see `usePlayerAudio`'s own doc comment) — both breakpoints' own
  // `PlayerControls` copy below are now fully controlled for these two,
  // matching Play/Pause/Volume/Previous/Next.
  const [isShuffleOn, setIsShuffleOn] = useState(false)
  const [isRepeatOn, setIsRepeatOn] = useState(false)

  // Shuffle's own upcoming order for the *current* shuffled cycle (front
  // of the array is the next track Next/auto-advance will pick) and the
  // real history of tracks actually played while shuffled (used by
  // Previous, below, instead of a fixed "index − 1" — an actual shuffled
  // order has no well-defined "previous" without remembering where
  // playback really came from). Plain `useState`, not a ref: both directly
  // gate this screen's own `nextDisabled`/`previousDisabled` (a shuffled
  // cycle that's run out, with Repeat off, must visibly disable Next the
  // same way reaching the last track already does normally), which needs
  // to be reactive — a ref mutation alone wouldn't force that re-render.
  // Both arrays stay tiny (never longer than `testTracks.length`), so
  // plain state here carries no meaningful cost.
  const [shuffleQueue, setShuffleQueue] = useState<number[]>([])
  const [shuffleHistory, setShuffleHistory] = useState<number[]>([])

  // The one real `<audio>` element for `currentTrack`'s own `audioSrc` —
  // owned here, not inside either `PlayerControls` copy below, so both
  // the Mobile and Desktop transport rows (and both `PlayerWaveform`
  // copies) stay in sync with the exact same playback no matter which
  // breakpoint's tree is currently visible. See `usePlayerAudio`'s own
  // doc comment for the full reasoning. A `currentTrackIndex` change
  // (Next/Previous switching tracks) changes `currentTrack.audioSrc`,
  // which is exactly the `src` this hook recreates its element around —
  // see that hook's own `wasPlayingRef` for how it resumes playback
  // across that recreation when the previous track was playing.
  const audio = usePlayerAudio(currentTrack.audioSrc)
  const isPlaying = audio.status === "playing"
  const playDisabled = audio.status === "error"

  // Live `prefers-reduced-motion`, re-checked on the OS setting's own
  // `change` event (unlike `useFadeTransition.ts`'s one-shot check at the
  // start of a transition, this hook's own animation loop is long-lived —
  // it needs to notice a mid-session setting change, not just whatever was
  // true when the Player first mounted).
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleChange = () => setReducedMotion(query.matches)
    query.addEventListener("change", handleChange)
    return () => query.removeEventListener("change", handleChange)
  }, [])

  // The one shared real-audio waveform analyser for both `PlayerWaveform`
  // copies below — see that hook's own doc comment for why exactly one
  // instance lives here, alongside `usePlayerAudio` itself.
  const waveformAnalyser = useWaveformAnalyser({
    getAudioElement: audio.getAudioElement,
    src: currentTrack.audioSrc,
    isPlaying,
    barCount: BAR_COUNT,
    reducedMotion,
  })

  // Both `PlayerControls` copies' own Play/Pause button call this instead
  // of `audio.toggle` directly — `ensureStarted` must run synchronously
  // inside this real click handler, the same call stack as the user's own
  // gesture, for the `AudioContext` autoplay-resume policy Guidelines §8/
  // §12 call out (see `useWaveformAnalyser`'s own doc comment for the full
  // reasoning); it never affects whether playback itself starts, only
  // whether the waveform's own analyser is wired up to see it.
  const handleTogglePlay = () => {
    waveformAnalyser.ensureStarted()
    audio.toggle()
  }
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

  // Shared by the Next button and the real end-of-track auto-advance
  // (below) — the one place shuffled navigation actually happens, so
  // neither path can ever drift into its own separate shuffle logic.
  // `forceResume` is `true` only from the auto-advance path (see that
  // effect's own doc comment on why "the track ended" must force
  // playback to continue regardless of the real element's own paused
  // state); the Next *button* always passes `false`, preserving this
  // screen's existing "Next while paused stays paused" behavior exactly.
  const advanceShuffled = (forceResume: boolean) => {
    let queue = shuffleQueue
    if (queue.length === 0) {
      // This shuffled cycle just ran out. With Repeat off, that's this
      // feature's own explicit "existing end-of-playlist behavior" — do
      // nothing, the same as Next already no-ops on the final track in
      // normal order. With Repeat on, start a brand new valid shuffled
      // cycle (excluding an immediate repeat of the track that just
      // finished the previous one) rather than stopping.
      if (!isRepeatOn) return
      queue = buildShuffleQueue(currentTrackIndex)
    }
    const [nextIndex, ...rest] = queue
    setShuffleHistory((history) => [...history, currentTrackIndex])
    setShuffleQueue(rest)
    if (forceResume) audio.resumeOnNextTrack()
    setCurrentTrackIndex(nextIndex)
  }

  // Next: shuffled order while Shuffle is on (`advanceShuffled`, above);
  // otherwise the original normal-order behavior, now also wrapping back
  // to the first track when Repeat is on instead of always no-op'ing at
  // the final track. Playback state itself needs no explicit handling in
  // either branch: `usePlayerAudio`'s own `wasPlayingRef` already resumes
  // automatically once the new track is ready if (and only if) the
  // *previous* track was actually playing, and stays paused otherwise —
  // this handler only ever needs to move the index.
  const handleNext = () => {
    if (isShuffleOn) {
      advanceShuffled(false)
      return
    }
    if (isLastTrack) {
      if (isRepeatOn) setCurrentTrackIndex(0)
      return
    }
    setCurrentTrackIndex((index) => index + 1)
  }

  // Previous: a 3-second threshold still decides "restart the current
  // track" vs. "switch to the previous track" — never both, and unchanged
  // by Shuffle/Repeat. Below that threshold, Shuffle follows *actual
  // playback history* (`shuffleHistory`, above) rather than "index − 1":
  // a shuffled order has no well-defined previous-by-position, only
  // wherever playback actually came from. `seekTo(0)` (not a `src`/index
  // change) is used for both the restart branch and the "no history yet"
  // fallback specifically because it must *not* recreate the `<audio>`
  // element: a real switch already correctly preserves playing/paused
  // state via `usePlayerAudio`'s own resume-on-switch logic, but a
  // restart should just as clearly *keep whatever was already playing*
  // (or stay paused) without ever pausing/reloading the element that
  // logic would otherwise trigger.
  const handlePrevious = () => {
    if (audio.currentTime > PREVIOUS_RESTART_THRESHOLD_SECONDS) {
      audio.seekTo(0)
      return
    }
    if (isShuffleOn) {
      if (shuffleHistory.length === 0) {
        audio.seekTo(0)
        return
      }
      const previousIndex = shuffleHistory[shuffleHistory.length - 1]
      setShuffleHistory((history) => history.slice(0, -1))
      setCurrentTrackIndex(previousIndex)
      return
    }
    if (isFirstTrack) return
    setCurrentTrackIndex((index) => index - 1)
  }

  // Previous is disabled/no-op only within its own first
  // `PREVIOUS_RESTART_THRESHOLD_SECONDS` — past that threshold it always
  // has *something* to do (restart), even on the first track/with no
  // history yet. Below that threshold: normally only the very first track
  // disables it; while Shuffle is on, "no history yet" (nothing to go
  // back to) is the equivalent condition instead of `isFirstTrack`, which
  // has no real meaning once order isn't sequential.
  const previousDisabled =
    audio.currentTime <= PREVIOUS_RESTART_THRESHOLD_SECONDS &&
    (isShuffleOn ? shuffleHistory.length === 0 : isFirstTrack)
  // Next disables only when there is genuinely nothing left to advance
  // to: normal order at the final track with Repeat off, or a shuffled
  // cycle that's run out with Repeat off. Repeat being on always gives
  // Next something to do (wrap, or start a fresh shuffled cycle), so it
  // never disables Next in either mode.
  const nextDisabled = isShuffleOn ? shuffleQueue.length === 0 && !isRepeatOn : isLastTrack && !isRepeatOn

  // Shuffle toggling seeds a fresh shuffled cycle (excluding an immediate
  // repeat of whatever's currently playing) and clears playback history —
  // a clean slate each time Shuffle turns on, rather than resuming
  // whatever an earlier shuffle session happened to leave behind, which
  // would otherwise let a stale, already-consumed queue silently reappear.
  // Turning Shuffle off intentionally leaves the queue/history arrays
  // alone (simply unused while off) rather than clearing them — nothing
  // reads them in normal mode, and turning Shuffle back on already reseeds
  // both from scratch above.
  const handleToggleShuffle = () => {
    const next = !isShuffleOn
    setIsShuffleOn(next)
    if (next) {
      setShuffleQueue(buildShuffleQueue(currentTrackIndex))
      setShuffleHistory([])
    }
  }
  const handleToggleRepeat = () => setIsRepeatOn((on) => !on)

  // The real `<audio>` element's own `"ended"` event, surfaced here as
  // `audio.status === "ended"` — this is genuinely new: before Shuffle/
  // Repeat, nothing in this screen ever reacted to a track actually
  // finishing (the hook only recorded the state; Next/Previous were the
  // only things that ever moved `currentTrackIndex`). Repeat's "continue
  // from the start"/"start another shuffled cycle" behavior has nothing
  // to hook into without this, so it's added here rather than inside
  // `usePlayerAudio` itself, reusing this same screen's own navigation
  // logic (`advanceShuffled`/the normal-order branch below) instead of a
  // second, separate implementation.
  //
  // `handledEndedRef` guards against acting on the same "ended" occurrence
  // more than once: advancing here changes `currentTrackIndex`/
  // `shuffleQueue`, both of which this effect also depends on — so React
  // re-evaluates this effect on the very next render *before*
  // `usePlayerAudio`'s own `[src]` effect has had a chance to move
  // `status` away from `"ended"` (that only happens once the new
  // `Audio(src)` element is actually constructed, a render later). Without
  // this guard that intermediate re-run would see `status` still
  // `"ended"` and advance a *second* time off the same event.
  const handledEndedRef = useRef(false)
  useEffect(() => {
    if (audio.status !== "ended") {
      handledEndedRef.current = false
      return
    }
    if (handledEndedRef.current) return
    handledEndedRef.current = true

    if (isShuffleOn) {
      advanceShuffled(true)
      return
    }
    if (isLastTrack) {
      if (isRepeatOn) {
        audio.resumeOnNextTrack()
        setCurrentTrackIndex(0)
      }
      // Repeat off: retain the existing end-of-playlist behavior — stop.
      return
    }
    audio.resumeOnNextTrack()
    setCurrentTrackIndex((index) => index + 1)
  }, [audio.status, audio.resumeOnNextTrack, isShuffleOn, isRepeatOn, isLastTrack, currentTrackIndex, shuffleQueue])

  // "Current track and every track after it" — already-played tracks
  // never remain above the current one (this milestone's own explicit
  // Up Next requirement). `UpNextPanel` itself never reorders/filters
  // `tracks` any further; see that component's own doc comment.
  const upNextTracks = testTracks.slice(currentTrackIndex)

  // The Mobile Up Next sheet's own track-selection handler
  // (`MobileUpNextSheet`'s `onSelectTrack`) — the one small shared entry
  // point this feature's own scope explicitly allows extracting here,
  // rather than a second independent track-switching system living inside
  // that component. Reuses the exact same `currentTrackIndex` state (and,
  // through it, `usePlayerAudio`'s own existing resume-on-switch logic)
  // Next/Previous already drive — selecting a track is nothing more than
  // moving that same index directly instead of by ±1.
  const selectTrack = (trackId: string) => {
    // Already playing — do nothing, per this feature's own explicit
    // "selecting the already-current track should not unnecessarily
    // reload the audio source" requirement. Without this guard,
    // `setCurrentTrackIndex` would still be called with the *same* value
    // React already has, which wouldn't itself trigger a re-render — but
    // relying on that implementation detail rather than checking it
    // directly here would make the guarantee incidental, not guaranteed.
    if (trackId === currentTrack.id) return
    const index = testTracks.findIndex((track) => track.id === trackId)
    if (index === -1) return
    // While Shuffle is on, record where playback actually came from
    // (matching every other navigation path — Next, Previous, and the
    // auto-advance-on-`ended` effect above — per this feature's own
    // "all navigation paths use consistent behavior" requirement), so a
    // later Previous can back out of a manual jump the same way it backs
    // out of a shuffled Next.
    //
    // The just-selected track is also pulled out of the *pending* shuffle
    // queue here — it was left in place until now, which could let Next
    // immediately re-select the very track the user just manually chose
    // (a real duplicate in a small playlist: pick Track 3 by hand, press
    // Next, land right back on Track 3 because it was still sitting in
    // the queue). `filter` rather than a full reshuffle keeps every other
    // still-pending track in its already-decided order (this feature's
    // own "keep the remaining shuffled order intact rather than rebuild
    // the whole cycle" requirement) — removing one entry from an existing
    // permutation can't disturb the relative order of the rest. At most
    // one occurrence of `index` can ever be in the queue (it's built from
    // a permutation of every track index), so this never removes more
    // than the one real duplicate risk.
    if (isShuffleOn) {
      setShuffleHistory((history) => [...history, currentTrackIndex])
      setShuffleQueue((queue) => queue.filter((queuedIndex) => queuedIndex !== index))
    }
    setCurrentTrackIndex(index)
  }

  return (
    <main className="relative flex min-h-[max(100dvh,var(--spacing-frame-h))] items-center justify-center overflow-hidden bg-bg-base p-[24px] lg:min-h-[max(100dvh,var(--spacing-frame-h-lg))]">
      <AppBackground mobileGlows={accent?.backgroundGlows.mobile} desktopGlows={accent?.backgroundGlows.desktop} />
      <div className="relative flex w-full max-w-[382px] flex-col gap-[24px] rounded-[24px] backdrop-blur-[20px] lg:max-w-[1242px] lg:gap-[64px] lg:border-[1.5px] lg:border-[rgba(255,255,255,0.12)] lg:bg-[rgba(118,118,118,0.08)] lg:p-[64px]">
        {/* ---------- Mobile (below `lg`) ---------- */}
        {/* `pb-[56px]` — a measured audit found the last real content here
            (`GestureControlsPanel`, since `MobileUpNextSheet` right below
            it is portaled to `document.body` and takes up no space in
            this flow) overlapped the fixed, always-present collapsed Up
            Next sheet — its On/Off toggle's own *effective*, invisible-
            hit-area-inclusive bottom (`GestureControlsPanel.tsx`'s own
            `before:-bottom-[5px]`) sat ~19.8px past the sheet's top edge —
            at every Mobile viewport tested (375×667 through 430×932),
            including 430×932, the approved reference frame, where
            there's no scrolling at all: this isn't a "can't scroll far
            enough" bug, the collapsed sheet's 111px peek
            (`MobileUpNextSheet.tsx`'s own `PEEK_HEIGHT_PX`, unchanged by
            this fix) was never accounted for anywhere in this column's
            own layout.
            This whole column sits centered inside `<main>`'s own
            `min-h-[max(100dvh,932px)]` box (`justify-center` above,
            `items-center` on this row) — a fixed 932px document height on
            every Mobile viewport under test (confirmed via
            `document.documentElement.scrollHeight`), so adding bottom
            padding here doesn't push the page taller, it only reduces the
            equal empty space centering already leaves above and below
            this column: half of any added padding is "spent" pushing the
            column's *top* down less (i.e. the whole column shifts up by
            exactly half of whatever's added here — confirmed live as a
            uniform shift on every element checked: artwork,
            `PlayerControls`, `GestureControlsPanel` itself). That's why
            this is 56px, not the 111px full peek height the task
            explicitly warns against reserving outright: the minimum
            needed to turn the ~19.8px *effective* overlap into the
            requested ~8px of clearance is `(19.8 + 8) × 2 ≈ 55.7px`; 56px
            (a clean multiple of this codebase's own 8px spacing scale)
            rounds that up just enough, landing at ~8.2px measured
            clearance on the toggle's real invisible hit area rather than
            a sub-8px margin. Scoped to this `lg:hidden` Mobile-only
            column — Desktop never mounts this div, so `UpNextPanel`'s own
            layout (no fixed overlay, no overlap to begin with) is
            untouched. */}
        {/* `gap-[16px]` (was `gap-[24px]`) — the tighter mobile gap keeps
            the final `GestureControlsPanel` from overlapping the fixed
            Mobile Up Next sheet below it. */}
        <div className="flex w-full flex-col items-center gap-[16px] pb-[56px] lg:hidden">
          <div className="flex w-full items-center justify-between">
            <MoodPlayerLogo onClick={onLogoClick} accent={accent} />
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
            analyser={waveformAnalyser}
            currentTime={audio.currentTime}
            duration={audio.duration}
            onSeek={audio.seekTo}
          />

          <PlayerControls
            accent={accent}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            playDisabled={playDisabled}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            onPrevious={handlePrevious}
            previousDisabled={previousDisabled}
            onNext={handleNext}
            nextDisabled={nextDisabled}
            isShuffleOn={isShuffleOn}
            onToggleShuffle={handleToggleShuffle}
            isRepeatOn={isRepeatOn}
            onToggleRepeat={handleToggleRepeat}
          />

          <GestureControlsPanel />

          <MobileUpNextSheet
            mood={moodName}
            tracks={upNextTracks}
            currentTrackId={currentTrack.id}
            accent={accent}
            onSelectTrack={selectTrack}
          />
        </div>

        {/* ---------- Desktop (`lg` and up) ---------- */}
        {/* Figma node `549:1147`: header, then one 715px row of three zones —
            Now Playing (479px) · Up Next (479px) · utility rail (108px),
            24px apart (479 + 24 + 479 + 24 + 108 = this card's 1114px
            content width). Every piece is the same component/handler the
            previous Desktop layout used; only placement changed. The mood
            selector moved from the header into the rail's Choose Vibe card,
            and the gesture panel moved into the rail. */}
        <div className="hidden w-full flex-col gap-[64px] lg:flex">
          <div className="flex w-full items-center justify-between">
            <MoodPlayerLogo onClick={onLogoClick} accent={accent} liquid={liquid} />
          </div>

          <div className="flex w-full items-start gap-[24px]">
            {/* A. Now Playing — Figma `549:1164`: artwork 479×342, then
                title/artist, waveform (+36px), transport (+29px) and
                volume (+28px, inside `PlayerControls`) — 715px in total,
                level with the Up Next panel and the rail. */}
            <div className="flex w-[479px] shrink-0 flex-col gap-[31px]">
              <div
                className="relative h-[342px] w-full shrink-0 overflow-hidden rounded-[24px]"
                style={{ boxShadow: `0 0 20px 0 color-mix(in oklab, ${liquid.mid} 22%, transparent)` }}
              >
                <img src={currentTrack.artwork} alt="" className="absolute inset-0 size-full object-cover" />
                {/* Secondary tier of the desktop gradient hierarchy: a thin
                    1px edge in Play's palette (`.liquid-soft--ring`: 50%
                    opacity, slower 16s drift) plus a static, soft 20px halo
                    in the same palette's `mid` at 22% — refracted light,
                    well below Play. */}
                <span
                  aria-hidden="true"
                  style={{ ...artworkRingStyle(undefined, "1px"), ...liquidVars(liquid) }}
                  className="liquid-soft liquid-soft--ring pointer-events-none absolute inset-0 rounded-[24px]"
                />
              </div>

              <div className="flex w-full flex-col items-center">
                <div className="flex w-full flex-col items-center gap-[12px] text-center tracking-[-0.2px]">
                  <p className="w-full text-[36px] font-medium leading-[1.2] text-white">{currentTrack.title}</p>
                  <p className="w-full text-[20px] font-light leading-[1.4] text-[#cfcfcf]">{currentTrack.artist}</p>
                </div>

                <div className="mt-[36px] w-full">
                  <PlayerWaveform
                    progress={waveformProgress}
                    elapsedLabel={elapsedLabel}
                    durationLabel={durationLabel}
                    accent={accent}
                    analyser={waveformAnalyser}
                    currentTime={audio.currentTime}
                    duration={audio.duration}
                    onSeek={audio.seekTo}
                  />
                </div>

                <div className="mt-[29px] w-full">
                  <PlayerControls
                    layout="wide"
                    spectrum={spectrum}
                    liquid={liquid}
                    accent={accent}
                    isPlaying={isPlaying}
                    onTogglePlay={handleTogglePlay}
                    playDisabled={playDisabled}
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                    onPrevious={handlePrevious}
                    previousDisabled={previousDisabled}
                    onNext={handleNext}
                    nextDisabled={nextDisabled}
                    isShuffleOn={isShuffleOn}
                    onToggleShuffle={handleToggleShuffle}
                    isRepeatOn={isRepeatOn}
                    onToggleRepeat={handleToggleRepeat}
                  />
                </div>
              </div>
            </div>

            {/* B. Up Next — Figma `549:1243`, 479×715 (sized in `UpNextPanel`). */}
            <UpNextPanel mood={moodName} tracks={upNextTracks} currentTrackId={currentTrack.id} accent={accent} spectrum={spectrum} />

            {/* C. Utility rail — Figma `549:1330`: Choose Vibe (108×172) and
                Gesture Control (fills the rest), 12px apart. */}
            <div className="flex h-[715px] w-[108px] shrink-0 flex-col gap-[12px]">
              <ChooseVibeCard activeMood={activeMood} onSelect={setActiveMood} accent={accent} />
              <div className="min-h-0 w-full flex-1">
                <GestureControlsPanel variant="rail" palette={liquid} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
