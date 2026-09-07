import trackArtwork from "../imports/Player/track-artwork.png"
import testTrackSound from "../assets/audio/test-track.mp3"

/**
 * Placeholder "Up next" playlist content for the Player screen's UI
 * foundation (this milestone explicitly excludes real *playlist*
 * architecture — no per-mood queues, no Next/Previous, no clickable rows,
 * see `PlayerScreen.tsx`'s own doc comment — though real single-track
 * *playback* now exists, see `audioSrc` below and `hooks/usePlayerAudio.ts`).
 *
 * `title`/`artist`/`durationLabel` are the exact placeholder copy the
 * approved Player Figma frames themselves show ("Turn The Lights Off" /
 * "Toby Rose & One Trick Pony" / "3:56") — not invented, not a real
 * production playlist, and deliberately not run through the translation
 * dictionary (see `translations.ts`'s own `player` doc comment: track
 * metadata isn't localized UI chrome).
 *
 * `artwork` is the exact image Figma exports for this track's cover art
 * (downloaded from the design's own asset export, not an unrelated stock
 * photo) — reused for every row below since this placeholder "playlist"
 * has no other real, distinct tracks to show a real cover for; every row
 * in the approved Desktop Figma frame repeats the same title/artist/
 * duration too, so this isn't a fidelity loss specific to this
 * implementation.
 */
export type PlayerTrack = {
  id: string
  title: string
  artist: string
  durationLabel: string
  /** Elapsed-time label for the *current* track's own progress display
   *  (`PlayerWaveform`) — not meaningful for `upNext` entries, which only
   *  ever show their own total duration. */
  elapsedLabel?: string
  artwork: string
  /** The dedicated, rights-cleared music test asset added specifically
   *  for Player playback verification — `assets/audio/test-track.mp3`.
   *  An earlier pass reused `bubble-scatter.mp3` (the Intro screen's own
   *  decorative bubble-pop sound effect, `MoodBubbleCluster.tsx`) as a
   *  stand-in test source, per this milestone's own "do not invent an
   *  audio path" instruction and no other asset existing at the time;
   *  this replaces that stand-in now that a proper test asset exists —
   *  `bubble-scatter.mp3` stays exactly as it was, used only by the
   *  Intro screen, never imported here again. Real per-mood music
   *  tracks/licensing remain the same "open/undecided" item `PRODUCT.md`
   *  already flags, still unresolved by this milestone. Optional
   *  (`upNext` rows never need it — nothing plays them yet) so a future
   *  real track without one yet doesn't need a placeholder value here. */
  audioSrc?: string
}

export const currentTrack: PlayerTrack = {
  id: "turn-the-lights-off",
  title: "Turn The Lights Off",
  artist: "Toby Rose & One Trick Pony",
  durationLabel: "3:56",
  elapsedLabel: "1:24",
  artwork: trackArtwork,
  audioSrc: testTrackSound,
}

/** Six total rows shown in the approved Desktop "Up next" panel (one
 *  highlighted "now playing" row + five more) — reproduced at the same
 *  count; every row is this same placeholder track, matching the Figma
 *  frames themselves. */
export const upNextTracks: PlayerTrack[] = Array.from({ length: 6 }, (_, index) => ({
  ...currentTrack,
  id: `${currentTrack.id}-${index}`,
}))
