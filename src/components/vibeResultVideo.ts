/** The Camera Permission orb's decorative video (`CameraPermissionVisual`). */
const VIBE_RESULT_VIDEO_URL = "/vibe-result.mp4"

let blobUrl: string | null = null
let started = false

/**
 * Downloads the video once, while the user is still on the Intro, and keeps
 * it in memory as a blob URL — so when the Camera Permission screen mounts
 * its `<video>` elements load from memory and start moving right away.
 * The plain URL doesn't help here: the host serves it `max-age=0,
 * must-revalidate` with range requests, so each new `<video>` went back to
 * the network (often re-downloading all ~3 MB) and only became playable
 * ~0.5–1 s after the screen appeared. Started from an idle callback so it
 * never competes with the Intro's first render. A failed download is
 * dropped so a later call can retry; until then the plain URL is used.
 */
export function preloadVibeResultVideo() {
  if (started || blobUrl) return
  started = true
  fetch(VIBE_RESULT_VIDEO_URL)
    .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(String(response.status)))))
    .then((blob) => {
      blobUrl = URL.createObjectURL(blob)
    })
    .catch(() => {
      started = false
    })
}

/** The in-memory copy once preloaded, otherwise the normal file URL. */
export function vibeResultVideoSrc() {
  return blobUrl ?? VIBE_RESULT_VIDEO_URL
}
