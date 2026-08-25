import trackArtwork from "../imports/Player/track-artwork.png"

/**
 * Placeholder "Up next" playlist content for the Player screen's UI
 * foundation (this milestone explicitly excludes real audio/playlist
 * architecture — see `PlayerScreen.tsx`'s own doc comment). No real
 * playlist/track data or audio assets exist anywhere else in this
 * repository yet (only `assets/audio/bubble-scatter.mp3`, an unrelated
 * Intro sound effect) — this file exists purely so the approved Figma
 * layout has *something* concrete to render, not to stand in as a real
 * content model.
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
}

export const currentTrack: PlayerTrack = {
  id: "turn-the-lights-off",
  title: "Turn The Lights Off",
  artist: "Toby Rose & One Trick Pony",
  durationLabel: "3:56",
  elapsedLabel: "1:24",
  artwork: trackArtwork,
}

/** Six total rows shown in the approved Desktop "Up next" panel (one
 *  highlighted "now playing" row + five more) — reproduced at the same
 *  count; every row is this same placeholder track, matching the Figma
 *  frames themselves. */
export const upNextTracks: PlayerTrack[] = Array.from({ length: 6 }, (_, index) => ({
  ...currentTrack,
  id: `${currentTrack.id}-${index}`,
}))
