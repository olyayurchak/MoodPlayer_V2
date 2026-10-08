import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react"
import { Canvas } from "@react-three/fiber"
import contentUrl from "../assets/intro3/orb-happy-man-blue-v2.png"
import flowerUrl from "../assets/intro3/orb-flower-blue-v8.png"
import noteUrl from "../assets/intro3/orb-note-blue-v1.png"
import concertUrl from "../assets/intro3/orb-concert-stage-v1.png"
import noteVioletUrl from "../assets/intro3/orb-note-violet-v1.png"
import headphonesGirlV2Url from "../assets/intro3/orb-headphones-girl-v2.png"
import vinylPurpleUrl from "../assets/intro3/orb-vinyl-purple-v2.png"
import colorCloudBurstUrl from "../assets/intro3/orb-color-cloud-burst-v2-square.png"
import skyHeadphonesGirlUrl from "../assets/intro3/orb-sky-headphones-girl-v1.png"
import synthBlueUrl from "../assets/intro3/orb-synth-blue-v1.png"
import { desktopBubbles, mobileBubbles } from "../data/introBubbles"
import GlassOrb, {
  type OrbClusterBounds,
  type OrbContent,
  type OrbFrameSpot,
  type OrbPointer,
  type OrbSlot,
} from "./GlassOrb"

/**
 * Orb slots, placed with Intro 1's layout rules (fixed-px frame anchored
 * top-centre, `lg` breakpoint — see `GlassOrb`'s `OrbSlot`). Desktop uses
 * Intro 1's own composition (`intro1DesktopSlot` below); the hand-placed
 * Desktop values here are kept but currently unused.
 *
 * Desktop (unused): a compact, layered bubble pack. The hero (laughing man) is the
 * focal point by placement — lower-centre — not by size: it sits in the
 * same large-orb family as the DJ girl, concert, vinyl and cloud (~180–196px),
 * which form a broad arc above and behind it; flower and the lower girl make
 * a front supporting layer; the two notes and synth (~128–152px) close the
 * sides. Neighbours overlap by roughly 15–35% of a diameter, so the group
 * reads as one pack (~880 × 320px at desktop). Offsets are px from the
 * 1440×1024 frame centre (top-anchored, so the pack sits at the same height
 * on every desktop screen), chosen so it stays above y ≈ 750 and 1024×768
 * isn't cropped. `order` is paint order (later = in front): the
 * upper arc sits behind, the lower layer and hero in front.
 *
 * Mobile: Intro 1's own Mobile composition, unchanged, read from
 * `mobileBubbles` by the photo Intro 1 actually shows in each slot — its
 * labels are out of step with its images (documented in `introBubbles.ts`,
 * e.g. its `flower` slot shows the laughing man). `null` = no such bubble on
 * Intro 1 Mobile (the orb is hidden there).
 */
function clusterSlot(desktop: OrbFrameSpot, mobileId: string | null): OrbSlot {
  if (!mobileId) return { desktop, mobile: null }
  const order = mobileBubbles.findIndex((b) => b.id === mobileId)
  if (order < 0) throw new Error(`[intro3] Intro 1 Mobile bubble "${mobileId}" not found`)
  const bubble = mobileBubbles[order]
  return { desktop, mobile: { dx: bubble.dx, dy: bubble.dy, diameter: bubble.maskSize, order } }
}

/** The hero (laughing man): lower-centre focal point, front-most. */
const HERO_SLOT = clusterSlot({ dx: 0, dy: 129, diameter: 190, order: 9 }, "flower")

/**
 * Intro 1's own Desktop composition, read from
 * `desktopBubbles` (centre offset `dx`/`dy`, visible diameter `maskSize`,
 * array index = paint order) for the bubble showing the same art — so their
 * sizes, positions and overlaps follow Intro 1 exactly. Mobile is unchanged
 * (taken from the slot passed in). The hand-placed desktop pack above is
 * currently unused; only its Mobile half is.
 */
