import contentUrl from "../assets/intro3/orb-happy-man-blue-v2.webp"
import flowerUrl from "../assets/intro3/orb-flower-blue-v8.webp"
import noteUrl from "../assets/intro3/orb-note-blue-v1.webp"
import concertUrl from "../assets/intro3/orb-concert-stage-v1.webp"
import noteVioletUrl from "../assets/intro3/orb-note-violet-v1.webp"
import headphonesGirlV2Url from "../assets/intro3/orb-headphones-girl-v2.webp"
import vinylPurpleUrl from "../assets/intro3/orb-vinyl-purple-v2.webp"
import colorCloudBurstUrl from "../assets/intro3/orb-color-cloud-burst-v2-square.webp"
import skyHeadphonesGirlUrl from "../assets/intro3/orb-sky-headphones-girl-v1.webp"
import synthBlueUrl from "../assets/intro3/orb-synth-blue-v1.webp"

export const INTRO1_LG_PX = 1024

export const orbTextures = {
  hero: { url: contentUrl, mobileId: "flower" },
  flower: { url: flowerUrl, mobileId: "color-burst" },
  note: { url: noteUrl, mobileId: null },
  concert: { url: concertUrl, mobileId: "headphones-woman" },
  noteViolet: { url: noteVioletUrl, mobileId: "note-small" },
  headphonesGirl: { url: headphonesGirlV2Url, mobileId: "laughing-man" },
  vinyl: { url: vinylPurpleUrl, mobileId: "vinyl" },
  colorCloud: { url: colorCloudBurstUrl, mobileId: "crowd" },
  skyHeadphonesGirl: { url: skyHeadphonesGirlUrl, mobileId: "headphones-person" },
  synth: { url: synthBlueUrl, mobileId: null },
}

const preloadedUrls = new Set<string>()

export function preloadIntroOrbTextures() {
  const desktop = window.matchMedia(`(min-width: ${INTRO1_LG_PX}px)`)
  const preload = () => {
    for (const { url, mobileId } of Object.values(orbTextures)) {
      if ((!desktop.matches && mobileId === null) || preloadedUrls.has(url)) continue
      preloadedUrls.add(url)

      const link = document.createElement("link")
      link.rel = "preload"
      link.as = "image"
      link.crossOrigin = "anonymous" // Match Three.js TextureLoader.
      link.fetchPriority = "low"
      link.href = url
      document.head.append(link)
    }
  }

  preload()
  desktop.addEventListener("change", preload)
  return () => desktop.removeEventListener("change", preload)
}
