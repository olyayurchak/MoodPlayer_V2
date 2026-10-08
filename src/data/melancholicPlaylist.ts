import type { PlayerTrack } from "./playerTrack"
import kimoSoundsRiseSlowAudio from "../assets/audio/melancholy/kimo-sounds-rise-slow.mp3"
import stereophonicsMaybeTomorrowAudio from "../assets/audio/melancholy/stereophonics-maybe-tomorrow.mp3"
import billieEilishBellyacheAudio from "../assets/audio/melancholy/billie-eilish-bellyache.mp3"
import oneilSweetDreamsAudio from "../assets/audio/melancholy/oneil-sweet-dreams.mp3"
import harryStylesAsItWasAudio from "../assets/audio/melancholy/harry-styles-as-it-was.mp3"
import snowPatrolChasingCarsAudio from "../assets/audio/melancholy/snow-patrol-chasing-cars.mp3"
import billieEilishLovelyAudio from "../assets/audio/melancholy/billie-eilish-lovely.mp3"
import rihannaStayAudio from "../assets/audio/melancholy/rihanna-stay.mp3"
import olafurArnaldsSoFarAudio from "../assets/audio/melancholy/olafur-arnalds-so-far.mp3"
import cutOutOfTouchAudio from "../assets/audio/melancholy/cut-out-of-touch.mp3"
import arcaneNovarayGoodbyeMyLoverAudio from "../assets/audio/melancholy/arcane-novaray-goodbye-my-lover.m4a"
import orvakOneMomentMoreAudio from "../assets/audio/melancholy/orvak-one-moment -more.mp3"
import daTiTakeMeThereAudio from "../assets/audio/melancholy/da-ti--take-me-there.mp3"
import kimoSoundsRiseSlowCover from "../assets/covers/melancholy/kimo-sounds-rise-slow.jpg"
import stereophonicsMaybeTomorrowCover from "../assets/covers/melancholy/stereophonics-maybe-tomorrow.jpg"
import billieEilishBellyacheCover from "../assets/covers/melancholy/billie-eilish-bellyache.jpg"
import oneilSweetDreamsCover from "../assets/covers/melancholy/oneil-sweet-dreams.jpg"
import harryStylesAsItWasCover from "../assets/covers/melancholy/harry-styles-as-it-was.jpg"
import snowPatrolChasingCarsCover from "../assets/covers/melancholy/snow-patrol-chasing-cars.jpg"
import billieEilishLovelyCover from "../assets/covers/melancholy/billie-eilish-lovely.jpg"
import rihannaStayCover from "../assets/covers/melancholy/rihanna-stay.jpg"
import olafurArnaldsSoFarCover from "../assets/covers/melancholy/olafur-arnalds-so-far.jpg"
import cutOutOfTouchCover from "../assets/covers/melancholy/cut-out-of-touch.jpg"
import arcaneNovarayGoodbyeMyLoverCover from "../assets/covers/melancholy/arcane-novaray-goodbye-my-lover.jpg"
import orvakOneMomentMoreCover from "../assets/covers/melancholy/orvak-one-moment -more.jpg"
import daTiTakeMeThereCover from "../assets/covers/melancholy/da-ti--take-me-there.png"

/**
 * The real Melancholic playlist, in stored play order — same structure as
 * `happyPlaylist.ts`. Positions 1–4 are fixed by explicit instruction
 * (Kimo Sounds, Stereophonics, Billie Eilish "Bellyache", ONEIL); 5–13
 * were chosen once and stay as written — never shuffled at runtime
 * (Shuffle only changes *playback* order, see `PlayerScreen.tsx`).
 *
 * Title/artist come from each file's own tags (ID3, or MP4 atoms for the
 * `.m4a` and the three MP4-encoded files named `.mp3`) where present —
 * Kimo Sounds' repeated artist credit is collapsed to one. Files with no
 * usable tags (both Billie Eilish tracks, Rihanna, Snow Patrol, Ólafur
 * Arnalds, Orvak) are labelled from their filenames. `durationLabel`s are
 * the files' real durations.
 *
 * Covers taken from a file's own embedded artwork are noted per track;
 * the rest were supplied in `assets/covers/melancholy/`.
 *
 * Covers are cropped into the 479:342 artwork frame with `object-fit:
 * cover`; `artworkPosition*` is set only where the centered crop would
 * cut the cover's main subject or title.
 */
