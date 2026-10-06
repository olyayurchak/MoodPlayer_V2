import { useEffect, useRef } from "react"
import MoodBubble from "./MoodBubble"
import { desktopBubbles, mobileBubbles, type BubbleSpec } from "../data/introBubbles"

/**
 * CTA activation "response" — each bubble's lift and stagger delay for the
 * wave in `index.css` (`bubble-wave-lift`), computed once here from the
 * approved (immutable) placement data rather than in `MoodBubble.tsx`
 * itself, since the delay needs every bubble in a breakpoint's dataset at
 * once to normalize against the farthest one. Never touches `dx`/`dy`
 * themselves.
 *
 * Every bubble lifts the same few px straight up (`liftPx`) — the wave is a
 * shared swell, not a scatter, so there's no per-bubble direction. The
 * delay comes from each bubble's distance to the wave's origin: the top
 * centre of the cluster (frame centre line, top edge of the highest visible
 * mask), which is where the CTA sits just above on both breakpoints. That
 * distance, normalized against the farthest bubble, times
 * `RESPONSE_DELAY_MAX_MS`, so bubbles nearest the button respond first and
 * the reaction travels outward and down through the cluster.
 */
const RESPONSE_DELAY_MAX_MS = 160
const MOBILE_RESPONSE_LIFT_PX = 4
const DESKTOP_RESPONSE_LIFT_PX = 6

type BubbleResponse = { responseX: number; responseY: number; responseDelay: number }

function computeBubbleResponses(bubbles: BubbleSpec[], liftPx: number): BubbleResponse[] {
  const originY = Math.min(...bubbles.map((bubble) => bubble.dy - bubble.maskSize / 2))
  const distances = bubbles.map((bubble) => Math.hypot(bubble.dx, bubble.dy - originY))
  const maxDistance = Math.max(...distances)

  return distances.map((distance) => ({
    responseX: 0,
    responseY: -liftPx,
    responseDelay: maxDistance === 0 ? 0 : (distance / maxDistance) * RESPONSE_DELAY_MAX_MS,
  }))
}

const mobileBubbleResponses = computeBubbleResponses(mobileBubbles, MOBILE_RESPONSE_LIFT_PX)
const desktopBubbleResponses = computeBubbleResponses(desktopBubbles, DESKTOP_RESPONSE_LIFT_PX)

// Desktop-only weak pointer field (see the effect below): eligibility gate,
// falloff radius, and max outward shift in px.
const POINTER_FIELD_QUERY =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
const POINTER_FIELD_RADIUS_PX = 220
const POINTER_FIELD_MAX_SHIFT_PX = 8

/**
 * The decorative bubble artwork bed (`feat/intro-motion-lab`).
 *
 * Bubble positions are frame-relative, so each set renders inside a frame-sized
 * relative container — absolute positioning is scoped to that container only.
 * Mobile and Desktop differ in bubble count and arrangement (8 vs 10), so they
 * are two configuration sets over one shared `MoodBubble` component, switched
 * at the single structural breakpoint. Array order is paint order, so it carries
 * each frame's approved overlap.
 *
 * The stable array `index` passed to each `MoodBubble` seeds its deterministic
 * idle-float timing (duration, delay, path variant) — see `MoodBubble.tsx`.
 *
 * Two motion concepts are live, both opacity/translate3d only so neither ever
 * touches placement, masks, or PNG geometry: a single mount-only entrance
 * (the `.mood-bubble-cluster` class below fades the cluster in from
 * `opacity: 0` over 450ms ease-out, `index.css`), and — once that entrance
 * has had time to finish — a subtle per-bubble idle drift (`.bubble-float*`,
 * also `index.css`). Both are gated behind `prefers-reduced-motion: no-
 * preference`; reduced-motion users see the full static cluster immediately,
 * with no spatial animation at all.
 *
 * The effect below pauses that idle drift — via a `data-motion-paused`
 * attribute read by CSS, not React state — whenever the tab is hidden
 * (`visibilitychange`) or the cluster scrolls offscreen (`IntersectionObserver`).
 * No per-frame loop and no per-frame re-render.
 *
 * The one pointer interaction this component does own is a weak Desktop-only
 * cursor field (the second effect below) — not the removed scatter/audio
 * state machine, which is preserved in full in `main`'s git history for this
 * file, and `bubble-scatter.mp3` itself is untouched on disk
 * (`src/assets/audio/`).
 */

