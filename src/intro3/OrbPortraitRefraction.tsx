import { useEffect, useMemo } from "react"
import * as THREE from "three"

/**
 * Intro 3's orb portrait layer (the approved "Variant C" of the earlier glass
 * comparison).
 *
 * Replaces Variant A's flat content disc with a per-pixel "portrait seen
 * through curved glass" layer drawn on the front of the shell geometry:
 * for each fragment, the real view ray (in orb-local space) is refracted at
 * the sphere surface and intersected with the portrait plane behind the
 * centre; the portrait texture is sampled directly at that hit point.
 *
 * - Centre: ray ≈ surface normal, so almost no bend — the face stays stable.
 * - Edge: grazing rays bend strongly — distortion grows naturally toward the
 *   perimeter, driven by the actual normal/view geometry (also during the
 *   orb's motion, since it is evaluated per frame from the live camera).
 * - Fade: tied to the viewing angle (via the projected radius derived from
 *   N·V), so the portrait dissolves gradually as the glass turns edge-on —
 *   no drawn inner circle.
 *
 * Direct texture sampling (no render target, no extra pass): one draw call,
 * one texture fetch per pixel. Variant A's physical shell and Fresnel edge
 * stay on top unchanged, so only the portrait integration differs.
 */
const C = {
  /** Effective refraction strength. Low on purpose: the orb reads as a glass
   *  bubble around the portrait, not a solid lens (which would invert it). */
  ior: 1.28,
  /** Portrait plane, orb-local Z (same depth as Variant A's content disc). */
  planeZ: -0.22,
  /** Portrait UV units per orb-local unit at the plane — sets face scale. */
  uvPerUnit: 0.55,
  /** Edge fade over the sphere's projected radius ρ = sqrt(1 − (N·V)²):
   *  opaque inside `fadeFrom`, gone at `fadeTo`. Expressed in ρ rather than
   *  N·V because N·V changes fastest right at the rim, which made a fade in
   *  N·V read as a distinct window edge. */
  fadeFrom: 0.78,
  fadeTo: 1.0,
  opacity: 0.9,
} as const

/** Overlap eraser, on the same projected radius ρ: fully clears what lies
 *  beneath inside `from`, back to plain see-through at `to` (Variant A's
 *  occluder core uses the same band). */
const ERASE = { from: 0.9, to: 0.99 } as const

/** The asset's circular cut-out (see GlassOrb's PORTRAIT_UV_*): sampling is
 *  faded out just inside it so the PNG's hard edge can never show. */
const PORTRAIT_UV_CENTRE = new THREE.Vector2(0.4992, 0.4825)
const PORTRAIT_UV_RADIUS = 0.4425

const vertexShader = /* glsl */ `
  varying vec3 vObjectPosition;
  varying vec3 vCameraObject;

  void main() {
    vObjectPosition = position;
    vCameraObject = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uPortrait;
  uniform float uIor;
  uniform float uPlaneZ;
  uniform float uUvPerUnit;
  uniform vec2 uUvCentre;
  uniform float uUvRadius;
  uniform float uFadeFrom;
  uniform float uFadeTo;
  uniform float uOpacity;

  varying vec3 vObjectPosition;
  varying vec3 vCameraObject;

  void main() {
    vec3 n = normalize(vObjectPosition);
    vec3 incident = normalize(vObjectPosition - vCameraObject);
    vec3 refracted = refract(incident, n, 1.0 / uIor);

    // Intersect the refracted ray with the portrait plane z = uPlaneZ.
    float t = (uPlaneZ - vObjectPosition.z) / min(refracted.z, -1e-3);
    vec2 hit = vObjectPosition.xy + refracted.xy * t;

    vec2 uv = uUvCentre + hit * uUvPerUnit;
    vec4 portrait = texture2D(uPortrait, uv);

    // Fade with viewing angle (edge-on → transparent) and stay inside the
    // asset's own circular cut-out.
    float facing = clamp(dot(n, -incident), 0.0, 1.0);
    float rho = sqrt(1.0 - facing * facing);
    float edgeFade = 1.0 - smoothstep(uFadeFrom, uFadeTo, rho);
    float cut = 1.0 - smoothstep(0.9, 0.99, length(uv - uUvCentre) / uUvRadius);

    gl_FragColor = vec4(portrait.rgb, portrait.a * edgeFade * cut * uOpacity);
    #include <colorspace_fragment>
  }
`

