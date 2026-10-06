import { useEffect, useMemo, useRef, type RefObject } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { orbDiscs } from "./orbDiscs"

/** The two discharge states, written each frame by `GlassOrb` (smoothed):
 *  `seek` 0 → 1 while the cursor is near but outside the orb (it reaches for
 *  the cursor), `hover` 0 → 1 while the cursor is on the orb (energized,
 *  around the whole orb); `cx`/`cy` = cursor in the orb's own frame (R
 *  units, y up). */
export type DischargeState = { seek: number; hover: number; cx: number; cy: number }

/**
 * Tuning for the hover discharge (Variant C). Distances are in units of the
 * orb radius R (1 = silhouette); proximity is the orb's smoothed cursor
 * proximity, 0 (rest) → 1 (hover).
 */
const DISCHARGE = {
  /** Billboard half-size: discharges (and the cursor-seeking bolts, which
   *  reach up to the end of the seek range) can reach this far. */
  extent: 2.9,
  /** Nothing below this proximity (the quad isn't drawn at all). */
  start: 0.45,
  /** Overall brightness. */
  intensity: 0.8,
  /** Max orbs that can paint in front of one orb (the cluster has 10). */
  maxFront: 10,
} as const

const vertexShader = /* glsl */ `
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uProximity;
  uniform float uSeed;
  uniform float uIntensity;
  uniform float uSeek;
  uniform float uHover;
  uniform vec2 uCursor;
  // Screen circles (drawing-buffer px: centre xy, radius z) of the orbs that
  // paint in front of this one.
  uniform vec3 uFront[${DISCHARGE.maxFront}];
  uniform int uFrontCount;

  varying vec2 vP;

  float hash(float x) { return fract(sin(x * 127.1 + uSeed * 311.7) * 43758.5453); }
  float noise1(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f)) * 2.0 - 1.0;
  }
  float angDiff(float a, float b) { return atan(sin(a - b), cos(a - b)); }
  // A filament's sideways offset (R units, along the rim) at distance
  // fraction s: proportional to its own length, so it always travels mostly
  // outward — kinked and crackling, never a near-tangent streak.
  float wander(float s, float len, float cyc, float fk) {
    float w = 0.3 * noise1(s * 4.0 + cyc * 3.1 + fk * 8.0)
            + 0.06 * noise1(s * 13.0 + uTime * 9.0 + fk * 1.7);
    return w * s * len;
  }

  void main() {
    float r = length(vP);
    // Radius units per screen pixel, so line widths are in screen px.
    float px = max(fwidth(r), 1e-4);
    if (r < 1.0 - 6.0 * px || r > ${DISCHARGE.extent.toFixed(3)}) discard;
    float theta = atan(vP.y, vP.x);
    // Own-orb masks. The bright core never runs on the glass: hard cut at
    // the silhouette. Glow is light in front of the orb, so it spills ~5 px
    // over the rim and fades — a hard cut there is what read as the energy
    // passing *behind* the glass, on another plane.
    float coreMask = smoothstep(1.0 - 0.5 * px, 1.0 + 0.5 * px, r);
    float glowMask = smoothstep(1.0 - 5.0 * px, 1.0, r);
    // Nothing over an orb that paints in front of this one (cut at its
    // silhouette, not faded through its translucent rim).
    float front = 1.0;
    for (int i = 0; i < ${DISCHARGE.maxFront}; i++) {
      if (i >= uFrontCount) break;
      float dist = length(gl_FragCoord.xy - uFront[i].xy);
      front *= smoothstep(uFront[i].z - 0.5, uFront[i].z + 0.75, dist);
    }
    if (front <= 0.0) discard;
    // Energized state (cursor on the orb): the filaments around the orb.
    float g = smoothstep(${DISCHARGE.start.toFixed(3)}, 0.85, uProximity) * uHover;

    vec3 glowColor = vec3(0.0);
    vec3 coreColor = vec3(0.0);

    for (int k = 0; k < 5; k++) {
      float fk = float(k);
      float gate = smoothstep(0.45 + 0.08 * fk, 0.7 + 0.06 * fk, uProximity);
      if (gate <= 0.0) continue;
      // A new filament every 0.55–1.2 s per slot, visible for half of it —
      // short lives with real pauses between them, so the effect breathes.
      float period = 0.55 + hash(fk * 7.13) * 0.65;
      float cyclePos = uTime / period + hash(fk * 3.37);
      float cyc = floor(cyclePos);
      float life = fract(cyclePos) / 0.5;
      if (life > 1.0) continue;
      // Each slot fires on ~60% of its cycles, so the five slots leave real
      // pauses between bursts instead of always overlapping.
      if (hash(cyc * 13.7 + fk * 91.3) > 0.6) continue;
      float envelope = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.45, 1.0, life));

      // Base angle centre-weighted around the cursor direction.
      // Anywhere around the energized orb, independent of the cursor: each
      // slot starts from its own fifth of the circle and picks a new random
      // angle every cycle, so discharges keep appearing on different sides.
      float base = 6.2832 * (fk / 5.0 + 0.6 * hash(cyc * 5.17 + fk * 17.9));
      // Rooted exactly on the silhouette.
      float r0 = 1.0;
      float r1 = 1.2 + hash(cyc * 2.91 + fk * 4.3) * 0.45;
      float flicker = 0.7 + 0.3 * noise1(uTime * 45.0 + fk * 13.0);
      // Magenta-violet glow, cyan on two slots; hot white-pink core.
      vec3 tint = (k == 1 || k == 3) ? vec3(0.4, 0.85, 1.0) : vec3(0.95, 0.4, 1.0);
      float w0 = envelope * gate * flicker;
      // Contact node where the filament leaves the glass: the one part that
      // sits on the rim, so the energy visibly starts at the orb's edge.
      float nr = (r - r0) / px;
      float nt = angDiff(theta, base) * r / px;
      float node = nr * nr + nt * nt;
      glowColor += (vec3(1.0, 0.9, 1.0) * exp(-node / 6.0) * 0.9 + tint * exp(-node / 40.0) * 0.5) * w0;
      float s = (r - r0) / (r1 - r0);
      if (s < 0.0 || s > 1.0) continue;
      float taper = 1.0 - s * 0.8;

      // Main filament.
      float len = r1 - r0;
      float d = abs(angDiff(theta, base + wander(s, len, cyc, fk) / r)) * r / px;
      float core = exp(-d * d / 1.1);
      float glow = exp(-d * d / 45.0);

      // One side branch from partway out.
      float sb = 0.3 + hash(cyc * 1.7 + fk) * 0.3;
      float bs = (s - sb) / (1.0 - sb);
      if (bs > 0.0 && bs < 0.65) {
        float side = hash(cyc * 4.4 + fk * 2.0) > 0.5 ? 1.0 : -1.0;
        // Diverges from the main filament at a fixed ~29° slope.
        float lateral = wander(sb, len, cyc, fk) + (side * 0.55 * bs + 0.05 * noise1(bs * 9.0 + cyc * 2.3)) * (1.0 - sb) * len;
        float thb = base + lateral / r;
        float db = abs(angDiff(theta, thb)) * r / px;
        core += exp(-db * db / 0.9) * 0.7;
        glow += exp(-db * db / 30.0) * 0.5;
      }

      float w = w0 * taper;
      coreColor += vec3(1.0, 0.9, 1.0) * core * w;
      glowColor += tint * glow * 0.6 * w;
    }
    coreColor *= g;
    glowColor *= g;

    // Seek state (cursor near, outside): bolts from the rim to the cursor.
    // Rooted on the silhouette around the cursor direction, converging on
    // the cursor; sideways wander is zero at both ends and widest mid-way —
    // unstable searching static, not a straight beam. Re-strikes quickly.
    if (uSeek > 0.001) {
      float cd = length(uCursor);
      float cAngle = atan(uCursor.y, uCursor.x);
      float tip = max(cd - 0.03, 1.02);
      float slen = tip - 1.0;
      float ss = (r - 1.0) / slen;
      for (int k = 0; k < 3; k++) {
        if (ss < 0.0 || ss > 1.0) break;
        float fk = float(k);
        float period = 0.13 + hash(fk * 5.3 + 40.0) * 0.12;
        float cyclePos = uTime / period + hash(fk * 2.1 + 17.0);
        float cyc = floor(cyclePos);
        float life = fract(cyclePos) / 0.85;
        if (life > 1.0) continue;
        float envelope = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.55, 1.0, life));
        float rootOffset = (hash(cyc * 3.7 + fk * 11.0) - 0.5) * 0.5 * (1.0 - ss);
        float lateral = (0.32 * noise1(ss * 5.0 + cyc * 2.3 + fk * 7.0)
                       + 0.1 * noise1(ss * 16.0 + uTime * 14.0 + fk)) * slen * sin(3.1416 * ss);
        float d = abs(angDiff(theta, cAngle + rootOffset + lateral / r)) * r / px;
        float flicker = 0.7 + 0.3 * noise1(uTime * 50.0 + fk * 9.0);
        float w = envelope * flicker * (k == 0 ? 1.0 : 0.65) * (1.0 - 0.35 * ss);
        vec3 tint = k == 1 ? vec3(0.4, 0.85, 1.0) : vec3(0.95, 0.4, 1.0);
        coreColor += vec3(1.0, 0.9, 1.0) * exp(-d * d / 1.1) * w * uSeek;
        glowColor += tint * exp(-d * d / 45.0) * 0.6 * w * uSeek;
      }
      // Contact node on the rim and a small spark at the cursor end.
      vec2 rootP = vec2(cos(cAngle), sin(cAngle));
      vec2 tipP = rootP * tip;
      float nr = length(vP - rootP) / px;
      float nt = length(vP - tipP) / px;
      glowColor += (vec3(1.0, 0.9, 1.0) * (exp(-nr * nr / 6.0) * 0.9 + exp(-nt * nt / 5.0) * 0.6)
                  + vec3(0.95, 0.4, 1.0) * (exp(-nr * nr / 40.0) * 0.5 + exp(-nt * nt / 30.0) * 0.35)) * uSeek;
    }

    vec3 color = coreColor * coreMask + glowColor * glowMask;
    // Additive light only (alpha 0): never darkens or changes coverage.
    gl_FragColor = vec4(color * uIntensity * front, 0.0);
  }
`