function intro1DesktopSlot(slot: OrbSlot, desktopId: string): OrbSlot {
  const order = desktopBubbles.findIndex((b) => b.id === desktopId)
  if (order < 0) throw new Error(`[intro3] Intro 1 Desktop bubble "${desktopId}" not found`)
  const bubble = desktopBubbles[order]
  return { desktop: { dx: bubble.dx, dy: bubble.dy, diameter: bubble.maskSize, order }, mobile: slot.mobile }
}
const HERO_SLOT_INTRO1 = intro1DesktopSlot(HERO_SLOT, "laughing-man")

/**
 * Supporting orbs around the hero portrait. Each reuses `GlassOrb`
 * unchanged: same rendering, glass, edge and motion as the hero; only
 * content and placement differ.
 */
const SUPPORT_ORBS: {
  id: string
  content: OrbContent
  slot: OrbSlot
  /** Intro 1 Desktop bubble with the same art. */
  intro1Id: string
}[] = [
  {
    id: "flower-blue",
    // Circle measured from the asset (1254×1254): centre (626, 645.5) px,
    // radius 503 px.
    content: { url: flowerUrl, uvCentre: { u: 0.4992, v: 0.4852 }, uvRadius: 0.4013 },
    slot: clusterSlot({ dx: -143, dy: 139, diameter: 140, order: 7 }, "color-burst"),
    intro1Id: "flower",
  },
  {
    id: "note-blue",
    // Circle measured from the asset (1254×1254): centre (626, 622) px,
    // radius 515.5 px. Composition is in the asset — no zoom override.
    content: { url: noteUrl, uvCentre: { u: 0.4992, v: 0.504 }, uvRadius: 0.4111 },
    slot: clusterSlot({ dx: -368, dy: 119, diameter: 152, order: 0 }, null),
    intro1Id: "note-large",
  },
  {
    id: "concert-stage",
    // Circle measured from the asset (1254×1254): centre (625, 622) px,
    // radius 554 px. Composition is in the asset — no zoom override.
    content: { url: concertUrl, uvCentre: { u: 0.4984, v: 0.504 }, uvRadius: 0.4418 },
    slot: clusterSlot({ dx: -270, dy: 64, diameter: 182, order: 2 }, "headphones-woman"),
    intro1Id: "crowd",
  },
  {
    id: "note-violet",
    // Circle measured from the asset (1254×1254): centre (626, 635) px,
    // radius 557 px. Composition is in the asset — no zoom override.
    content: { url: noteVioletUrl, uvCentre: { u: 0.4992, v: 0.4936 }, uvRadius: 0.4441 },
    slot: clusterSlot({ dx: 15, dy: -8, diameter: 128, order: 6 }, "note-small"),
    intro1Id: "note-small",
  },
  {
    id: "headphones-girl-v2",
    // Circle measured from the asset (1254×1254): centre (626, 628) px,
    // radius 542 px. Composition is in the asset — no zoom override.
    content: { url: headphonesGirlV2Url, uvCentre: { u: 0.4992, v: 0.4994 }, uvRadius: 0.4322 },
    slot: clusterSlot({ dx: -137, dy: 9, diameter: 190, order: 4 }, "laughing-man"),
    intro1Id: "headphones-woman",
  },
  {
    id: "vinyl-purple",
    // Circle measured from the asset (1254×1254): centre (625, 630) px,
    // radius 573 px. The record sits ~8 px higher in the art (centre (624,
    // 622) px), and at this low on-screen spot the portrait image plane's
    // depth shift lifts it ~33 px more — so uvCentre is the record centre
    // compensated for that shift, to read centred in the orb. No zoom override.
    content: { url: vinylPurpleUrl, uvCentre: { u: 0.4965, v: 0.527 }, uvRadius: 0.4564 },
    slot: clusterSlot({ dx: 137, dy: 64, diameter: 196, order: 5 }, "vinyl"),
    intro1Id: "vinyl",
  },
  {
    id: "color-cloud-burst",
    // v2 art is 1287×1222; the shared mapping needs a square texture, so this
    // is a copy padded to 1287×1287 with transparent rows only (pixels
    // unchanged). Circle measured from it: centre (644, 636) px, radius
    // 532 px. Composition is in the asset — no zoom override.
    content: { url: colorCloudBurstUrl, uvCentre: { u: 0.5006, v: 0.5062 }, uvRadius: 0.413 },
    slot: clusterSlot({ dx: 278, dy: 19, diameter: 186, order: 3 }, "crowd"),
    intro1Id: "color-burst",
  },
  {
    // TEST orb for later comparison.
    id: "sky-headphones-girl",
    // Circle measured from the asset (1254×1254): centre (627, 627) px,
    // radius 555 px. Composition is in the asset — no zoom override.
    content: { url: skyHeadphonesGirlUrl, uvCentre: { u: 0.5, v: 0.5 }, uvRadius: 0.4422 },
    slot: clusterSlot({ dx: 205, dy: 163, diameter: 142, order: 8 }, "headphones-person"),
    intro1Id: "headphones-person",
  },
  {
    id: "synth-blue",
    // Circle measured from the asset (1254×1254): centre (626, 631) px,
    // radius 574 px. Full-bleed scene — no zoom override.
    content: { url: synthBlueUrl, uvCentre: { u: 0.4989, v: 0.4966 }, uvRadius: 0.4571 },
    slot: clusterSlot({ dx: 362, dy: 109, diameter: 146, order: 1 }, null),
    intro1Id: "keyboard",
  },
]
import OrbEnvironment from "./OrbEnvironment"
import { intro1Float } from "./intro1Float"

