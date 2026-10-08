import trackArtwork from "../imports/Player/track-artwork.png"
import testTrack1Sound from "../assets/audio/test-track-1.mp3"
import testTrack2Sound from "../assets/audio/test-track-2.mp3"
import testTrack3Sound from "../assets/audio/test-track-3.mp3"
import type { MoodId } from "./moods"
import { happyTracks } from "./happyPlaylist"
import { melancholicTracks } from "./melancholicPlaylist"
import { chillTracks } from "./chillPlaylist"

/**
 * The Player screen's track data — one ordered queue (`testTracks`) real
 * Previous/Next now moves through (see `PlayerScreen.tsx`'s own
 * `currentTrackIndex`), replacing an earlier single static `currentTrack`
 * + a six-times-cloned `upNextTracks` (every row was byte-identical bar
 * its own suffixed `id` — there was nothing to actually switch *to* before
 * this milestone). `id`s must stay unique and `audioSrc`s must stay
 * distinct real files (both enforced by hand here, not by any type-level
 * check) — `PlayerScreen`'s own Up Next slice and current-track lookup
 * both depend on `id` actually identifying one specific track.
 *
 * `title`/`artist`/`durationLabel` for the first entry are still the
 * exact placeholder copy the approved Player Figma frames themselves show
 * ("Turn The Lights Off" / "Toby Rose & One Trick Pony" / "3:56") — Figma
 * never depicted a second or third *distinct* track (every "Up next" row
 * in the approved frames repeats that same one), so there's no approved
 * copy to carry over for tracks 2–3; rather than invent song titles/artist
 * names that would read as real content, those two use plainly-generic
 * "Test Track N" / "Test Artist" labels instead — a deliberate, flagged
 * choice, not Figma-sourced or production copy (see `PRODUCT.md`'s own
 * "do not invent a licensing source" / placeholder-content stance).
 *
 * `artwork` reuses the one real cover-art export this repo has for every
 * entry — this milestone's own scope calls out a *distinct* `id` and
 * `audioSrc` per track, not distinct artwork, and no second/third artwork
 * asset exists to use instead (same "do not invent a missing asset"
 * discipline the audio sources themselves follow).
 */
export type PlayerTrack = {
  id: string
  title: string
  artist: string
  durationLabel: string
  /** Elapsed-time label for the *current* track's own progress display
   *  (`PlayerWaveform`) — restored here per explicit instruction after an
   *  earlier incidental removal; still unused by any track below (this
   *  screen derives its real elapsed label from `usePlayerAudio`'s own
   *  `currentTime`, not this field — see `PlayerScreen.tsx`), kept only
   *  so removing it stays a separate, deliberate decision from this
   *  milestone's own actual scope. */
  elapsedLabel?: string
  artwork: string
  /** Optional CSS `object-position` focal points for `artwork` inside the
   *  Player's landscape (479:342) artwork frame, where `object-fit: cover`
   *  crops a square cover top/bottom. Separate values because the Desktop
   *  and Mobile artwork are separate elements and may need different
   *  framing. Missing → `ARTWORK_POSITION_DEFAULT` (`center center`). */
  artworkPositionDesktop?: string
  artworkPositionMobile?: string
  /** Each track's own real, rights-cleared audio file
   *  (`assets/audio/test-track-{1,2,3}.mp3` — added specifically for
   *  Player playback verification, distinct from `bubble-scatter.mp3`,
   *  which stays the Intro screen's own decorative sound effect and is
   *  never imported here). Real per-mood music tracks/licensing remain
   *  the same "open/undecided" item `PRODUCT.md` already flags, still
   *  unresolved by this milestone. Optional so a future track added
   *  without one yet doesn't need a placeholder value here. */
  audioSrc?: string
  /** The mood playlist this track belongs to (unset on the shared test tracks). */
  mood?: MoodId
}

export const ARTWORK_POSITION_DEFAULT = "center center"

export const testTracks: PlayerTrack[] = [
  {
    id: "test-track-1",
    title: "Turn The Lights Off",
    artist: "Toby Rose & One Trick Pony",
    durationLabel: "3:56",
    artwork: trackArtwork,
    // Example framing: keeps the standing figure and horizon slightly above
    // center (the cover's tiny top-edge credits can't survive a 479:342
    // crop without hitting the rounded corners, so they're let go).
    artworkPositionDesktop: "center 40%",
    artworkPositionMobile: "center 35%",
    audioSrc: testTrack1Sound,
  },
  {
    id: "test-track-2",
    title: "Test Track 2",
    artist: "Test Artist",
    durationLabel: "3:56",
    artwork: trackArtwork,
    audioSrc: testTrack2Sound,
  },
  {
    id: "test-track-3",
    title: "Test Track 3",
    artist: "Test Artist",
    durationLabel: "3:56",
    artwork: trackArtwork,
    audioSrc: testTrack3Sound,
  },
]

/** The playlist the Player plays for each mood — every mood now has its
 *  own real playlist (`testTracks` above is no longer played). */
export function playlistForMood(mood: MoodId): PlayerTrack[] {
  if (mood === "happy") return happyTracks
  if (mood === "melancholic") return melancholicTracks
  return chillTracks
}
