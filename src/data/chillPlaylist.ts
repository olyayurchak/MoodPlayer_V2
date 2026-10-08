import type { PlayerTrack } from "./playerTrack"
import marshalSoulCalifornicationAudio from "../assets/audio/chill/marshal-soul-californication.mp3"
import tobyRoseTurnTheLightsOffAudio from "../assets/audio/chill/toby-rose-turn-the-lights-off.mp3"
import laudLightkeeperAudio from "../assets/audio/chill/laud-lightkeeper.mp3"
import justNearbyDiamondsAudio from "../assets/audio/chill/just-nearby-diamonds.mp3"
import billieEilishOceanEyesAudio from "../assets/audio/chill/billie-eilish-ocean-eyes.mp3"
import daveMoffattForeverYoungAudio from "../assets/audio/chill/dave-moffatt-forever-young.mp3"
import gravagerzChihiroAudio from "../assets/audio/chill/gravagerz-chihiro.mp3"
import arcaneNovarayCantGetYouOutOfMyHeadAudio from "../assets/audio/chill/arcane-novaray-cant-get-You-out-of-my-head.mp3"
import klaasMichaelRomanSilenceAudio from "../assets/audio/chill/klaas-michael-roman-silence.mp3"
import dionOraRealLoveAudio from "../assets/audio/chill/dion-ora-real-love.mp3"
import ariSingFromBodyToSoulAudio from "../assets/audio/chill/ari-sing-from-body-to-soul.mp3"
import paulwetzMomentAudio from "../assets/audio/chill/paulwetz-moment.mp3"
import daliGoodDayAudio from "../assets/audio/chill/dali-good-day.mp3"
import djDiacStrongEnoughAudio from "../assets/audio/chill/dj-diac-strong-nough.mp3"
import marshalSoulCalifornicationCover from "../assets/covers/chill/marshal-soul-californication.jpg"
import tobyRoseTurnTheLightsOffCover from "../assets/covers/chill/toby-rose-turn-the-lights-off.jpg"
import laudLightkeeperCover from "../assets/covers/chill/laud-lightkeeper.jpg"
import justNearbyDiamondsCover from "../assets/covers/chill/just-nearby-diamonds.jpg"
import billieEilishOceanEyesCover from "../assets/covers/chill/billie-eilish-ocean-eyes.jpg"
import daveMoffattForeverYoungCover from "../assets/covers/chill/dave-moffatt-forever-young.jpg"
import gravagerzChihiroCover from "../assets/covers/chill/gravagerz-chihiro.jpg"
import arcaneNovarayCantGetYouOutOfMyHeadCover from "../assets/covers/chill/arcane-novaray-cant-get-you-out-of-my-head.jpg"
import klaasMichaelRomanSilenceCover from "../assets/covers/chill/klaas-michael-roman-silence.jpg"
import dionOraRealLoveCover from "../assets/covers/chill/dion-ora-real-love.jpg"
import ariSingFromBodyToSoulCover from "../assets/covers/chill/ari-sing-from-body-to-soul.jpg"
import paulwetzMomentCover from "../assets/covers/chill/paulwetz-moment.jpg"
import daliGoodDayCover from "../assets/covers/chill/dali-good-day.jpg"
import djDiacStrongEnoughCover from "../assets/covers/chill/dj-diac-strong-enough.jpg"

/**
 * The real Chill playlist, in stored play order — same structure as
 * `happyPlaylist.ts` / `melancholicPlaylist.ts`. Positions 1–4 are fixed
 * by explicit instruction (Marshal Soul, Toby Rose, Laud, Just Nearby);
 * 5–14 were chosen once and stay as written — never shuffled at runtime
 * (Shuffle only changes *playback* order, see `PlayerScreen.tsx`).
 *
 * Title/artist come from each file's own ID3 tags where present, with
 * download-site suffixes stripped, "/"-joined credits written with commas
 * and tag casing normalised ("LIGHTKEEPER", "Dj Diac", "Ari sing").
 * Files with no usable tags (Just Nearby, Billie Eilish, Paulwetz — MP4
 * audio named `.mp3` — and Dali) are labelled from their filenames.
 * `durationLabel`s are the files' real durations.
 *
 * Covers taken from a file's own embedded artwork are noted per track;
 * the rest were supplied in `assets/covers/chill/`.
 *
 * Covers are cropped into the 479:342 artwork frame with `object-fit:
 * cover`; `artworkPosition*` is set only where the centered crop would
 * cut the cover's main subject or title.
 */
