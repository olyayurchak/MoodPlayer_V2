/** The Camera Permission orb's decorative video. */
const VIBE_RESULT_VIDEO_URL = "/vibe-result.mp4"

let blobUrl: string | undefined
let pending: Promise<string> | undefined

export function vibeResultVideoSrc() {
  return blobUrl
}

/** Share the download between Intro and Camera Permission. */
export function preloadVibeResultVideo(): Promise<string> {
  if (blobUrl) return Promise.resolve(blobUrl)

  pending ??= fetch(VIBE_RESULT_VIDEO_URL)
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status))
      return response.blob()
    })
    .then((blob) => {
      blobUrl = URL.createObjectURL(blob)
      return blobUrl
    })
    .catch(() => VIBE_RESULT_VIDEO_URL)
    .finally(() => {
      pending = undefined
    })

  return pending
}
