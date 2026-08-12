import faceRecognitionIcon from "../imports/CameraPermission/face-recognition.png"
import shieldIcon from "../imports/CameraPermission/shield.png"
import padlockIcon from "../imports/CameraPermission/padlock.png"
import type { CameraPermissionFeatureId } from "../localization/translations"

/**
 * The three privacy/feature statements on the Camera Permission screen,
 * each icon exported directly from the approved Figma frames (Desktop
 * `284:2422`, Mobile `287:6243` — identical content and icon assets on
 * both).
 *
 * Purely structural now — icon + size, neither language-dependent. The
 * label *text* lives in `../localization/translations.ts`
 * (`cameraPermission.features`, keyed by this same `id`), so
 * `CameraPermissionScreen.tsx` looks it up there via `t.cameraPermission
 * .features[feature.id]` rather than reading a `label` field here.
 */
export type CameraPermissionFeature = {
  id: CameraPermissionFeatureId
  icon: string
  /** Approved per-item label size, px. Figma sizes these individually —
   *  the first row is 18px, the other two are 16px — not uniformly, so this
   *  isn't a shared constant. */
  labelSize: 18 | 16
}

export const cameraPermissionFeatures: CameraPermissionFeature[] = [
  {
    id: "facial-cues",
    icon: faceRecognitionIcon,
    labelSize: 18,
  },
  {
    id: "on-device",
    icon: shieldIcon,
    labelSize: 16,
  },
  {
    id: "not-recorded",
    icon: padlockIcon,
    labelSize: 16,
  },
]
