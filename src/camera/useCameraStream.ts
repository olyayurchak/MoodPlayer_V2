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
  /** Stops every track and drops the stream (camera indicator off). Status
   *  stays `"granted"` if access was granted, so the next `requestAccess`
   *  re-acquires quietly — no `"requesting"` state, no permission UI. */
  release: () => void
}

/**
 * Owns the camera `MediaStream`'s lifecycle for the Camera Permission →
 * Scanning flow (Guidelines §8: camera access must be optional, and only
 * requested after an explicit user action — never automatically, never
 * repeated after denial).
 *
 * Owned by `App.tsx`, which releases the stream whenever the Camera
 * Permission screen is left (scan finished, or back to Intro) and
 * re-acquires it when that screen is shown again after an earlier grant
 * ("Scan again"). The camera is therefore only live during the scan
 * itself. A release while a request is still in flight discards the
 * stream it resolves with. All tracks are also stopped on unmount.
 */
export function useCameraStream(): UseCameraStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStreamStatus>("idle")
  const requestInFlightRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)
  /** Access was granted earlier this session (cleared again by a failure). */
  const grantedRef = useRef(false)
  /** Bumped by `release`, so a request resolving after it is discarded. */
  const generationRef = useRef(0)

  const requestAccess = useCallback(() => {
    if (requestInFlightRef.current || streamRef.current) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable")
      return
    }

    requestInFlightRef.current = true
    const generation = generationRef.current
    if (!grantedRef.current) setStatus("requesting")

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((mediaStream) => {
        requestInFlightRef.current = false
        grantedRef.current = true
        setStatus("granted")
        if (generation !== generationRef.current) {
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = mediaStream
        setStream(mediaStream)
      })
      .catch((error: unknown) => {
        requestInFlightRef.current = false
        grantedRef.current = false
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

  const release = useCallback(() => {
    generationRef.current++
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStream(null)
  }, [])

  // Also stop every track on unmount — status/`requestAccess` intentionally
  // aren't in this effect's concerns, so a status change never tears the
  // stream down early.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return { stream, status, requestAccess, release }
}
