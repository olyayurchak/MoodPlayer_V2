import { useEffect, useMemo, useRef, type RefObject } from "react"
import { useFrame, useLoader, useThree } from "@react-three/fiber"
import * as THREE from "three"
import portraitUrl from "../assets/intro3/orb-happy-man-blue-v2.png"
import OrbFresnelEdge from "./OrbFresnelEdge"
import OrbDischarge, { type DischargeState } from "./OrbDischarge"
import { orbDiscs } from "./orbDiscs"
import OrbPortraitRefraction from "./OrbPortraitRefraction"
import { floatOffset, type OrbFloat } from "./intro1Float"

/** Pointer position in canvas NDC (-1..1, y up), written by the DOM listener
 *  in `GlassOrbCanvas` — a plain mutable ref so moving the mouse never
 *  re-renders React. `active` is false when the mouse is outside the stage. */
export type OrbPointer = { active: boolean; x: number; y: number }

/** An orb's content art: URL plus where its circular cut-out sits in UV
 *  space (centre + radius). Defaults to the hero portrait. */
export type OrbContent = { url: string; uvCentre: { u: number; v: number }; uvRadius: number }

/** One Intro 1 bubble slot: centre offset from Intro 1's frame centre and
 *  visible diameter, all in CSS px (`dx`/`dy`/`maskSize` in
 *  `data/introBubbles.ts`). */
export type OrbFrameSpot = {
  dx: number
  dy: number
  diameter: number
  /** Intro 1 paint order (its array index — later paints in front). */
  order: number
}
/** An orb placed with Intro 1's own layout rules: its Desktop slot at
 *  ≥ 1024px wide, its Mobile slot below — `null` where Intro 1 has no bubble
 *  for it on Mobile (the orb is hidden there, as in Intro 1). */
export type OrbSlot = { desktop: OrbFrameSpot; mobile: OrbFrameSpot | null }

/** Intro 1's composition rules (`MoodBubbleCluster` + `IntroScreen`): one
 *  `lg` breakpoint, and a fixed-px frame (430×932 Mobile, 1440×1024 Desktop)
 *  anchored top-centre, bubbles at fixed px offsets from its centre — no
 *  scaling and no on-screen clamp; the viewport simply crops the frame. */
const INTRO1_LG_PX = 1024
const INTRO1_FRAME_H = { mobile: 932, desktop: 1024 }

/** A Mobile cluster's vertical extent in frame px (`dy` of its top and
 *  bottom silhouette edges), shared by every orb of one composition. */
export type OrbClusterBounds = { top: number; bottom: number }
/** Hover lift-out: how far (units of the orb's radius R) the hovered orb
 *  moves away from the neighbours covering it at full proximity, so it
 *  separates from the cluster — through the same spring as the pull, so it
 *  eases in and out. Desktop only. */
const LIFT_OUT = 0.26
/** Discharge states, by the cursor's distance from the orb's current centre
 *  in its own radii: "on the orb" with hysteresis (enter below `hoverIn`,
 *  leave above `hoverOut`, so resting on the edge can't flicker); "near" =
 *  seek, ramping in from `seekOut` to full at `seekIn`, only for the orb
 *  nearest the cursor. Both eased over time (rates, 1/s). */
const DISCHARGE_STATE = { hoverIn: 0.97, hoverOut: 1.04, seekOut: 2.1, seekIn: 1.45, hoverRate: 8, seekRate: 12 }
/** Pointer falloff (radii from the orb's centre): zero at `outer`, full at
 *  `inner`. Drives Z-forward, rim, discharge and lift, and the pull of every
 *  orb except the nearest (`PULL_NEAR`). */
const ATTRACT = { inner: 0.65, outer: 1.8 }
/** Pull strength (units of R) and Z-forward lift, hero / supporting orbs. */
const PULL_XY = { hero: 0.13, support: 0.18 }
const LIFT_Z = { hero: 0.22, support: 0.28 }
/** Desktop: the orb whose edge is nearest the cursor senses it from farther
 *  away — its pull uses this wider falloff (radii from its centre: zero at
 *  `outer`, full at `inner`). All other orbs, and Z-forward, rim, discharge
 *  and lift, keep the base `ATTRACT` falloff. */
