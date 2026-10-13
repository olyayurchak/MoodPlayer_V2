import type { PlayerTrack } from "./playerTrack"
import joyCrookesFeetDontFailMeNowAudio from "../assets/audio/happy/joy-crookes_-feet-dont-fail-me-now.mp3"
import oneRepublicIAintWorriedAudio from "../assets/audio/happy/onerepublic-i-aint-worried.mp3"
import sebastianSchubSingLikeMadonnaAudio from "../assets/audio/happy/sebastian-schub-sing-like-madonna.mp3"
import tiestoBeautifulPlacesAudio from "../assets/audio/happy/tiësto-beautiful-places.mp3"
import coldplayAdventureOfALifetimeAudio from "../assets/audio/happy/coldplay-adventure-of-a-lifetime.mp3"
import gorillazFeelGoodAudio from "../assets/audio/happy/gorillaz-feel-good.mp3"
import calvinHarrisFeelSoCloseAudio from "../assets/audio/happy/calvin-harris-feel-so-close.mp3"
import dnceCakeByTheOceanAudio from "../assets/audio/happy/dnce-cake-by-the-ocean.mp3"
import johnLegendMadeToLoveAudio from "../assets/audio/happy/john-legend-made-to-love.mp3"
import elemerShutUpAndDanceAudio from "../assets/audio/happy/elemer-feat-robert-cristian-dayana-alis-shut-up-and-dance.mp3"
import chrisLorenzoInThisBihAudio from "../assets/audio/happy/chris-lorenzo-in-this-bih.mp3"
import kimoSoundsEveryFallAudio from "../assets/audio/happy/kimo-sounds-every-fall.mp3"
import joyCrookesFeetDontFailMeNowCover from "../assets/covers/happy/joy-crookes-feet-dont-fail-me-now.jpg"
import oneRepublicIAintWorriedCover from "../assets/covers/happy/onerepublic-i-aint-worried.png"
import sebastianSchubSingLikeMadonnaCover from "../assets/covers/happy/sebastian-schub-sing-like-madonna.jpg"
import tiestoBeautifulPlacesCover from "../assets/covers/happy/tiësto-beautiful-places.jpg"
import coldplayAdventureOfALifetimeCover from "../assets/covers/happy/coldplay-adventure-of-a-lifetime.jpg"
import gorillazFeelGoodCover from "../assets/covers/happy/gorillaz-feel-good.jpg"
import calvinHarrisFeelSoCloseCover from "../assets/covers/happy/calvin-harris-feel-so-close-18-months.jpg"
import dnceCakeByTheOceanCover from "../assets/covers/happy/techno-cake-by-the-ocean.jpg"
import johnLegendMadeToLoveCover from "../assets/covers/happy/john-legend-made-to-love.jpg"
import elemerShutUpAndDanceCover from "../assets/covers/happy/elemer-feat-robert-cristian-dayana-alis-shut-up-and-dance.jpg"
import chrisLorenzoInThisBihCover from "../assets/covers/happy/chris-lorenzo-in-this-bih.jpg"
import kimoSoundsEveryFallCover from "../assets/covers/happy/kimo-sounds-every-fall.png"

/**
 * The real Happy playlist, in stored play order. Positions 1–4 are fixed
 * by explicit instruction (OneRepublic, Joy Crookes, Tiësto, Sebastian
 * Schub); 5–12 were chosen once and stay as written — this order is never
 * shuffled at runtime (Shuffle only changes *playback* order, see
 * `PlayerScreen.tsx`).
 *
 * Title/artist come from each audio file's own ID3 tags, with
 * download-site suffixes stripped. Approved display choices that differ
 * from the tags: Elemer's credit is shortened (tags also list Dayana &
 * Alis); the techno edit of "Cake By The Ocean" (tagged "Error404") is
 * credited to DNCE to match its cover. `durationLabel`s are the files'
 * real durations — the Player replaces them with the live `<audio>`
 * duration once metadata loads.
 *
 * Covers taken from a file's own embedded artwork are noted per track;
 * the rest were supplied in `assets/covers/happy/`.
 *
 * Every cover is square inside the 479:342 artwork frame (`object-fit:
 * cover` crops ~29% of its height); `artworkPosition*` is set only where
 * the centered crop would cut the cover's main subject or title.
 */
