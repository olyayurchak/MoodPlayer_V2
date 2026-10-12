import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Real playback states for the Player screen's one current track — the
 * first real audio engine this codebase has (every screen up to this
 * milestone left Play/Pause as local UI-only state with "no `<audio>`
 * element exists to actually play or pause," per `PlayerControls.tsx`'s
 * own former doc comment). Deliberately mirrors `Guidelines.md` §9's own
 * Audio state list (`idle`/`loading`/`buffering`/`playing`/`paused`/
 * `ended`/`unavailable source`/`playback error`) rather than a smaller ad
 * hoc set, collapsing `buffering` into `loading` (a real `<audio>` element
 * only ever reports one "not yet ready to play through" state via its own
 * events at this milestone's scope — Next/Previous/queue-switching, the
 * only thing that would need a distinct mid-playback rebuffer state, is
 * explicitly out of scope here) and `unavailable source`/`playback error`
 * into one `error` state (both mean the same thing to this hook's one
 * caller: nothing is playing and nothing can start until a working
 * `src` exists).
 */
export type PlayerAudioStatus = "idle" | "loading" | "ready" | "playing" | "paused" | "ended" | "error"

export type UsePlayerAudioResult = {
  status: PlayerAudioStatus
  /** Seconds, `0` until at least one `timeupdate`/seek has landed. */
  currentTime: number
  /** Seconds, `0` until the browser reports real `loadedmetadata` —
   *  callers should keep showing their own placeholder duration label
   *  until this becomes a positive number (see `PlayerScreen.tsx`). */
  duration: number
  /** `0–1`, matching `HTMLMediaElement.volume`'s own native range — kept
   *  separate from the 0–100 range `PlayerControls`' own volume slider
   *  UI uses; `PlayerScreen` converts at the boundary so this hook stays
   *  a plain wrapper around the real DOM API's own units, not the UI's. */
  volume: number
  /** Starts playback — a no-op (not a throw) if the source never loaded
   *  or already failed; `HTMLMediaElement.play()`'s own returned promise
   *  can reject for reasons outside this hook's control (autoplay
   *  policy, a since-removed source, etc.) — that rejection is caught and
   *  turned into `status: "error"` rather than an unhandled rejection,
   *  satisfying this milestone's "a missing/unplayable source does not
   *  crash the Player" requirement. An `AbortError` (a `pause()` that
   *  interrupted a still-loading `play()`) is ignored — see
   *  `startPlayback`. */
  play: () => void
  pause: () => void
  /** Whichever of `play`/`pause` is currently the *inverse* of the real
   *  `<audio>` element's own `paused` property — reads the element itself
   *  at call time rather than this hook's own `status` state, so a rapid
   *  double-click can never race ahead of a state update that hasn't
   *  committed yet. */
  toggle: () => void
  setVolume: (volume: number) => void
  /** Jumps the *current* element's own playback position without
   *  recreating it (unlike a `src` change) — a no-op if nothing has
   *  loaded yet. Added for `PlayerScreen`'s own Previous behavior
   *  ("restart the current track at `0:00`" past a threshold) rather
   *  than a generic scrub feature this milestone doesn't otherwise need. */
  seekTo: (seconds: number) => void
  /** Reads the *current* live `HTMLAudioElement` at call time (or `null`
   *  before the very first element has mounted) — a plain getter, not a
   *  piece of returned state, so reading it never itself causes a
   *  re-render. Added for `useWaveformAnalyser` (`PlayerScreen`'s own real-
   *  audio waveform): that hook needs to wire a Web Audio
   *  `MediaElementAudioSourceNode` to whichever element is *currently*
   *  live, including right after a track switch recreates it — a plain
   *  getter reading `audioRef` lets that hook re-check "is this the same
   *  element I already wired, or a new one from a track switch" at its own
   *  effect-run time without this hook needing to know Web Audio exists at
   *  all (see that hook's own doc comment for the full reasoning). */
  getAudioElement: () => HTMLAudioElement | null
  /** Marks the *next* `src` change (i.e. the next track switch) as one
   *  that should start playing regardless of whether the element being
   *  torn down was actually still playing at that moment — call this
   *  right before switching `currentTrackIndex` in response to the real
   *  `<audio>` element's own `"ended"` event (`PlayerScreen`'s Shuffle/
   *  Repeat auto-advance). Added specifically because `ended` always
   *  leaves `HTMLMediaElement.paused` `true` (per spec) the instant it
   *  fires — so the ordinary `wasPlayingRef` teardown logic below, which
   *  reads that real `.paused` value, would otherwise (correctly, for
   *  every *other* track-change reason) conclude "this track wasn't
   *  playing, don't resume" and leave a Repeat-driven "continue from the
   *  start"/Shuffle-driven auto-advance sitting paused on the new track —
   *  the opposite of what "continue playback" means. A user-initiated
   *  Next/Previous/manual track pick never calls this, so their own
   *  existing paused-state-preserving behavior is completely unaffected. */
  resumeOnNextTrack: () => void
}