export const melancholicTracks: PlayerTrack[] = [
  {
    id: "melancholic-kimo-sounds-rise-slow",
    title: "Rise Slow",
    artist: "Kimo Sounds",
    durationLabel: "3:53",
    mood: "melancholic",
    artwork: kimoSoundsRiseSlowCover,
    // Centered crop cuts the "KIMO SOUNDS" title; this keeps the full
    // title block and the figure in frame.
    artworkPositionDesktop: "center 20%",
    artworkPositionMobile: "center 20%",
    audioSrc: kimoSoundsRiseSlowAudio,
  },
  {
    id: "melancholic-stereophonics-maybe-tomorrow",
    title: "Maybe Tomorrow",
    artist: "Stereophonics",
    durationLabel: "4:33",
    mood: "melancholic",
    artwork: stereophonicsMaybeTomorrowCover,
    // Keeps the full Stereophonics logo in frame.
    artworkPositionDesktop: "center 35%",
    artworkPositionMobile: "center 35%",
    audioSrc: stereophonicsMaybeTomorrowAudio,
  },
  {
    id: "melancholic-billie-eilish-bellyache",
    title: "Bellyache",
    artist: "Billie Eilish",
    durationLabel: "3:40",
    mood: "melancholic",
    artwork: billieEilishBellyacheCover,
    // Centered crop cuts off her head.
    artworkPositionDesktop: "center 10%",
    artworkPositionMobile: "center 10%",
    audioSrc: billieEilishBellyacheAudio,
  },
  {
    id: "melancholic-oneil-sweet-dreams",
    title: "Sweet Dreams",
    artist: "ONEIL, ORGAN, FAVIA",
    durationLabel: "1:56",
    mood: "melancholic",
    // From the file's embedded artwork — correct release, but only
    // 300×300, so it renders soft at the artwork size. Needs review.
    artwork: oneilSweetDreamsCover,
    audioSrc: oneilSweetDreamsAudio,
  },
  {
    id: "melancholic-harry-styles-as-it-was",
    title: "As It Was",
    artist: "Harry Styles",
    durationLabel: "2:47",
    mood: "melancholic",
    // Existing local cover (also identical to the file's embedded artwork).
    artwork: harryStylesAsItWasCover,
    audioSrc: harryStylesAsItWasAudio,
  },
  {
    id: "melancholic-snow-patrol-chasing-cars",
    title: "Chasing Cars",
    artist: "Snow Patrol",
    durationLabel: "4:27",
    mood: "melancholic",
    artwork: snowPatrolChasingCarsCover,
    audioSrc: snowPatrolChasingCarsAudio,
  },
  {
    id: "melancholic-billie-eilish-lovely",
    title: "Lovely",
    artist: "Billie Eilish",
    durationLabel: "3:20",
    mood: "melancholic",
    artwork: billieEilishLovelyCover,
    // Keeps her face and the "Happier Than Ever" title in frame.
    artworkPositionDesktop: "center 30%",
    artworkPositionMobile: "center 30%",
    audioSrc: billieEilishLovelyAudio,
  },
  {
    id: "melancholic-rihanna-stay",
    title: "Stay",
    artist: "Rihanna",
    durationLabel: "4:00",
    mood: "melancholic",
    artwork: rihannaStayCover,
    // Keeps her face clear of the top edge.
    artworkPositionDesktop: "center 20%",
    artworkPositionMobile: "center 20%",
    audioSrc: rihannaStayAudio,
  },
  {
    id: "melancholic-olafur-arnalds-so-far",
    title: "So Far",
    artist: "Ólafur Arnalds",
    durationLabel: "4:32",
    mood: "melancholic",
    artwork: olafurArnaldsSoFarCover,
    audioSrc: olafurArnaldsSoFarAudio,
  },
  {
    id: "melancholic-cut-out-of-touch",
    title: "Out Of Touch",
    artist: "CUT_",
    durationLabel: "4:01",
    mood: "melancholic",
    // From the file's embedded artwork.
    artwork: cutOutOfTouchCover,
    // Keeps the eyes above the fabric in frame.
    artworkPositionDesktop: "center 20%",
    artworkPositionMobile: "center 20%",
    audioSrc: cutOutOfTouchAudio,
  },
  {
    id: "melancholic-arcane-novaray-goodbye-my-lover",
    title: "Goodbye My Lover",
    artist: "Arcane Novaray",
    durationLabel: "4:16",
    mood: "melancholic",
    artwork: arcaneNovarayGoodbyeMyLoverCover,
    audioSrc: arcaneNovarayGoodbyeMyLoverAudio,
  },
  {
    id: "melancholic-orvak-one-moment-more",
    title: "One Moment More",
    artist: "Orvak",
    durationLabel: "4:04",
    mood: "melancholic",
    artwork: orvakOneMomentMoreCover,
    audioSrc: orvakOneMomentMoreAudio,
  },
  {
    id: "melancholic-da-ti-take-me-there",
    title: "Take Me There",
    artist: "Da Ti",
    durationLabel: "3:22",
    mood: "melancholic",
    artwork: daTiTakeMeThereCover,
    audioSrc: daTiTakeMeThereAudio,
  },
]