export default function OrbPortraitRefraction({
  geometry,
  texture,
  uvCentre = PORTRAIT_UV_CENTRE,
  uvRadius = PORTRAIT_UV_RADIUS,
}: {
  geometry: THREE.BufferGeometry
  texture: THREE.Texture
  /** The art's circular cut-out in UV space; defaults to the hero portrait.
   *  `uvPerUnit` is normalised by it, so any art fills its orb the same way. */
  uvCentre?: { u: number; v: number } | THREE.Vector2
  uvRadius?: number
}) {
  const material = useMemo(() => {
    const portrait = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uPortrait: { value: texture },
        uIor: { value: C.ior },
        uPlaneZ: { value: C.planeZ },
        uUvPerUnit: { value: (C.uvPerUnit * uvRadius) / PORTRAIT_UV_RADIUS },
        uUvCentre: {
          value:
            uvCentre instanceof THREE.Vector2 ? uvCentre : new THREE.Vector2(uvCentre.u, uvCentre.v),
        },
        uUvRadius: { value: uvRadius },
        uFadeFrom: { value: C.fadeFrom },
        uFadeTo: { value: C.fadeTo },
        uOpacity: { value: C.opacity },
      },
      // Normal "over" blend; drawn right before its own glass shell, which
      // then adds its reflections on top.
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      depthWrite: false,
      // Paint order (the orb group's `renderOrder`), not depth, decides
      // front/back between orbs — see the layering note below.
      depthTest: false,
    })
    // Transmissive list — see the layering note below.
    ;(portrait as THREE.ShaderMaterial & { transmission: number }).transmission = 1
    return portrait
  }, [texture, uvCentre, uvRadius])
  useEffect(() => () => material.dispose(), [material])

  /**
   * Overlap layering. three draws all opaque-list objects, then all
   * transmissive, then all transparent — so with this layer in the opaque
   * list every orb's portrait was drawn first and every shell and edge after,
   * and a rear orb's shell highlights and rim light landed on top of the
   * portrait in front of it; the front portrait (≤ 0.9 opaque, fading out
   * across its outer band) also let the rear picture through.
   *
   * Instead, eraser → portrait → shell → edge all sit in the transmissive
   * list (`transmission = 1` on these ShaderMaterials only routes them
   * there; they receive no transmission uniforms, and being front-side they
   * are skipped by the transmission pass), so each orb is drawn complete, in
   * Intro 1's paint order, before the next. The eraser first removes what is
   * already drawn beneath the orb (dst ×= 1 − mask on the projected radius),
   * so the orb then blends over the page exactly as an isolated one does —
   * only the very silhouette hands back to what lies behind.
   */
  const eraserMaterial = useMemo(() => {
    const eraser = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec3 vViewNormal;
        varying vec3 vViewPosition;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = viewPosition.xyz;
          vViewNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vViewNormal;
        varying vec3 vViewPosition;
        void main() {
          float facing = clamp(dot(normalize(vViewNormal), normalize(-vViewPosition)), 0.0, 1.0);
          float rho = sqrt(1.0 - facing * facing);
          float mask = 1.0 - smoothstep(${ERASE.from.toFixed(4)}, ${ERASE.to.toFixed(4)}, rho);
          gl_FragColor = vec4(0.0, 0.0, 0.0, mask);
        }
      `,
      // dst.rgba *= (1 − mask): erase, add nothing.
      blending: THREE.CustomBlending,
      blendSrc: THREE.ZeroFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      depthTest: false,
      depthWrite: false,
    })
    ;(eraser as THREE.ShaderMaterial & { transmission: number }).transmission = 1
    return eraser
  }, [])
  useEffect(() => () => eraserMaterial.dispose(), [eraserMaterial])

  /**
   * Draws nothing, ever. It stays in the opaque list only so that, in three's
   * transmission pass, it clears the target to transparent (same reason as
   * Variant A's content disc: three would otherwise clear it to 50% white and
   * the shell would read milky). The portrait itself no longer enters that
   * pass, so the shell can't re-refract it.
   */
  const clearMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false }),
    [],
  )
  useEffect(() => () => clearMaterial.dispose(), [clearMaterial])
  const handleBeforeRender = useMemo(() => {
    const clearColor = new THREE.Color()
    return (renderer: THREE.WebGLRenderer) => {
      if (renderer.getRenderTarget() === null) return
      renderer.getClearColor(clearColor)
      const clearAlpha = renderer.getClearAlpha()
      renderer.setClearColor(0x000000, 0)
      renderer.clear(true, false, false)
      renderer.setClearColor(clearColor, clearAlpha)
    }
  }, [])

  return (
    <>
      <mesh geometry={geometry} material={clearMaterial} onBeforeRender={handleBeforeRender} />
      <mesh geometry={geometry} material={eraserMaterial} renderOrder={-2} />
      <mesh geometry={geometry} material={material} renderOrder={-1} />
    </>
  )
}
