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
   *  crash the Player" requirement. */
  play: () => void
  pause: () => void
  /** Whichever of `play`/`pause` is currently the *inverse* of the real
   *  `<audio>` element's own `paused` property — reads the element itself
   *  at call time rather than this hook's own `status` state, so a rapid
   *  double-click can never race ahead of a state update that hasn't
   *  committed yet. */
  toggle: () => void
  setVolume: (volume: number) => void
}

/**
 * Owns exactly one real `HTMLAudioElement` for the Player screen's one
 * current track (per this milestone's explicit scope — no queue, no
 * track switching yet). Deliberately lives in `PlayerScreen` (the parent
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
    audioRef.current = audio

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    }
    const handleCanPlay = () => setStatus((current) => (current === "loading" ? "ready" : current))
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

    return () => {
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
    audio.play().catch(() => setStatus("error"))
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => setStatus("error"))
    } else {
      audio.pause()
    }
  }, [])

  const setVolume = useCallback((next: number) => {
    setVolumeState(Math.min(1, Math.max(0, next)))
  }, [])

  return { status, currentTime, duration, volume, play, pause, toggle, setVolume }
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