/**
 * Electrostatic discharge around a hovered Variant C orb: short branching
 * filaments rooted on the glass rim that shoot outward, appearing at varying
 * places all around the orb while it is energized (cursor proximity only
 * decides whether, and how strongly, it is active). A
 * camera-facing quad on the orb's group (Variant C orbs aren't rotated), so
 * it can draw outside the sphere's silhouette — the sphere itself can't.
 *
 * Layering: a final overlay (transparent list, after all orb layers), so it
 * is never dimmed or overdrawn by any glass. It is cut out exactly at its own
 * silhouette (never on its own glass) and at the silhouettes of the orbs that
 * paint in front of its orb (`orbDiscs`), and lies over the orbs behind.
 */
export default function OrbDischarge({
  proximity,
  state: dischargeState,
  seed,
  enabled,
}: {
  /** Smoothed cursor proximity, 0 → 1 (the rim's input). */
  proximity: RefObject<number>
  /** Seek / hover state and cursor position (see `DischargeState`). */
  state: RefObject<DischargeState>
  /** Per-orb seed: different timing and filaments on every orb. */
  seed: number
  /** False under reduced motion: no animated discharge. */
  enabled: boolean
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(DISCHARGE.extent * 2, DISCHARGE.extent * 2),
    [],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  const material = useMemo(() => {
    const discharge = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uProximity: { value: 0 },
        uSeed: { value: seed },
        uIntensity: { value: DISCHARGE.intensity },
        uSeek: { value: 0 },
        uHover: { value: 0 },
        uCursor: { value: new THREE.Vector2() },
        uFront: { value: Array.from({ length: DISCHARGE.maxFront }, () => new THREE.Vector3()) },
        uFrontCount: { value: 0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      // RGB: dst + src (additive). Alpha: dst unchanged.
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      toneMapped: false,
    })
    // Plain transparent list: drawn after every orb's layers (they are all
    // in the transmissive list), so no glass, eraser or rim is ever drawn
    // over it — a clean outer overlay. Front orbs hide it via `uFront`.
    return discharge
  }, [seed])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state) => {
    const p = enabled ? THREE.MathUtils.clamp(proximity.current ?? 0, 0, 1) : 0
    const ds = dischargeState.current
    const seek = enabled && ds ? ds.seek : 0
    const hover = enabled && ds ? ds.hover : 0
    if (mesh.current) mesh.current.visible = seek > 0.01 || (hover > 0.01 && p > DISCHARGE.start)
    material.uniforms.uProximity.value = p
    material.uniforms.uSeek.value = seek
    material.uniforms.uHover.value = hover
    if (ds) (material.uniforms.uCursor.value as THREE.Vector2).set(ds.cx, ds.cy)
    material.uniforms.uTime.value = state.clock.elapsedTime
    // Front orbs' screen circles (published by `GlassOrb` each frame).
    const own = mesh.current?.parent ? orbDiscs.get(mesh.current.parent) : undefined
    const front = material.uniforms.uFront.value as THREE.Vector3[]
    let count = 0
    if (own) {
      for (const disc of orbDiscs.values()) {
        if (disc.order <= own.order || count >= front.length) continue
        front[count++].set(disc.x, disc.y, disc.r)
      }
    }
    material.uniforms.uFrontCount.value = count
  })

  return <mesh ref={mesh} geometry={geometry} material={material} renderOrder={2} visible={false} />
}
