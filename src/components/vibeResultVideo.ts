/** Native media element shared by the Intro preload and the permission orb. */
let video: HTMLVideoElement | undefined

export function preloadVibeResultVideo() {
  if (video) return video

  video = document.createElement("video")
  video.preload = "metadata"
  video.muted = true
  video.playsInline = true
  video.defaultPlaybackRate = 1.8
  video.playbackRate = video.defaultPlaybackRate
  video.src = "/vibe-result.mp4"
  return video
}