/**
 * Starts `audio`, reporting a rejected `play()` as `"error"` only for a
 * real failure on the still-current element. An `AbortError` just means a
 * `pause()` (or teardown) interrupted a `play()` that hadn't started yet —
 * typical while a track is still loading — and the element itself is fine;
 * treating it as fatal would disable Play (and the Open_Palm gesture) until
 * the next track change.
 */
function startPlayback(
  audio: HTMLAudioElement,
  audioRef: { readonly current: HTMLAudioElement | null },
  setStatus: (status: PlayerAudioStatus) => void,
) {
  audio.play().catch((error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") return
    if (audioRef.current === audio) setStatus("error")
  })
}

/**
 * Owns exactly one real `HTMLAudioElement` for the Player screen's one
 * current track. Deliberately lives in `PlayerScreen` (the parent
 * of both the Mobile and Desktop control trees — see that file's own doc
 * comment on why those are two independent trees, both mounted at once,
 * one hidden via CSS) rather than inside `PlayerControls` itself: if each
 * of those two `PlayerControls` instances created its own `<audio>`
 * element, resizing across the `lg` breakpoint would silently orphan
 * whichever instance's audio was actually playing (the newly-visible
 * instance would show "paused" while the hidden one's audio kept
 * playing) — one shared instance up here, with both `PlayerControls`
 * copies fully controlled from these same returned values, is what keeps
 * them in sync no matter which one is currently visible.
 *
 * The underlying `Audio(src)` is constructed imperatively (not a JSX
 * `<audio>` element) since nothing here needs the browser's own native
 * `<audio controls>` chrome — this app's existing custom transport UI
 * (`PlayerControls`) is the only surface that should ever drive or
 * reflect playback, matching how every other non-visual browser API this
 * codebase already wraps (`useCameraStream`, `useScanProgress`) is a
 * plain hook, not a rendered element.
 */
