import { useEffect, useMemo, type RefObject } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

/** Tuning for the edge layer. Kept deliberately low — it should read as
 *  "glass edge", never as an outline. */
const EDGE = {
  /** Overall strength of the additive edge light. */
  intensity: 0.3,
  /** Fresnel falloff exponent: higher = confined closer to the silhouette. */
  power: 3.8,
  /** Neutral cool white (top/most of the rim) and a faint blue-violet that
   *  creeps in toward the lower edge. Linear-ish RGB, written straight out. */
  neutral: new THREE.Color("#eef1ff"),
  tint: new THREE.Color("#b7b8f2"),
} as const

/** Variant C proximity response: at full cursor proximity the rim is this
 *  much brighter and its falloff this much wider (lower power = the light
 *  reaches a little further in from the silhouette). Interpolated linearly
 *  from the rest values above, so proximity 0 is exactly the rest look. */
const EDGE_NEAR = { intensity: 0.5, power: 3.3 } as const

const vertexShader = /* glsl */ `
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  varying vec3 vObjectNormal;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = viewPosition.xyz;
    vViewNormal = normalize(normalMatrix * normal);
    vObjectNormal = normal;
    gl_Position = projectionMatrix * viewPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uIntensity;
  uniform float uPower;
  uniform vec3 uNeutral;
  uniform vec3 uTint;

  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  varying vec3 vObjectNormal;

  void main() {
    vec3 n = normalize(vViewNormal);
    vec3 v = normalize(-vViewPosition);

    // Fresnel-style term: ~0 facing the camera, rising toward grazing angles.
    float fresnel = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), uPower);

    // Mild non-uniformity so the rim isn't a perfect ring: one slow lobe
    // around the circumference, plus a gentle top-brighter gradient.
    float lobe = 0.5 + 0.5 * sin(dot(vObjectNormal, vec3(1.7, 1.1, 0.6)) * 1.9 + 0.8);
    float gradient = mix(0.7, 1.0, n.y * 0.5 + 0.5);
    float variation = mix(0.4, 1.0, lobe) * gradient;

    // Neutral overall, a faint blue-violet only toward the lower edge.
    vec3 color = mix(uNeutral, uTint, 0.35 * clamp(0.5 - 0.5 * n.y, 0.0, 1.0));

    // Additive light only (alpha 0): brightens the edge, never darkens the
    // page behind or occludes the content seen through the glass.
    gl_FragColor = vec4(color * fresnel * variation * uIntensity, 0.0);
  }
`

/**
 * Secondary edge layer over the glass shell: a tiny Fresnel shader on the
 * shell's own geometry, drawn after it (transparent list), additive, with no
 * depth write. The `MeshPhysicalMaterial` stays the primary glass; this only
 * restores a subtle sense of the shell at grazing angles.
 */
export default function OrbFresnelEdge({
  geometry,
  layered = false,
  proximity,
}: {
  geometry: THREE.BufferGeometry
  /** Variant C: cursor proximity, 0 (rest) → 1 (hover), already smoothed by
   *  the orb's Z-forward spring — so the rim brightens and fades in step
   *  with the orb coming forward. Absent = the fixed rest rim. */
  proximity?: RefObject<number>
  /** Variant C: draw in the transmissive list right after this orb's own
   *  shell (paint order, no depth test), not after every orb's shell — so a
   *  rear orb's rim light never lands on top of the orb in front of it. */
  layered?: boolean
}) {
  const material = useMemo(() => {
    const edge = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uIntensity: { value: EDGE.intensity },
        uPower: { value: EDGE.power },
        uNeutral: { value: EDGE.neutral },
        uTint: { value: EDGE.tint },
      },
      transparent: true,
      depthWrite: false,
      // RGB: dst + src (pure additive). Alpha: dst kept unchanged, so the
      // canvas stays exactly as transparent as the glass left it.
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      toneMapped: false,
    })
    if (layered) {
      ;(edge as THREE.ShaderMaterial & { transmission: number }).transmission = 1
      edge.depthTest = false
    }
    return edge
  }, [layered])

  useEffect(() => () => material.dispose(), [material])

  useFrame(() => {
    if (!proximity) return
    const p = THREE.MathUtils.clamp(proximity.current ?? 0, 0, 1)
    material.uniforms.uIntensity.value = THREE.MathUtils.lerp(EDGE.intensity, EDGE_NEAR.intensity, p)
    material.uniforms.uPower.value = THREE.MathUtils.lerp(EDGE.power, EDGE_NEAR.power, p)
  })

  return <mesh geometry={geometry} material={material} renderOrder={1} />
}
