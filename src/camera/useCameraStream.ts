import { useCallback, useEffect, useRef, useState } from "react"

export type CameraStreamStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "error"

type UseCameraStreamResult = {
  stream: MediaStream | null
  status: CameraStreamStatus
  /** The only entry point that ever calls `getUserMedia` — wire it to a
   *  real user action (a click), never call it on mount/effect. Guarded
   *  against re-entrancy and against a second real request once a stream
   *  already exists, so nothing here can ever produce a duplicate
   *  permission-request loop. */
  requestAccess: () => void
}

/**
 * Owns the camera `MediaStream`'s lifecycle for the Camera Permission →
 * Scanning flow (Guidelines §8: camera access must be optional, and only
 * requested after an explicit user action — never automatically, never
 * repeated after denial).
 *
 * `CameraPermissionScreen` never unmounts between its "prompt" and
 * "scanning" phases — it's the same mounted hook instance the whole
 * time — so the one `MediaStream` obtained here is naturally reused for
 * the scanning phase with no extra plumbing and no second permission
 * request. All tracks are stopped on unmount so the camera indicator
 * light turns off the moment this screen is left.
 */
export function useCameraStream(): UseCameraStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStreamStatus>("idle")
  const requestInFlightRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)

  const requestAccess = useCallback(() => {
    if (requestInFlightRef.current || streamRef.current) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable")
      return
    }

    requestInFlightRef.current = true
    setStatus("requesting")

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((mediaStream) => {
        requestInFlightRef.current = false
        streamRef.current = mediaStream
        setStream(mediaStream)
        setStatus("granted")
      })
      .catch((error: unknown) => {
        requestInFlightRef.current = false
        const name = error instanceof DOMException ? error.name : undefined
        if (name === "NotAllowedError" || name === "SecurityError") {
          setStatus("denied")
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setStatus("unavailable")
        } else {
          setStatus("error")
        }
      })
  }, [])

  // Stop every track on unmount only — status/`requestAccess` intentionally
  // aren't in this effect's concerns, so a status change never tears the
  // stream down early.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return { stream, status, requestAccess }
}