export const chillTracks: PlayerTrack[] = [
  {
    id: "chill-marshal-soul-californication",
    title: "Californication",
    artist: "Marshal Soul",
    durationLabel: "4:17",
    mood: "chill",
    artwork: marshalSoulCalifornicationCover,
    audioSrc: marshalSoulCalifornicationAudio,
  },
  {
    id: "chill-toby-rose-turn-the-lights-off",
    title: "Turn The Lights Off",
    artist: "Toby Rose, One Trick Pony",
    durationLabel: "3:02",
    mood: "chill",
    // From the file's embedded artwork (the "Turn The Lights Off" release;
    // the older placeholder artwork in `imports/Player` is Toby Rose's
    // different "Alone With You" release, so it isn't used here).
    artwork: tobyRoseTurnTheLightsOffCover,
    audioSrc: tobyRoseTurnTheLightsOffAudio,
  },
  {
    id: "chill-laud-lightkeeper",
    title: "Lightkeeper",
    artist: "Laud",
    durationLabel: "2:59",
    mood: "chill",
    // From the file's embedded artwork.
    artwork: laudLightkeeperCover,
    audioSrc: laudLightkeeperAudio,
  },
  {
    id: "chill-just-nearby-diamonds",
    title: "Diamonds",
    artist: "Just Nearby",
    durationLabel: "2:39",
    mood: "chill",
    artwork: justNearbyDiamondsCover,
    audioSrc: justNearbyDiamondsAudio,
  },
  {
    id: "chill-billie-eilish-ocean-eyes",
    title: "Ocean Eyes",
    artist: "Billie Eilish",
    durationLabel: "4:56",
    mood: "chill",
    artwork: billieEilishOceanEyesCover,
    // Keeps the face and the full "OCEAN EYES / THE REMIXES" title.
    artworkPositionDesktop: "center 100%",
    artworkPositionMobile: "center 100%",
    audioSrc: billieEilishOceanEyesAudio,
  },
  {
    id: "chill-dave-moffatt-forever-young",
    title: "Forever Young",
    artist: "Dave Moffatt, Jada Facer",
    durationLabel: "3:46",
    mood: "chill",
    // From the file's embedded artwork.
    artwork: daveMoffattForeverYoungCover,
    // Keeps both the artist line and the "Forever Young" title in frame.
    artworkPositionDesktop: "center 20%",
    artworkPositionMobile: "center 20%",
    audioSrc: daveMoffattForeverYoungAudio,
  },
  {
    id: "chill-gravagerz-chihiro",
    title: "Chihiro (Ice Version)",
    artist: "Gravagerz",
    durationLabel: "2:19",
    mood: "chill",
    // From the file's embedded artwork.
    artwork: gravagerzChihiroCover,
    audioSrc: gravagerzChihiroAudio,
  },
  {
    id: "chill-arcane-novaray-cant-get-you-out-of-my-head",
    title: "Can't Get You Out of My Head",
    artist: "Arcane Novaray",
    durationLabel: "3:11",
    mood: "chill",
    // From the file's embedded artwork ("Timeless Music 2", the album the
    // file is tagged with).
    artwork: arcaneNovarayCantGetYouOutOfMyHeadCover,
    // Keeps the full "TIMELESS MUSIC 2" title in frame.
    artworkPositionDesktop: "center 15%",
    artworkPositionMobile: "center 15%",
    audioSrc: arcaneNovarayCantGetYouOutOfMyHeadAudio,
  },
  {
    id: "chill-klaas-michael-roman-silence",
    title: "Silence",
    artist: "Klaas, Michael Roman",
    durationLabel: "3:22",
    mood: "chill",
    artwork: klaasMichaelRomanSilenceCover,
    // Gives the title room below the top edge.
    artworkPositionDesktop: "center 30%",
    artworkPositionMobile: "center 30%",
    audioSrc: klaasMichaelRomanSilenceAudio,
  },
  {
    id: "chill-dion-ora-real-love",
    title: "Real Love",
    artist: "Dion Ora",
    durationLabel: "8:14",
    mood: "chill",
    artwork: dionOraRealLoveCover,
    audioSrc: dionOraRealLoveAudio,
  },
  {
    id: "chill-ari-sing-from-body-to-soul",
    title: "From Body to Soul",
    artist: "Ari Sing",
    durationLabel: "5:06",
    mood: "chill",
    artwork: ariSingFromBodyToSoulCover,
    audioSrc: ariSingFromBodyToSoulAudio,
  },
  {
    id: "chill-paulwetz-moment",
    title: "Moment",
    artist: "Paulwetz",
    durationLabel: "3:50",
    mood: "chill",
    artwork: paulwetzMomentCover,
    audioSrc: paulwetzMomentAudio,
  },
  {
    id: "chill-dali-good-day",
    title: "Good Day",
    artist: "Dali",
    durationLabel: "3:01",
    mood: "chill",
    artwork: daliGoodDayCover,
    // Centered crop cuts off her head.
    artworkPositionDesktop: "center 0%",
    artworkPositionMobile: "center 0%",
    audioSrc: daliGoodDayAudio,
  },
  {
    id: "chill-dj-diac-strong-enough",
    title: "Strong Enough",
    artist: "DJ Diac, DJ Alex Man, Fatihabegim",
    durationLabel: "2:57",
    mood: "chill",
    artwork: djDiacStrongEnoughCover,
    // Keeps the top of her head in frame.
    artworkPositionDesktop: "center 20%",
    artworkPositionMobile: "center 20%",
    audioSrc: djDiacStrongEnoughAudio,
  },
]
