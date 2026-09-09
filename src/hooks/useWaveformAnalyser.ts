import { useCallback, useEffect, useRef } from "react"

/**
 * Drives `PlayerWaveform`'s real-audio reactivity from the Player's one
 * shared `<audio>` element (`usePlayerAudio`) via the Web Audio API. Lives
 * as its own hook — not inside `usePlayerAudio` itself, and not inside
 * `PlayerWaveform` — per Guidelines §7's architecture boundaries ("keep
 * audio playback logic and visualization logic cleanly separated"):
 * `usePlayerAudio` stays a plain `<audio>` element wrapper that has never
 * needed to know Web Audio exists, and this hook stays ignorant of pixels,
 * bar counts owned by the caller, or DOM refs — it only ever hands back
 * numbers.
 *
 * Ownership model: `PlayerScreen` calls this hook exactly once (matching
 * how it also owns exactly one `usePlayerAudio` — see that hook's own doc
 * comment on why one shared instance, not one per `PlayerControls` copy,
 * is what keeps the Mobile/Desktop trees in sync). This hook likewise owns
 * exactly one `AudioContext`/`AnalyserNode` pair for the whole screen, and
 * both `PlayerWaveform` copies (Mobile/Desktop) subscribe to the same
 * underlying analysis loop via `subscribe` below, so they always report
 * identical audio-reactive levels — never two independent analyses of the
 * same audio drifting apart.
 *
 * `AudioContext` creation/resume is deliberately *not* wired to a
 * `useEffect` reacting to `isPlaying` — that would create it the moment
 * React first commits `isPlaying: true`, an arbitrary tick or two after
 * the actual click, which some browsers' autoplay-gesture heuristics don't
 * reliably still count as "during a user gesture." `ensureStarted` below
 * is instead called directly, synchronously, from inside `PlayerScreen`'s
 * own Play/Pause click handler (see that file), the same call stack as
 * the user's real click — the one timing Guidelines §8/§12 actually
 * require ("resume should happen following the user's playback
 * interaction").
 */

const FFT_SIZE = 512
/** Out of `FFT_SIZE / 2` frequency bins, how many (from bin 0, the lowest
 *  frequencies `AnalyserNode` reports) count as "bass" for the global bass-
 *  boost multiplier below — at this codebase's real test tracks' typical
 *  44.1kHz sample rate, `FFT_SIZE / 2 = 256` bins span 0–22050Hz, so each
 *  bin is ~86Hz wide; the first 8 bins cover roughly 0–690Hz, the sub-bass/
 *  bass-and-low-mid range where a kick drum or bass line actually lives. */
const BASS_BIN_COUNT = 8
/** How much louder the *global* bass-boost multiplier can make every bar's
 *  own local energy — `1 + BASS_BOOST_STRENGTH` at maximum bass energy.
 *  Deliberately "moderately stronger" (requirement 6) rather than a
 *  multiple-times boost: bass beats should read as a clearly stronger
 *  pulse across the row, not a completely different animation. */
const BASS_BOOST_STRENGTH = 0.9
/** Per-frame interpolation factor while actively playing — how much of the
 *  gap between a bar's current smoothed level and this frame's freshly
 *  analysed target it closes each tick. Combined with the analyser's own
 *  `smoothingTimeConstant` below, this is what keeps movement "fluid and
 *  musical" (requirement 7) instead of jumping straight to each frame's
 *  raw value. */
const PLAYING_LERP_FACTOR = 0.22
/** Per-frame interpolation factor while paused/ended and easing back
 *  toward the resting level (`1`, i.e. each bar's own unmodified static
 *  height) — slower than `PLAYING_LERP_FACTOR` so the settle reads as a
 *  deliberate wind-down (requirement 10), not an abrupt stop. */
const SETTLE_LERP_FACTOR = 0.08
/** Once every bar's smoothed level is within this of the `1` resting
 *  level, the animation loop stops itself entirely (requirement 9: "run
 *  visualization updates only when useful") rather than continuing to
 *  spend a `requestAnimationFrame` a frame forever doing nothing visible. */
const SETTLE_EPSILON = 0.002

/** A bar's per-frame audio-reactive scale multiplier — `1` means "exactly
 *  this bar's own static resting height," matching the pre-existing look
 *  whenever nothing is playing. Below `1` for a quiet moment, above `1` for
 *  a loud/bassy one; `PlayerWaveform` multiplies its own static per-bar
 *  height fraction by this. */
export type WaveformFrameListener = (scales: readonly number[]) => void