import { useReducedMotion } from "./useReducedMotion"

/**
 * Idle drift: Intro 1's own bubble float (`intro1Float`),
 * per orb, from the Intro 1 bubble whose slot it occupies (Desktop and
 * Mobile each by that slot's array index — `order`). The resting layer
 * under the pointer spring.
 */
const floatForSlot = (slot: OrbSlot) => intro1Float(slot.desktop.order, slot.mobile?.order ?? null)
const HERO_DRIFT = floatForSlot(HERO_SLOT_INTRO1)

/**
 * Hover lift-out directions (Desktop): unit vector (y up) away from
 * the orb's overlapping neighbours, each weighted by how deep it overlaps —
 * fully for neighbours painted in front (they cover its edge, which is what
 * makes a hovered orb read as merged), 0.35× for those behind (more overlap
 * with them just reads as coming forward over them). So the hovered orb
 * uncovers itself where it is most covered; frontmost orbs ease away from
 * the ones they sit on.
 */
const LIFT_DIRS = (() => {
  const spots = new Map<string, OrbFrameSpot>([
    ["hero", HERO_SLOT_INTRO1.desktop],
    ...SUPPORT_ORBS.map((orb) => [orb.id, intro1DesktopSlot(orb.slot, orb.intro1Id).desktop] as const),
  ])
  const dirOf = (spot: OrbFrameSpot) => {
    let x = 0
    let y = 0
    for (const other of spots.values()) {
      if (other === spot) continue
      const cx = spot.dx - other.dx
      const cy = spot.dy - other.dy
      const dist = Math.hypot(cx, cy)
      const overlap = (spot.diameter + other.diameter) / 2 - dist
      if (overlap <= 0 || dist === 0) continue
      const weight = overlap * (other.order > spot.order ? 1 : 0.35)
      x += (cx / dist) * weight
      y += (cy / dist) * weight
    }
    const len = Math.hypot(x, y) || 1
    return { x: x / len, y: -y / len }
  }
  return {
    hero: dirOf(HERO_SLOT_INTRO1.desktop),
    support: new Map(SUPPORT_ORBS.map((orb) => [orb.id, dirOf(spots.get(orb.id)!)])),
  }
})()
const SUPPORT_DRIFTS = new Map(
  SUPPORT_ORBS.map((orb) => [orb.id, floatForSlot(intro1DesktopSlot(orb.slot, orb.intro1Id))]),
)

const boundsOf = (spots: OrbFrameSpot[]): OrbClusterBounds => ({
  top: Math.min(...spots.map((spot) => spot.dy - spot.diameter / 2)),
  bottom: Math.max(...spots.map((spot) => spot.dy + spot.diameter / 2)),
})

/** The Intro 1 Mobile cluster's vertical bounds, for the short-screen fit in
 *  `GlassOrb` (`mobileFit`). */
