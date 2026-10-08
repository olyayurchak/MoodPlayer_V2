import { useEffect, useRef, useState } from "react"
import type { GestureRecognizer as GestureRecognizerType } from "@mediapipe/tasks-vision"
import {
  GESTURE_CAMERA_CONSTRAINTS,
  GESTURE_CONFIDENCE,
  GESTURE_MODEL_ASSET_URL,
  GESTURE_TIMING,
  GESTURE_WASM_BASE_URL,
  type GestureAction,
} from "./gestureConfig"
import { createGestureStabilizer, type GestureObservation } from "./gestureStabilizer"

export type GestureControlStatus = "off" | "starting" | "active" | "denied" | "unavailable" | "error"

/** Statuses after which recognition has stopped and won't recover by itself. */
export const GESTURE_FAILURE_STATUSES: readonly GestureControlStatus[] = ["denied", "unavailable", "error"]

async function createRecognizer(): Promise<GestureRecognizerType> {
  const { FilesetResolver, GestureRecognizer } = await import("@mediapipe/tasks-vision")
  const vision = await FilesetResolver.forVisionTasks(GESTURE_WASM_BASE_URL)
  const options = (delegate: "GPU" | "CPU") => ({
    baseOptions: { modelAssetPath: GESTURE_MODEL_ASSET_URL, delegate },
    runningMode: "VIDEO" as const,
    numHands: 1,
    minHandDetectionConfidence: GESTURE_CONFIDENCE.minHandDetectionConfidence,
    minHandPresenceConfidence: GESTURE_CONFIDENCE.minHandPresenceConfidence,
    minTrackingConfidence: GESTURE_CONFIDENCE.minTrackingConfidence,
  })
  try {
    return await GestureRecognizer.createFromOptions(vision, options("GPU"))
  } catch {
    // Some devices/browsers can't create a GPU delegate.
    return await GestureRecognizer.createFromOptions(vision, options("CPU"))
  }
}

/**
 * Gesture Controls: while `enabled`, opens a front-camera stream of its own
 * (the scan screen's stream is already stopped by the time the Player is
 * shown), runs MediaPipe gesture recognition on it locally ~10× a second,
 * and calls `onAction` for deliberate, stabilised gestures (see
 * `gestureStabilizer.ts`). Frames are only read in-memory by the recognizer
 * — never drawn, stored, or sent anywhere.
 *
 * Turning it off stops the loop and the camera (indicator light goes off).
 * The recognizer itself is created once, on first use, and kept until the
 * Player unmounts so toggling doesn't reload the model.
 *
 * Owns no playback logic — the Player decides what each action does.
 */
export function useGestureControls({
  enabled,
  onAction,
}: {
  enabled: boolean
  onAction: (action: GestureAction) => void
}): { status: GestureControlStatus } {
  const [status, setStatus] = useState<GestureControlStatus>("off")
  const onActionRef = useRef(onAction)
  onActionRef.current = onAction
  const recognizerPromiseRef = useRef<Promise<GestureRecognizerType> | null>(null)

  useEffect(() => {
    if (!enabled) {
      setStatus("off")
      return
    }

    let cancelled = false
    let stream: MediaStream | null = null
    let video: HTMLVideoElement | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    const stabilizer = createGestureStabilizer()

    const stop = () => {
      cancelled = true
      if (timer !== null) clearTimeout(timer)
      timer = null
      stream?.getTracks().forEach((track) => track.stop())
      stream = null
      if (video) video.srcObject = null
      video = null
    }
    const fail = (next: GestureControlStatus) => {
      if (cancelled) return
      stop()
      setStatus(next)
    }

    setStatus("starting")

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) return fail("unavailable")
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: GESTURE_CAMERA_CONSTRAINTS, audio: false })
      } catch (error) {
        const name = error instanceof DOMException ? error.name : undefined
        if (name === "NotAllowedError" || name === "SecurityError") return fail("denied")
        if (name === "NotFoundError" || name === "OverconstrainedError") return fail("unavailable")
        return fail("error")
      }
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      stream.getVideoTracks()[0]?.addEventListener("ended", () => fail("unavailable"))

      let recognizer: GestureRecognizerType
      try {
        video = document.createElement("video")
        video.muted = true
        video.playsInline = true
        video.srcObject = stream
        await video.play()
        recognizerPromiseRef.current ??= createRecognizer()
        recognizer = await recognizerPromiseRef.current
      } catch {
        recognizerPromiseRef.current = null
        return fail("error")
      }
      if (cancelled) return

      setStatus("active")

      const tick = () => {
        if (cancelled || !video) return
        if (!document.hidden && video.readyState >= 2 && video.videoWidth > 0) {
          try {
            const now = performance.now()
            const result = recognizer.recognizeForVideo(video, now)
            const top = result.gestures[0]?.[0]
            const observation: GestureObservation = {
              handPresent: result.landmarks.length > 0,
              gesture: top?.categoryName ?? null,
              score: top?.score ?? 0,
            }
            const { action } = stabilizer.update(observation, now)
            if (action) onActionRef.current(action)
          } catch {
            return fail("error")
          }
        }
        timer = setTimeout(tick, GESTURE_TIMING.inferenceIntervalMs)
      }
      tick()
    }

    start()
    return stop
  }, [enabled])

  // Release the model when the Player goes away.
  useEffect(() => {
    return () => {
      recognizerPromiseRef.current?.then((recognizer) => recognizer.close()).catch(() => {})
      recognizerPromiseRef.current = null
    }
  }, [])

  return { status }
}