export type WaveformAnalyserHandle = {
  /** Creates (once) and resumes the shared `AudioContext`/`AnalyserNode`,
   *  and (re)connects a `MediaElementAudioSourceNode` to whichever
   *  `<audio>` element `getAudioElement` currently reports — call this
   *  synchronously from a real click handler, never from an effect (see
   *  this file's own doc comment above). Safe to call on every Play/Pause
   *  click, including ones after the first: idempotent, and guards against
   *  ever creating a second `MediaElementAudioSourceNode` for an element
   *  this hook already wired (would throw — the DOM spec only allows one
   *  per element, ever). A missing `AudioContext` (very old browsers) is
   *  caught and turned into a silent no-op — `PlayerWaveform` simply never
   *  receives frames and stays at its static resting look, never a crash. */
  ensureStarted: () => void
  /** Registers a per-frame listener; returns an unsubscribe function. Both
   *  `PlayerWaveform` copies (Mobile/Desktop) call this from their own
   *  mount effect. */
  subscribe: (listener: WaveformFrameListener) => () => void
}

export function useWaveformAnalyser({
  getAudioElement,
  src,
  isPlaying,
  barCount,
  reducedMotion,
}: {
  /** `usePlayerAudio`'s own `getAudioElement` — read at call time, never
   *  stored, so this always sees whichever element is live *right now*. */
  getAudioElement: () => HTMLAudioElement | null
  /** The current track's own audio source — used only to key the effect
   *  that re-wires the source node when a track switch has swapped in a
   *  brand new `<audio>` element (see `usePlayerAudio`'s own doc comment:
   *  it recreates its element whenever `src` itself changes). Never read
   *  for any other purpose here. */
  src: string | undefined
  isPlaying: boolean
  barCount: number
  /** `prefers-reduced-motion` — per Guidelines §11/§15, this disables the
   *  continuous per-frame animation entirely rather than "reducing" it by
   *  degree: listeners simply never fire past the very first resting frame,
   *  leaving `PlayerWaveform`'s existing static bars (still fully useful —
   *  they still show real playback progress via color) untouched. */
  reducedMotion: boolean
}): WaveformAnalyserHandle {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  // Which element `sourceNodeRef` is already wired to — compared by
  // identity against `getAudioElement()` so a re-render/re-run that hands
  // back the *same* element never attempts a second
  // `createMediaElementSource` call on it (would throw).
  const wiredElementRef = useRef<HTMLAudioElement | null>(null)

  // Typed `Uint8Array<ArrayBuffer>` (not the bare `Uint8Array` alias) to
  // match `AnalyserNode.getByteFrequencyData`'s own newer, more specific
  // `lib.dom.d.ts` signature — `new Uint8Array(n)` already produces a
  // real, non-shared `ArrayBuffer`-backed instance; this only narrows the
  // *type* to match what that call expects.
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  // Persists across frames: each bar's own current smoothed scale
  // multiplier, lerped toward that frame's target every tick rather than
  // ever jumping straight to it.
  const smoothedScalesRef = useRef<number[]>([])
  const listenersRef = useRef<Set<WaveformFrameListener>>(new Set())
  const rafRef = useRef<number | null>(null)
  const isPlayingRef = useRef(isPlaying)
  isPlayingRef.current = isPlaying

  const barCountRef = useRef(barCount)
  barCountRef.current = barCount
  const reducedMotionRef = useRef(reducedMotion)
  reducedMotionRef.current = reducedMotion

  const notifyListeners = useCallback((scales: readonly number[]) => {
    for (const listener of listenersRef.current) listener(scales)
  }, [])

  // Resizes the shared scales array to the current `barCount`, filling any
  // newly-added slots at the `1` resting level — pulled out so every call
  // site (the animation loop, the reduced-motion branch, and a fresh
  // `subscribe`'s own immediate first frame) sees a correctly-sized array
  // instead of each reimplementing this same guard.
  const ensureScalesSized = useCallback(() => {
    const scales = smoothedScalesRef.current
    const barCountNow = barCountRef.current
    if (scales.length !== barCountNow) {
      const previousLength = scales.length
      scales.length = barCountNow
      scales.fill(1, previousLength)
    }
    return scales
  }, [])

  // Re-wires the `MediaElementAudioSourceNode` to whichever element is
  // currently live, but only once an `AudioContext` actually exists yet
  // (i.e. `ensureStarted` has already run at least once from a real click)
  // — this never itself creates the `AudioContext` on mount, preserving
  // the "only following a user interaction" requirement even though this
  // runs as a plain effect.
  const rewireSourceNode = useCallback(() => {
    const ctx = audioContextRef.current
    const analyser = analyserRef.current
    if (!ctx || !analyser) return
    const audioEl = getAudioElement()
    if (!audioEl || wiredElementRef.current === audioEl) return
    try {
      sourceNodeRef.current?.disconnect()
      const source = ctx.createMediaElementSource(audioEl)
      source.connect(analyser)
      sourceNodeRef.current = source
      wiredElementRef.current = audioEl
    } catch {
      // A source node for this exact element already exists from outside
      // this hook's own tracking (shouldn't happen in practice, since
      // `usePlayerAudio` never reuses an element across tracks) — leave
      // whatever's already wired alone rather than crashing the Player.
    }
  }, [getAudioElement])

  useEffect(() => {
    rewireSourceNode()
  }, [rewireSourceNode, src])

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return // already running
    const tick = () => {
      const analyser = analyserRef.current
      const barCountNow = barCountRef.current
      const scales = ensureScalesSized()

      const playing = isPlayingRef.current
      let settled = true

      if (playing && analyser) {
        let data = freqDataRef.current
        if (!data || data.length !== analyser.frequencyBinCount) {
          data = new Uint8Array(analyser.frequencyBinCount)
          freqDataRef.current = data
        }
        analyser.getByteFrequencyData(data)

        let bassSum = 0
        const bassBins = Math.min(BASS_BIN_COUNT, data.length)
        for (let i = 0; i < bassBins; i++) bassSum += data[i]
        const bassEnergy = bassBins > 0 ? bassSum / bassBins / 255 : 0
        const bassBoost = 1 + bassEnergy * BASS_BOOST_STRENGTH

        const binsPerBar = data.length / barCountNow
        for (let bar = 0; bar < barCountNow; bar++) {
          const start = Math.floor(bar * binsPerBar)
          const end = Math.max(start + 1, Math.floor((bar + 1) * binsPerBar))
          let sum = 0
          for (let bin = start; bin < end; bin++) sum += data[bin]
          const localEnergy = sum / (end - start) / 255

          // Resting bars sit at `1`; quiet moments dip below it, loud/bassy
          // ones rise above it, clamped to a sane range so a very loud peak
          // still can't blow the bar out to an absurd multiple.
          const target = Math.min(1.9, Math.max(0.35, localEnergy * bassBoost * 1.9))
          scales[bar] += (target - scales[bar]) * PLAYING_LERP_FACTOR
          if (Math.abs(target - scales[bar]) > SETTLE_EPSILON) settled = false
        }
      } else {
        for (let bar = 0; bar < barCountNow; bar++) {
          scales[bar] += (1 - scales[bar]) * SETTLE_LERP_FACTOR
          if (Math.abs(1 - scales[bar]) > SETTLE_EPSILON) settled = false
        }
      }

      notifyListeners(scales)

      if (!playing && settled) {
        // Snap exactly to `1` so floating-point residue never leaves a bar
        // permanently a hair off its own static height, then stop — the
        // next `ensureStarted`/play will restart this loop from a clean,
        // fully-settled state.
        scales.fill(1)
        notifyListeners(scales)
        rafRef.current = null
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [notifyListeners, ensureScalesSized])

  // Starts/stops the loop as playback starts/stops (requirement 9: run
  // only while useful) — `startLoop` itself keeps running a little past
  // `isPlaying` turning false so the settle-back animation (requirement
  // 10) can play out, then stops itself once settled.
  useEffect(() => {
    if (reducedMotion) {
      stopLoop()
      const scales = ensureScalesSized()
      scales.fill(1)
      notifyListeners(scales)
      return
    }
    // Whether `isPlaying` just turned true (real playback) or false (the
    // settle-back phase), `startLoop` is what should be running — it's a
    // no-op if already ticking, so no separate branch is needed for either
    // direction.
    startLoop()
    return undefined
  }, [isPlaying, reducedMotion, startLoop, stopLoop, notifyListeners, ensureScalesSized])

  useEffect(() => stopLoop, [stopLoop])

  const ensureStarted = useCallback(() => {
    if (reducedMotionRef.current) return
    if (!audioContextRef.current) {
      const AudioContextCtor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextCtor) return // Web Audio unsupported — stay a no-op
      const ctx = new AudioContextCtor()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = FFT_SIZE
      analyser.smoothingTimeConstant = 0.8
      analyser.connect(ctx.destination)
      audioContextRef.current = ctx
      analyserRef.current = analyser
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {
        // Autoplay policy or a transient failure — the Player's own real
        // `<audio>` element still plays normally either way (this only
        // gates the *visualization*, never actual playback), matching
        // requirement 12's "handle... correctly" without ever surfacing a
        // Web Audio failure as a Player-wide error.
      })
    }
    rewireSourceNode()
  }, [rewireSourceNode])

  const subscribe = useCallback((listener: WaveformFrameListener) => {
    listenersRef.current.add(listener)
    // Hands the subscriber an immediate first frame (whatever the shared
    // loop's current levels already are) rather than leaving it at
    // whatever `PlayerWaveform`'s own initial static render assumed, in
    // case it's subscribing mid-playback (e.g. a resize crossing the
    // `lg` breakpoint remounts the other copy).
    listener(ensureScalesSized())
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [ensureScalesSized])

  return { ensureStarted, subscribe }
}