const PULL_NEAR = {
  outer: 3.6,
  inner: 0.85,
  /** The nearest orb's pull strength × this (neighbours keep the base). */
  boost: 1.8,
  /** Hand-over blend: how clearly (in its own radii) an orb must be the
   *  nearest before it gets the full near behaviour — a crossfade between
   *  neighbours instead of a switch. */
  margin: 0.45,
}
/** Short-screen fit band (Mobile): from Intro 1's Mobile CTA bottom edge
 *  (fixed at 445px from the top, at any height) plus a gap, down to a bottom
 *  margin. */
const MOBILE_FIT_TOP_PX = 445 + 24
const MOBILE_FIT_BOTTOM_MARGIN_PX = 24

/** Where the portrait's own circular cut-out sits inside the PNG, in UV units
 *  (measured from the 1254×1254 asset: centre (627, 639) px, radius 587 px,
 *  sampled just inside). Sampling stays inside it so its hard edge never
 *  shows. */
const PORTRAIT_UV_CENTRE = { u: 0.5, v: 0.4902 }
const PORTRAIT_UV_RADIUS = 0.4675

/**
 * The content art is a circular portrait already cut out with a transparent
 * surround (1254×1254 RGBA), so it is used as-is: its own alpha defines the
 * circle — no extra crop or fade in code. Only colour space and filtering are
 * set on the loaded texture.
 */
function useContentTexture(url: string) {
  const texture = useLoader(THREE.TextureLoader, url)
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    // Trilinear mipmaps (three's defaults) suit a photo that is drawn
    // minified (~1254px → ~380px).
    texture.anisotropy = 4
    texture.needsUpdate = true
  }, [texture])
  return texture
}

/** How clearly this orb is the one nearest the pointer, 0 → 1 — the margin
 *  by which its screen edge is nearer than any other orb's, eased over
 *  `PULL_NEAR.margin` of its radius (0 for every other orb). Uses the orbs'
 *  published screen circles (`orbDiscs`, one frame old). */
const nearestScratch = new THREE.Vector2()
function nearestWeight(g: THREE.Object3D, p: OrbPointer, gl: THREE.WebGLRenderer) {
  const own = orbDiscs.get(g)
  if (!own) return 0
  const size = gl.getDrawingBufferSize(nearestScratch)
  const px = ((p.x + 1) / 2) * size.x
  const py = ((p.y + 1) / 2) * size.y
  const ownEdge = Math.hypot(px - own.x, py - own.y) - own.r
  let otherEdge = Infinity
  for (const disc of orbDiscs.values()) {
    if (disc !== own) otherEdge = Math.min(otherEdge, Math.hypot(px - disc.x, py - disc.y) - disc.r)
  }
  return THREE.MathUtils.smoothstep(otherEdge - ownEdge, 0, PULL_NEAR.margin * own.r)
}

const HERO_CONTENT: OrbContent = {
  url: portraitUrl,
  uvCentre: PORTRAIT_UV_CENTRE,
  uvRadius: PORTRAIT_UV_RADIUS,
}