export const happyTracks: PlayerTrack[] = [
  {
    id: "happy-onerepublic-i-aint-worried",
    title: "I Ain't Worried",
    artist: "OneRepublic",
    durationLabel: "2:28",
    mood: "happy",
    artwork: oneRepublicIAintWorriedCover,
    // Centered crop cuts the "ONEREPUBLIC" line at the top.
    artworkPositionDesktop: "center 15%",
    artworkPositionMobile: "center 15%",
    audioSrc: oneRepublicIAintWorriedAudio,
  },
  {
    id: "happy-joy-crookes-feet-dont-fail-me-now",
    title: "Feet Don't Fail Me Now",
    artist: "Joy Crookes",
    durationLabel: "3:18",
    mood: "happy",
    // From the audio file's embedded artwork.
    artwork: joyCrookesFeetDontFailMeNowCover,
    // A little more headroom above her face.
    artworkPositionDesktop: "center 40%",
    artworkPositionMobile: "center 40%",
    audioSrc: joyCrookesFeetDontFailMeNowAudio,
  },
  {
    id: "happy-tiesto-beautiful-places",
    title: "Beautiful Places",
    artist: "Tiësto, Brieanna Grace",
    durationLabel: "2:59",
    mood: "happy",
    artwork: tiestoBeautifulPlacesCover,
    // Keeps the full "TIËSTO / BEAUTIFUL PLACES" title block, umlaut included.
    artworkPositionDesktop: "center 5%",
    artworkPositionMobile: "center 5%",
    audioSrc: tiestoBeautifulPlacesAudio,
  },
  {
    id: "happy-sebastian-schub-sing-like-madonna",
    title: "Sing Like Madonna",
    artist: "Sebastian Schub",
    durationLabel: "3:33",
    mood: "happy",
    // From the audio file's embedded artwork.
    artwork: sebastianSchubSingLikeMadonnaCover,
    // Centered crop cuts the top of his head.
    artworkPositionDesktop: "center 30%",
    artworkPositionMobile: "center 30%",
    audioSrc: sebastianSchubSingLikeMadonnaAudio,
  },
  {
    id: "happy-coldplay-adventure-of-a-lifetime",
    title: "Adventure Of A Lifetime",
    artist: "Coldplay",
    durationLabel: "4:24",
    mood: "happy",
    artwork: coldplayAdventureOfALifetimeCover,
    audioSrc: coldplayAdventureOfALifetimeAudio,
  },
  {
    id: "happy-gorillaz-feel-good-inc",
    title: "Feel Good Inc.",
    artist: "Gorillaz",
    durationLabel: "3:42",
    mood: "happy",
    artwork: gorillazFeelGoodCover,
    // Keeps the full "FEEL GOOD inc EP" title in frame (the small Gorillaz
    // logo at the bottom edge can't fit alongside it).
    artworkPositionDesktop: "center 10%",
    artworkPositionMobile: "center 10%",
    audioSrc: gorillazFeelGoodAudio,
  },
  {
    id: "happy-calvin-harris-feel-so-close",
    title: "Feel So Close",
    artist: "Calvin Harris",
    durationLabel: "3:26",
    mood: "happy",
    // From the audio file's embedded artwork ("18 Months", the album this
    // recording is tagged with) — replaces the earlier cover, which is the
    // "Sequence • Everson Remix" release's. Needs review.
    artwork: calvinHarrisFeelSoCloseCover,
    // Keeps both the "CALVIN HARRIS / 18 MONTHS" block and the figure.
    artworkPositionDesktop: "center 60%",
    artworkPositionMobile: "center 60%",
    audioSrc: calvinHarrisFeelSoCloseAudio,
  },
  {
    id: "happy-cake-by-the-ocean-techno",
    title: "Cake By The Ocean",
    artist: "DNCE",
    durationLabel: "2:30",
    mood: "happy",
    artwork: dnceCakeByTheOceanCover,
    // Gives the "DNCE" lettering breathing room from the top edge.
    artworkPositionDesktop: "center 40%",
    artworkPositionMobile: "center 40%",
    audioSrc: dnceCakeByTheOceanAudio,
  },
  {
    id: "happy-john-legend-made-to-love",
    title: "Made to Love",
    artist: "John Legend",
    durationLabel: "4:00",
    mood: "happy",
    // From the audio file's embedded artwork ("Love In The Future").
    artwork: johnLegendMadeToLoveCover,
    audioSrc: johnLegendMadeToLoveAudio,
  },
  {
    id: "happy-elemer-shut-up-and-dance",
    title: "Shut Up And Dance",
    artist: "Elemer feat. Robert Cristian",
    durationLabel: "2:32",
    mood: "happy",
    // Previously approved, but this is Walk the Moon's artwork for their
    // own (acoustic) version, not Elemer's — still worth a final review.
    artwork: elemerShutUpAndDanceCover,
    audioSrc: elemerShutUpAndDanceAudio,
  },
  {
    id: "happy-chris-lorenzo-in-this-bih",
    title: "In This Bih'",
    artist: "Chris Lorenzo, Kah-Lo",
    durationLabel: "3:31",
    mood: "happy",
    artwork: chrisLorenzoInThisBihCover,
    audioSrc: chrisLorenzoInThisBihAudio,
  },
  {
    id: "happy-kimo-sounds-every-fall",
    title: "Every Fall",
    artist: "Kimo Sounds",
    durationLabel: "3:32",
    mood: "happy",
    artwork: kimoSoundsEveryFallCover,
    audioSrc: kimoSoundsEveryFallAudio,
  },
]