const MOBILE_BOUNDS: OrbClusterBounds = boundsOf(
  [HERO_SLOT_INTRO1, ...SUPPORT_ORBS.map((orb) => orb.slot)]
    .map((slot) => slot.mobile)
    .filter((spot): spot is OrbFrameSpot => spot !== null),
)

/** The Desktop cluster's vertical bounds (the Intro 1 Desktop slots actually
 *  rendered), for the short-screen fit in `GlassOrb` (`desktopFit`). */
const DESKTOP_BOUNDS: OrbClusterBounds = boundsOf([
  HERO_SLOT_INTRO1.desktop,
  ...SUPPORT_ORBS.map((orb) => intro1DesktopSlot(orb.slot, orb.intro1Id).desktop),
])

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
  } catch {
    return false
  }
}

/** Static stand-in when WebGL is unavailable or the scene throws: the same
 *  content art, cropped round, centred where the orb would be. */
function OrbFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <img
        src={contentUrl}
        alt=""
        className="aspect-square w-[min(72vw,50vh,520px)] rounded-full opacity-90"
      />
    </div>
  )
}

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error("[intro3] WebGL orb failed, showing static fallback", error)
  }
  render() {
    return this.state.failed ? <OrbFallback /> : this.props.children
  }
}

/**
 * Full-stage transparent canvas hosting the glass orbs. The canvas covers the
 * whole stage (not just the cluster) so the orbs can drift and lean toward
 * the pointer without ever clipping at a canvas edge, and so pointer
 * coordinates map 1:1 onto the scene's viewport.
 *
 * Pointer: mouse only — touch/pen are ignored for this prototype (touch
 * interaction is out of scope). Listeners live on this wrapper, write into a
 * ref, and never cause a React render.
 *
 * Cost controls: DPR capped at 1.75, one 96×64 sphere, a baked PMREM env (no
 * HDRI download), and on-demand rendering under reduced motion.
 */
export default function GlassOrbCanvas() {
  const wrapper = useRef<HTMLDivElement>(null)
  const pointer = useRef<OrbPointer>({ active: false, x: 0, y: 0 })
  const reducedMotion = useReducedMotion()
  const [webgl] = useState(canUseWebGL)

  useEffect(() => {
    const el = wrapper.current
    if (!el) return
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return
      const rect = el.getBoundingClientRect()
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      pointer.current.active = true
    }
    const onLeave = () => {
      pointer.current.active = false
    }
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerleave", onLeave)
    window.addEventListener("blur", onLeave)
    return () => {
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("blur", onLeave)
    }
  }, [])

  return (
    <div ref={wrapper} aria-hidden className="absolute inset-0">
      {webgl ? (
        <SceneErrorBoundary>
          <Canvas
            flat
            dpr={[1, 1.75]}
            frameloop={reducedMotion ? "demand" : "always"}
            camera={{ fov: 30, position: [0, 0, 10], near: 0.1, far: 50 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          >
            <OrbEnvironment />
            <Suspense fallback={null}>
              <GlassOrb
                pointer={pointer}
                reducedMotion={reducedMotion}
                slot={HERO_SLOT_INTRO1}
                mobileFit={MOBILE_BOUNDS}
                desktopFit={DESKTOP_BOUNDS}
                drift={HERO_DRIFT}
                liftDir={LIFT_DIRS.hero}
              />
              {SUPPORT_ORBS.map((orb) => (
                <GlassOrb
                  key={orb.id}
                  pointer={pointer}
                  reducedMotion={reducedMotion}
                  content={orb.content}
                  slot={intro1DesktopSlot(orb.slot, orb.intro1Id)}
                  mobileFit={MOBILE_BOUNDS}
                  desktopFit={DESKTOP_BOUNDS}
                  drift={SUPPORT_DRIFTS.get(orb.id)!}
                  liftDir={LIFT_DIRS.support.get(orb.id)}
                />
              ))}
            </Suspense>
          </Canvas>
        </SceneErrorBoundary>
      ) : (
        <OrbFallback />
      )}
    </div>
  )
}