export default function GlassOrb({
  pointer,
  reducedMotion,
  content = HERO_CONTENT,
  slot,
  mobileFit,
  liftDir,
  drift,
}: {
  pointer: RefObject<OrbPointer>
  reducedMotion: boolean
  /** Supporting orbs pass their own art; the hero uses the portrait. */
  content?: OrbContent
  /** Intro 1 composition. */
  slot: OrbSlot
  /** Mobile only: the whole cluster's bounds. Nothing changes while it ends
   *  `MOBILE_FIT_BOTTOM_MARGIN_PX` above the viewport bottom; on shorter
   *  screens the cluster is shifted up as one, and only if it would then
   *  cross into the CTA band is it also scaled down as one (positions and
   *  sizes together, so every overlap keeps its proportions). */
  mobileFit?: OrbClusterBounds
  /** Desktop: unit direction, y up, away from the neighbours covering this
   *  orb — where the hover lift-out moves it. */
  liftDir?: { x: number; y: number }
  /** Intro 1's own idle float for this orb's slot (`intro1Float`). Drift is
   *  one additive layer of the orb's position: rest layout + idle drift +
   *  pointer spring (XY pull and Z lift). */
  drift: OrbFloat
}) {
  const group = useRef<THREE.Group>(null)
  const contentTexture = useContentTexture(content.url)
  // Shared by the glass shell and its Fresnel edge layer.
  const shellGeometry = useMemo(() => new THREE.SphereGeometry(1, 128, 96), [])
  useEffect(() => () => shellGeometry.dispose(), [shellGeometry])
  const invalidate = useThree((state) => state.invalidate)
  const hero = content === HERO_CONTENT

  // Spring state in units of R — plain numbers, nothing allocated per frame.
  const motion = useRef({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 })
  /** Cursor proximity for the rim (`OrbFresnelEdge`), 0 → 1 — the Z-forward
   *  spring state over its maximum, so it is already proximity-shaped,
   *  smoothed and in step with the orb coming forward. */
  const rimProximity = useRef(0)
  /** Discharge: seek / hover state + cursor in the orb's frame. */
  const dischargeState = useRef<DischargeState>({ seek: 0, hover: 0, cx: 0, cy: 0 })
  const hoveredRef = useRef(false)
  const discScratch = useMemo(() => ({ size: new THREE.Vector2(), ndc: new THREE.Vector3() }), [])
  // Drop this orb from the discharge occlusion registry when it unmounts.
  useEffect(() => {
    const g = group.current
    return () => {
      if (g) orbDiscs.delete(g)
    }
  }, [])
  /** Discharge: a stable per-orb seed (from its art), so each orb has its
   *  own timing and filaments. */
  const arcSeed = useMemo(() => {
    let h = 0
    for (let i = 0; i < content.url.length; i++) h = (h * 31 + content.url.charCodeAt(i)) % 9973
    return h / 97.3
  }, [content.url])

  // Reduced motion switches the canvas to on-demand rendering; snap the
  // spring to rest and request one frame so the orb settles in place.
  useEffect(() => {
    if (!reducedMotion) return
    Object.assign(motion.current, { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 })
    invalidate()
  }, [reducedMotion, invalidate])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return

    const { size, viewport } = state
    const pxToWorld = viewport.width / size.width
    // Intro 1 layout: same breakpoint, same top-anchored frame, same px.
    const desktop = size.width >= INTRO1_LG_PX
    const spot = desktop ? slot.desktop : slot.mobile
    g.visible = spot !== null
    if (!spot) {
      orbDiscs.delete(g)
      return
    }
    const frameCentreY = (desktop ? INTRO1_FRAME_H.desktop : INTRO1_FRAME_H.mobile) / 2
    let screenY = frameCentreY + spot.dy
    let fitScale = 1
    if (!desktop && mobileFit) {
      const height = mobileFit.bottom - mobileFit.top
      const bandBottom = size.height - MOBILE_FIT_BOTTOM_MARGIN_PX
      fitScale = THREE.MathUtils.clamp((bandBottom - MOBILE_FIT_TOP_PX) / height, 0, 1)
      const clusterTop = Math.min(frameCentreY + mobileFit.top, bandBottom - height * fitScale)
      screenY = clusterTop + (spot.dy - mobileFit.top) * fitScale
    }
    // This orb's own radius; motion below is in units of it.
    const R = ((spot.diameter * fitScale) / 2) * pxToWorld
    // This breakpoint's float, and its px → world factor (scaled with the
    // cluster on short screens).
    const float = desktop ? drift.desktop : drift.mobile
    const driftPx = fitScale * pxToWorld
    const restX = spot.dx * fitScale * pxToWorld
    const restY = -(screenY - size.height / 2) * pxToWorld
    // Intro 1's overlaps need its paint order (later = in front). The orbs
    // sit at one depth, so otherwise their draw order is arbitrary. A
    // Group's `renderOrder` is three's `groupOrder`: it sorts every object
    // of this orb (portrait layer, shell, edge) in every render list —
    // including the transmission pass — as one layer.
    g.renderOrder = spot.order
    g.scale.setScalar(R)

    if (reducedMotion) {
      g.position.set(restX, restY, 0)
      return
    }

    // Pointer target (in R units).
    let tx = 0
    let ty = 0
    let tz = 0
    const p = pointer.current
    if (p?.active) {
      const dx = ((p.x * viewport.width) / 2 - restX) / R
      const dy = ((p.y * viewport.height) / 2 - restY) / R
      const d = Math.hypot(dx, dy)
      const t = THREE.MathUtils.clamp((ATTRACT.outer - d) / (ATTRACT.outer - ATTRACT.inner), 0, 1)
      const influence = t * t * (3 - 2 * t)
      // The orb nearest the cursor (Desktop) senses it earlier, pulls harder
      // and lifts out; neighbours stay on the base behaviour. Everything
      // "near" is blended by `near` (0 → 1), so handing over to a neighbour
      // is a crossfade, never a switch.
      const near = desktop ? nearestWeight(g, p, state.gl) : 0
      let pullInfluence = influence
      if (near > 0) {
        const tp = THREE.MathUtils.clamp((PULL_NEAR.outer - d) / (PULL_NEAR.outer - PULL_NEAR.inner), 0, 1)
        pullInfluence = THREE.MathUtils.lerp(influence, tp * tp * (3 - 2 * tp), near)
      }
      if (d > 1e-4) {
        const strength = (hero ? PULL_XY.hero : PULL_XY.support) * (1 + near * (PULL_NEAR.boost - 1))
        const pull = Math.min(d, 1) * strength * pullInfluence
        tx = (dx / d) * pull
        ty = (dy / d) * pull
      }
      tz = (hero ? LIFT_Z.hero : LIFT_Z.support) * influence
      // Lift-out: the nearest orb also eases away from the neighbours that
      // cover it as the cursor closes in — only it lifts (× `near`); the
      // cluster stays put.
      if (liftDir && desktop) {
        const lift = LIFT_OUT * near * THREE.MathUtils.smoothstep(pullInfluence, 0.45, 1)
        tx += liftDir.x * lift
        ty += liftDir.y * lift
      }
    }

    // Exact critically damped spring: responsive approach, softer release.
    // Z is monotonic with proximity, so it selects the same rate for all
    // axes. dt capped so a stalled tab never produces a jump when it resumes.
    const dt = Math.min(delta, 1 / 30)
    const m = motion.current
    const omega = Math.sqrt(tz >= m.z ? 36 : 25)
    const decay = Math.exp(-omega * dt)
    const step = (position: number, velocity: number, target: number) => {
      const displacement = position - target
      const impulse = velocity + omega * displacement
      return [target + (displacement + impulse * dt) * decay, (velocity - omega * impulse * dt) * decay] as const
    }
    ;[m.x, m.vx] = step(m.x, m.vx, tx)
    ;[m.y, m.vy] = step(m.y, m.vy, ty)
    ;[m.z, m.vz] = step(m.z, m.vz, tz)
    rimProximity.current = m.z / (hero ? LIFT_Z.hero : LIFT_Z.support)

    // Intro 1's float: translation only (CSS px, y down), no Z.
    const [fx, fy] = float ? floatOffset(float, state.clock.elapsedTime) : [0, 0]
    const x = restX + m.x * R + fx * driftPx
    const y = restY + m.y * R - fy * driftPx
    const z = m.z * R
    // Perspective compensation for the pointer's Z lift: moving toward the
    // camera also pushes the projected centre away from the screen centre
    // (the cluster sits below it, so downward), which fought the pull when
    // the pointer came from above. Scaling the offset from the camera axis
    // by (camZ − z) / camZ keeps the projected centre exactly where it would
    // be without the lift — the orb still moves forward (depth, size,
    // refraction), only the screen shift is cancelled.
    const cam = state.camera.position
    const k = (cam.z - z) / cam.z
    g.position.set(cam.x + (x - cam.x) * k, cam.y + (y - cam.y) * k, z)

    // Discharge state: cursor on the orb → energized (hover); near but
    // outside, and this orb nearest → reaching for the cursor (seek).
    {
      const ds = dischargeState.current
      const pt = pointer.current
      let hoverTarget = 0
      let seekTarget = 0
      if (pt?.active && desktop) {
        const cx = ((pt.x * viewport.width) / 2 - g.position.x) / R
        const cy = ((pt.y * viewport.height) / 2 - g.position.y) / R
        const cd = Math.hypot(cx, cy)
        ds.cx = cx
        ds.cy = cy
        hoveredRef.current = cd < (hoveredRef.current ? DISCHARGE_STATE.hoverOut : DISCHARGE_STATE.hoverIn)
        hoverTarget = hoveredRef.current ? 1 : 0
        if (!hoveredRef.current) {
          seekTarget =
            nearestWeight(g, pt, state.gl) *
            (1 - THREE.MathUtils.smoothstep(cd, DISCHARGE_STATE.seekIn, DISCHARGE_STATE.seekOut))
        }
      } else {
        hoveredRef.current = false
      }
      ds.hover += (hoverTarget - ds.hover) * (1 - Math.exp(-DISCHARGE_STATE.hoverRate * dt))
      ds.seek += (seekTarget - ds.seek) * (1 - Math.exp(-DISCHARGE_STATE.seekRate * dt))
    }
    // Publish this orb's screen circle (drawing-buffer px) for the discharge
    // overlays' front-orb occlusion (`OrbDischarge`).
    const buffer = state.gl.getDrawingBufferSize(discScratch.size)
    const ndc = discScratch.ndc.copy(g.position).project(state.camera)
    const fov = (state.camera as THREE.PerspectiveCamera).fov ?? 30
    const focal = buffer.y / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2))
    const depth = cam.z - g.position.z
    orbDiscs.set(g, {
      x: (ndc.x * 0.5 + 0.5) * buffer.x,
      y: (ndc.y * 0.5 + 0.5) * buffer.y,
      r: (R * focal) / Math.sqrt(Math.max(depth * depth - R * R, 1e-6)),
      order: g.renderOrder,
    })
  })

  return (
    <group ref={group}>
      <OrbPortraitRefraction
        geometry={shellGeometry}
        texture={contentTexture}
        uvCentre={content.uvCentre}
        uvRadius={content.uvRadius}
      />

      {/* Premultiplied "over" blend: the glass's alpha is the transmitted
          alpha, but its reflections are *added* regardless — so they stay
          visible over the DOM background instead of being multiplied away,
          as three's `premultipliedAlpha` flag would do in-shader. */}
      <mesh geometry={shellGeometry}>
        <meshPhysicalMaterial
          transmission={1}
          ior={1.48}
          thickness={0.7}
          roughness={0.05}
          metalness={0}
          clearcoat={0.6}
          clearcoatRoughness={0.015}
          specularIntensity={1}
          iridescence={0.3}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[220, 420]}
          blending={THREE.CustomBlending}
          blendSrc={THREE.OneFactor}
          blendDst={THREE.OneMinusSrcAlphaFactor}
          blendSrcAlpha={THREE.OneFactor}
          blendDstAlpha={THREE.OneMinusSrcAlphaFactor}
          // Overlapping orbs sit in one plane, so their spheres intersect and
          // depth testing would let the larger one hide the smaller wherever
          // they overlap. Intro 1's bubbles are flat circles layered by paint
          // order, so visibility is left to the paint-ordered draw (the
          // group's `renderOrder`).
          depthTest={false}
        />
      </mesh>

      {/* The rim light is drawn in paint order right after its own shell, so
          an orb in front covers a rear orb's rim instead of the rear rim
          landing on top of it. */}
      <OrbFresnelEdge geometry={shellGeometry} layered proximity={rimProximity} />
      <OrbDischarge proximity={rimProximity} state={dischargeState} seed={arcSeed} enabled={!reducedMotion} />
    </group>
  )
}