export default function MoodBubbleCluster() {
  const clusterRef = useRef<HTMLDivElement>(null)
  const desktopContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster) return

    let hidden = document.hidden
    let offscreen = false

    const applyMotionState = () => {
      cluster.setAttribute("data-motion-paused", hidden || offscreen ? "true" : "false")
    }

    // Applied once up front, before the IntersectionObserver's first (async)
    // callback fires, so a tab already hidden at mount doesn't get a brief
    // unpaused flash of drift between mount and that first callback.
    applyMotionState()

    const handleVisibilityChange = () => {
      hidden = document.hidden
      applyMotionState()
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        offscreen = !entry.isIntersecting
        applyMotionState()
      },
      { threshold: 0 },
    )

    document.addEventListener("visibilitychange", handleVisibilityChange)
    observer.observe(cluster)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      observer.disconnect()
    }
  }, [])

  // Weak Desktop pointer field: spheres within POINTER_FIELD_RADIUS_PX of the
  // cursor drift a few px away from it, smooth falloff toward the edge, 0 at
  // rest and beyond it. Gated to real Desktop hover + fine pointer + motion
  // allowed (POINTER_FIELD_QUERY) so touch/keyboard/reduced-motion users never
  // attach a pointer listener at all. Entirely imperative — cached center
  // points and a single rAF-coalesced write per pointermove, no React state,
  // no per-frame loop. Writes the same `--bubble-shift-x`/`-y` custom
  // properties `.bubble-motion` already reads at rest (`MoodBubble.tsx`),
  // kept separate from the CTA wave's own `translate` property (`index.css`).
  useEffect(() => {
    const desktopContainer = desktopContainerRef.current
    const root = clusterRef.current?.closest<HTMLElement>("[data-intro-root]")
    if (!desktopContainer || !root) return

    const mql = window.matchMedia(POINTER_FIELD_QUERY)

    let centers: { el: HTMLElement; cx: number; cy: number }[] = []
    let pointerX = 0
    let pointerY = 0
    let hasPointer = false
    let listening = false
    let applyRafId: number | null = null
    let measureRafId: number | null = null

    const resetOffset = (el: HTMLElement) => {
      el.style.setProperty("--bubble-shift-x", "0px")
      el.style.setProperty("--bubble-shift-y", "0px")
    }

    const applyField = () => {
      applyRafId = null
      for (const { el, cx, cy } of centers) {
        if (!hasPointer) {
          resetOffset(el)
          continue
        }
        const dx = cx - pointerX
        const dy = cy - pointerY
        const distance = Math.hypot(dx, dy)
        if (distance >= POINTER_FIELD_RADIUS_PX) {
          resetOffset(el)
          continue
        }
        const falloff = (1 - distance / POINTER_FIELD_RADIUS_PX) ** 2
        const magnitude = falloff * POINTER_FIELD_MAX_SHIFT_PX
        // Direction from pointer to bubble center — outward, away from the
        // cursor. Zero-length-safe: a zero-distance bubble gets zero shift
        // rather than a NaN from dividing by a zero distance.
        const ux = distance === 0 ? 0 : dx / distance
        const uy = distance === 0 ? 0 : dy / distance
        el.style.setProperty("--bubble-shift-x", `${ux * magnitude}px`)
        el.style.setProperty("--bubble-shift-y", `${uy * magnitude}px`)
      }
    }

    const scheduleApply = () => {
      if (applyRafId !== null) return
      applyRafId = requestAnimationFrame(applyField)
    }

    // Centers come from each bubble's static placement wrapper (`MoodBubble.
    // tsx`'s outer div — never animated), not `.bubble-motion` or `.bubble-
    // float`, so idle drift or a prior field shift never skews REST geometry.
    const measureCenters = () => {
      const motionEls = desktopContainer.querySelectorAll<HTMLElement>(".bubble-motion")
      centers = Array.from(motionEls).flatMap((el) => {
        const placementEl = el.parentElement?.parentElement
        if (!placementEl) return []
        const rect = placementEl.getBoundingClientRect()
        return [{ el, cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 }]
      })
    }

    const scheduleMeasure = () => {
      if (measureRafId !== null) return
      measureRafId = requestAnimationFrame(() => {
        measureRafId = null
        measureCenters()
        if (applyRafId !== null) {
          cancelAnimationFrame(applyRafId)
          applyRafId = null
        }
        applyField()
      })
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return
      if (root.getAttribute("data-intro-activating") === "true") return
      pointerX = event.clientX
      pointerY = event.clientY
      hasPointer = true
      scheduleApply()
    }

    const handlePointerLeave = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return
      hasPointer = false
      scheduleApply()
    }

    const handleWindowBlur = () => {
      hasPointer = false
      scheduleApply()
    }

    const setup = () => {
      if (listening) return
      listening = true
      measureCenters()
      root.addEventListener("pointermove", handlePointerMove, { passive: true })
      root.addEventListener("pointerleave", handlePointerLeave, { passive: true })
      window.addEventListener("resize", scheduleMeasure, { passive: true })
      window.addEventListener("scroll", scheduleMeasure, { passive: true })
      window.addEventListener("blur", handleWindowBlur)
    }

    const teardown = () => {
      if (listening) {
        listening = false
        root.removeEventListener("pointermove", handlePointerMove)
        root.removeEventListener("pointerleave", handlePointerLeave)
        window.removeEventListener("resize", scheduleMeasure)
        window.removeEventListener("scroll", scheduleMeasure)
        window.removeEventListener("blur", handleWindowBlur)
      }
      if (applyRafId !== null) {
        cancelAnimationFrame(applyRafId)
        applyRafId = null
      }
      if (measureRafId !== null) {
        cancelAnimationFrame(measureRafId)
        measureRafId = null
      }
      hasPointer = false
      centers.forEach(({ el }) => resetOffset(el))
    }

    const evaluateEligibility = () => {
      const activating = root.getAttribute("data-intro-activating") === "true"
      if (mql.matches && document.visibilityState === "visible" && !activating) setup()
      else teardown()
    }

    // CTA activation always wins over the pointer field: the instant it
    // starts, suspend and reset — read directly off `data-intro-activating`
    // via its own narrowly-scoped observer rather than polling it on every
    // pointermove. `evaluateEligibility` also excludes an active CTA, so a
    // visibility or media-query change during the wave can't reactivate it.
    const activationObserver = new MutationObserver(() => {
      if (root.getAttribute("data-intro-activating") === "true") teardown()
    })
    activationObserver.observe(root, { attributes: true, attributeFilter: ["data-intro-activating"] })

    evaluateEligibility()
    mql.addEventListener("change", evaluateEligibility)
    document.addEventListener("visibilitychange", evaluateEligibility)

    return () => {
      mql.removeEventListener("change", evaluateEligibility)
      document.removeEventListener("visibilitychange", evaluateEligibility)
      activationObserver.disconnect()
      teardown()
    }
  }, [])

  return (
    <div
      ref={clusterRef}
      aria-hidden
      className="mood-bubble-cluster pointer-events-none absolute inset-0 overflow-hidden"
      data-motion-paused="false"
    >
      <div className="absolute top-0 left-1/2 h-frame-h w-frame-w -translate-x-1/2 lg:hidden">
        {mobileBubbles.map((bubble, index) => (
          <MoodBubble
            key={bubble.id}
            index={index}
            {...bubble}
            isMobile
            {...mobileBubbleResponses[index]}
          />
        ))}
      </div>
      <div
        ref={desktopContainerRef}
        className="absolute top-0 left-1/2 hidden h-frame-h-lg w-frame-w-lg -translate-x-1/2 lg:block"
      >
        {desktopBubbles.map((bubble, index) => (
          <MoodBubble key={bubble.id} index={index} {...bubble} {...desktopBubbleResponses[index]} />
        ))}
      </div>
    </div>
  )
}
