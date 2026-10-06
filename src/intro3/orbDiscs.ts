import type * as THREE from "three"

/**
 * Variant C: every orb's projected screen circle this frame, keyed by its
 * group — centre and silhouette radius in drawing-buffer pixels (origin
 * bottom-left, as `gl_FragCoord`), plus its Intro 1 paint order (higher =
 * in front). Written by `GlassOrb`, read by `OrbDischarge` so a discharge
 * drawn as a final overlay can still be hidden exactly behind the orbs that
 * paint in front of its own.
 */
export type OrbDisc = { x: number; y: number; r: number; order: number }
export const orbDiscs = new Map<THREE.Object3D, OrbDisc>()