export function usePlayerAudio(src: string | undefined): UsePlayerAudioResult {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [status, setStatus] = useState<PlayerAudioStatus>(src ? "loading" : "error")
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.7)

  // Bridges "was the *previous* `src`'s element actually playing" across
  // this effect's own teardown/recreation boundary — read once (and
  // immediately consumed/reset) at the top of a *later* run, never on the
  // very first mount, since nothing has torn anything down yet to have
  // set it. That's what keeps a user-triggered Next/Previous track change
  // able to continue playback automatically (this milestone's own
  // explicit requirement) without ever introducing autoplay on the
  // Player's own initial load — the two are structurally different here,
  // not just by convention: only a *second-or-later* run of this effect
  // can ever see this ref as `true`.
  const wasPlayingRef = useRef(false)
  // Set only by `resumeOnNextTrack` (below), consumed alongside
  // `wasPlayingRef` in the very next run of the recreate-effect — kept as
  // a *separate* flag rather than just writing `true` into `wasPlayingRef`
  // directly, because that same effect's own teardown unconditionally
  // recomputes `wasPlayingRef.current` from the real (by-then-paused)
  // element right before this runs, which would silently clobber a forced
  // `true` back to `false` before it was ever read. See this ref's own
  // field doc comment on `resumeOnNextTrack` above for why this exists.
  const forceResumeRef = useRef(false)
  // Mirrors `volume` so the `[src]` effect below can apply the current
  // volume to each newly-created element without listing `volume` as a
  // dependency (which would recreate the element on every slider move).
  // Without this, a track switch left the new element at the browser's
  // default `1.0` while the slider still showed the user's value — the
  // `[volume]` effect only re-runs when `volume` itself changes.
  const volumeRef = useRef(volume)
  volumeRef.current = volume

  // Creates (and fully tears down) the one `Audio` instance whenever `src`
  // itself changes — not whenever `volume` changes, which is its own
  // effect below so adjusting the slider never recreates/reloads the
  // element mid-playback.
  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)

    if (!src) {
      setStatus("error")
      audioRef.current = null
      return
    }

    setStatus("loading")
    const audio = new Audio(src)
    audio.preload = "metadata"
    audio.volume = volumeRef.current
    audioRef.current = audio

    // Consumed immediately (reset to `false` right after reading) so a
    // later `src` change can never accidentally resume based on a stale
    // value from two tracks ago rather than the one just switched away
    // from.
    const shouldResume = wasPlayingRef.current || forceResumeRef.current
    wasPlayingRef.current = false
    forceResumeRef.current = false

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    }
    const handleCanPlay = () => {
      setStatus((current) => (current === "loading" ? "ready" : current))
    }
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handlePlay = () => setStatus("playing")
    const handlePause = () => setStatus((current) => (current === "ended" ? current : "paused"))
    const handleEnded = () => setStatus("ended")
    const handleError = () => setStatus("error")

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    // Resume by calling `play()` right away rather than waiting for
    // `canplay`: with `preload = "metadata"`, Safari/iOS (and often
    // Firefox) stop loading after metadata, so `canplay` never fires until
    // something requests playback — the new track would sit selected but
    // paused. `play()` itself starts loading and begins playback once
    // enough data is available. It also flips `.paused` to `false`
    // synchronously, so switching again before playback actually starts
    // (pressing Next twice quickly) still reads as "was playing" in the
    // teardown below. `startPlayback` ignores the `AbortError` a torn-down
    // (or quickly paused) element's pending `play()` rejects with, so it
    // can't mark this or the *next* track as failed.
    if (shouldResume) startPlayback(audio, audioRef, setStatus)

    return () => {
      // Read *before* `audio.pause()` below (which would otherwise always
      // leave `.paused` `true` by the time this ran) — `ended` already
      // sets `.paused` `true` itself per the media spec, so a track that
      // finished naturally before Next/Previous was pressed correctly
      // reads as "was not playing" here, with no special-casing needed.
      wasPlayingRef.current = !audio.paused
      audio.pause()
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      // Releases the underlying network/decoder resources immediately
      // rather than waiting for GC — the standard "detach the source"
      // idiom for a no-longer-wanted `HTMLMediaElement`.
      audio.src = ""
      audioRef.current = null
    }
  }, [src])

  // Applies `volume` to the live element on every change, including the
  // very first render — this effect (declared after the one above) always
  // runs after it within the same commit, so the element already exists
  // by the time this reads `audioRef.current` on mount too.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    startPlayback(audio, audioRef, setStatus)
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      startPlayback(audio, audioRef, setStatus)
    } else {
      audio.pause()
    }
  }, [])

  const setVolume = useCallback((next: number) => {
    setVolumeState(Math.min(1, Math.max(0, next)))
  }, [])

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, seconds)
    // `timeupdate` alone can lag a discrete seek by a frame or two on some
    // browsers; setting this straight from the value we just assigned
    // keeps the UI's own progress/elapsed display exact immediately.
    setCurrentTime(audio.currentTime)
  }, [])

  const getAudioElement = useCallback(() => audioRef.current, [])

  const resumeOnNextTrack = useCallback(() => {
    forceResumeRef.current = true
  }, [])

  return {
    status,
    currentTime,
    duration,
    volume,
    play,
    pause,
    toggle,
    setVolume,
    seekTo,
    getAudioElement,
    resumeOnNextTrack,
  }
}

/** `123.4` → `"2:03"` — the same `m:ss` shape (no hours, no leading zero
 *  on minutes) `data/playerTrack.ts`'s own placeholder duration labels
 *  already use, so a real duration replacing that placeholder never
 *  changes format, only the number. Guards non-finite input (`NaN`/
 *  `Infinity`, both real possible values of `HTMLMediaElement.duration`
 *  before metadata loads or for a broken source) down to `"0:00"` rather
 *  than rendering `NaN:NaN`. */
export function formatPlaybackTime(totalSecondsRaw: number): string {
  if (!Number.isFinite(totalSecondsRaw) || totalSecondsRaw < 0) return "0:00"
  const totalSeconds = Math.floor(totalSecondsRaw)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
