import { useEffect, useRef } from "react"
import MoodBubble from "./MoodBubble"
import { desktopBubbles, mobileBubbles } from "../data/introBubbles"
import bubbleScatterSound from "../assets/audio/bubble-scatter.mp3"

/**
 * The decorative bubble artwork bed.
 *
 * Bubble positions are frame-relative, so each set renders inside a frame-sized
 * relative container — absolute positioning is scoped to that container only.
 * Mobile and Desktop differ in bubble count and arrangement (8 vs 10), so they
 * are two configuration sets over one shared `MoodBubble` component, switched
 * at the single structural breakpoint. Array order is paint order, so it carries
 * each frame's approved overlap.
 *
 * The stable array `index` passed to each `MoodBubble` seeds its deterministic
 * idle-float timing (duration, delay, path variant) — not a React list key.
 *
 * One-time scatter interaction — Desktop bubbles only, gated to `(hover: hover)
 * and (pointer: fine)` and disabled under `prefers-reduced-motion` — replaces
 * the earlier continuous cursor-proximity repulsion (which read as jitter
 * rather than a clear scatter). It's a small ref-based state machine
 * (`idle` → `scattered` → `returning` → `idle`), not a per-frame loop:
 *
 * - `idle`: a single `pointermove` on the Intro root (`[data-intro-root]`,
 *   from `IntroScreen.tsx`) checks whether the pointer freshly entered the
 *   bubble field's bounding box (+ padding). On a fresh entry, every visible
 *   Desktop bubble's scatter target is looked up from `DESKTOP_SCATTER_TARGETS`
 *   below — an explicit, designer-placed *target centre*, normalized 0–1
 *   relative to the Desktop stage's own bounds (`desktopContainerRef`, fixed
 *   at 1440×1024 to match the Figma frame exactly — not the responsive Intro
 *   root, which is wider than 1440px at most viewports and would otherwise
 *   put every target in the wrong coordinate space). That normalized centre
 *   is converted to a per-bubble pixel delta at
 *   scatter time (target centre − the bubble's current measured centre),
 *   then clamped against the viewport/frame and, separately, each of the
 *   heading / subtitle / CTA rects (only the bubble's *final* box is ever
 *   checked — never the path it travels to get there) and written once to
 *   `--bubble-shift-x/y` with a CSS `transition` set immediately before the
 *   write — the browser animates it, no JS loop. State becomes `scattered`.
 *   This exact branch — reached only once per idle→scattered transition —
 *   is also where `bubble-scatter.mp3` plays once (`playScatterSound`,
 *   kept separate from all geometry above); the same branch guard that
 *   already prevents recomputing geometry on a held scatter equally
 *   prevents replaying the sound.
 * - `scattered`: every further `pointermove` is ignored outright (no
 *   recalculation, no following). Only `pointerleave` on the Intro root
 *   (pointer left the whole screen, including out of the browser window)
 *   does anything: it writes `0px, 0px` (with the slower return transition)
 *   to every bubble and starts `returning`.
 * - `returning`: a single `setTimeout` matching the return transition's own
 *   duration flips back to `idle` when it's done — not a `transitionend`
 *   listener per bubble, since every bubble shares the same duration.
 *
 * Only the reserved `.bubble-motion` layer (`MoodBubble.tsx`) is ever
 * touched — the approved idle-float layer, the placement transform, and the
 * artwork layer are never written to.
 *
 * The scatter SFX (`bubble-scatter.mp3`) is one reusable `HTMLAudioElement`
 * (`scatterAudioRef`), created once at mount and never rebuilt — never a
 * fresh `Audio` per pointer event. `playScatterSound` just rewinds it
 * (`currentTime = 0`) and calls `.play()`, swallowing any rejection
 * (`.catch(() => {})`): a fresh/low-engagement browser profile can reject a
 * hover-triggered `.play()` outright (no trusted gesture has occurred on
 * the page yet — hover itself never counts as one), and that rejection is
 * expected, browser-controlled autoplay policy. It must never block or
 * delay the visual scatter, so it's swallowed here rather than surfaced.
 * This is deliberately the simplest possible implementation — no
 * `AudioContext`, no manual decode, no resume/unlock system, no pending-
 * playback bookkeeping — restored as the known-working baseline after
 * later attempts at a Web Audio-based version proved not to fix the
 * underlying autoplay-policy limitation anyway.
 */

/** Interaction padding around the union of visible bubble bounds, px. */
const FIELD_PADDING = 32
/** Margin kept clear of the viewport/frame edge when clamping, px. */
const SAFE_MARGIN = 16
/**
 * Visual margin kept clear of each visible content element (heading,
 * subtitle, CTA) when clamping a bubble's *final* position, px. Small on
 * purpose: this only needs to keep a bubble off the actual text/button
 * pixels, not off the empty space around them — a bubble's travel path is
 * allowed to cross that empty space freely (see `computeAndApplyScatter`).
 */
const VISIBLE_CONTENT_MARGIN = 8

const SCATTER_DURATION_MS = 750
const SCATTER_EASING = "cubic-bezier(0.33, 1, 0.68, 1)"
const RETURN_DURATION_MS = 950
const RETURN_EASING = "ease-in-out"

/** The 10 approved Desktop bubble ids (`data/introBubbles.ts`), as a union
 * so the target map below can't silently miss one or typo an id. */
type DesktopBubbleId =
  | "crowd"
  | "headphones-woman"
  | "laughing-man"
  | "vinyl"
  | "note-large"
  | "note-small"
  | "flower"
  | "color-burst"
  | "keyboard"
  | "headphones-person"

type ScatterTarget = { x: number; y: number }

/**
 * Desktop scatter target *centres*, one per bubble id — `x` / `y` are
 * normalized 0–1 coordinates of where that bubble's centre should land,
 * relative to the Desktop stage's own measured bounds (0,0 = its top-left
 * corner, 1,1 = its bottom-right corner) — the fixed 1440×1024 box that
 * matches the Figma frame, not the responsive Intro root around it.
 * Extracted directly from the
 * approved Figma frame `325:2` (`Intro / Desktop / Motion`, 1440×1024) —
 * each value is that bubble's own mask-group centre divided by the frame's
 * width/height, read from Figma's node metadata (not estimated from a
 * screenshot). Keys are spelled with the kebab-case ids used everywhere else
 * in this codebase. Converted to a per-bubble pixel delta at scatter time
 * (see `computeAndApplyScatter`), then run through the same edge/content
 * clamp as before, so a value can never break the hard safety requirements
 * (no overlap with the heading/CTA, no new clipping).
 */
const DESKTOP_SCATTER_TARGETS: Record<DesktopBubbleId, ScatterTarget> = {
  crowd: { x: 0.1088, y: 0.3981 },
  "color-burst": { x: 0.885, y: 0.3569 },
  "headphones-woman": { x: 0.186, y: 0.6356 },
  "note-small": { x: 0.3797, y: 0.5897 },
  vinyl: { x: 0.7392, y: 0.5707 },
  "laughing-man": { x: 0.5482, y: 0.7191 },
  keyboard: { x: 0.9056, y: 0.7646 },
  flower: { x: 0.3156, y: 0.8311 },
  "headphones-person": { x: 0.7301, y: 0.888 },
  "note-large": { x: 0.0674, y: 0.8652 },
}

/**
 * Each bubble's approved visible diameter in the Motion frame `325:2`, px —
 * read from that frame's own mask-group ellipses, independent of the idle
 * frame's sizes. Figma renders most bubbles smaller once scattered (idle and
 * Motion are two separate, independently-approved size records for the same
 * artwork), which this codebase didn't reproduce until now: idle size was
 * used throughout, including while scattered. Converted to a scale factor at
 * scatter time — `this diameter ÷ the bubble's own approved idle
 * `maskSize`` — applied only to the dedicated `.bubble-scale` layer
 * (`MoodBubble.tsx`), never to `size`/`maskSize` themselves, so the idle
 * record stays exactly as approved and only the scattered *render* shrinks.
 */
const DESKTOP_SCATTER_VISIBLE_DIAMETER: Record<DesktopBubbleId, number> = {
  crowd: 167.2588,
  "color-burst": 176.8853,
  "headphones-woman": 185.7096,
  "note-small": 121.6269,
  vinyl: 186.8807,
  "laughing-man": 186.6927,
  keyboard: 150,
  flower: 130.8506,
  "headphones-person": 126.6062,
  "note-large": 156,
}

type Rect = { left: number; top: number; right: number; bottom: number }

type FrameRect = { left: number; top: number; width: number; height: number }

type TrackedBubble = {
  el: HTMLElement
  id: string
  rect: DOMRect
  /** This bubble's approved idle visible diameter (`maskSize`), px — read
   *  from `data-bubble-visible-size` so the scale factor below is always
   *  computed against the actual approved idle record, not a duplicated
   *  copy of it. */
  visibleSize: number
}

function pointInRect(x: number, y: number, rect: Rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

/**
 * Writes one discrete target (position + scale) and lets a CSS transition
 * animate to it — on both the `.bubble-motion` shift layer and, separately,
 * its nested `.bubble-scale` child, so scale never overwrites the shift (or
 * idle-float) transform it composes with.
 */
function applyMotion(
  el: HTMLElement,
  x: number,
  y: number,
  scale: number,
  durationMs: number,
  easing: string,
) {
  el.style.transitionProperty = "transform"
  el.style.transitionDuration = `${durationMs}ms`
  el.style.transitionTimingFunction = easing
  el.style.setProperty("--bubble-shift-x", `${x}px`)
  el.style.setProperty("--bubble-shift-y", `${y}px`)

  const scaleEl = el.querySelector<HTMLElement>(".bubble-scale")
  if (scaleEl) {
    scaleEl.style.transitionProperty = "transform"
    scaleEl.style.transitionDuration = `${durationMs}ms`
    scaleEl.style.transitionTimingFunction = easing
    scaleEl.style.setProperty("--bubble-scale", String(scale))
  }
}

export default function MoodBubbleCluster() {
  const rootRef = useRef<HTMLDivElement>(null)
  const desktopContainerRef = useRef<HTMLDivElement>(null)

  const bubblesRef = useRef<TrackedBubble[]>([])
  const fieldRectRef = useRef<Rect | null>(null)
  const safeRectRef = useRef<Rect | null>(null)
  const contentRectsRef = useRef<Rect[]>([])
  const frameRectRef = useRef<FrameRect | null>(null)

  const stateRef = useRef<"idle" | "scattered" | "returning">("idle")
  const wasInsideFieldRef = useRef(false)
  const returnTimerRef = useRef<number | null>(null)
  const scatterAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const desktopContainer = desktopContainerRef.current
    const introRoot = document.querySelector<HTMLElement>("[data-intro-root]")
    if (!desktopContainer || !introRoot) return

    const capability = window.matchMedia("(hover: hover) and (pointer: fine)")
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

    // One reusable instance for the whole component's lifetime — never a
    // fresh `Audio` per pointer event. Constructing it doesn't itself touch
    // autoplay policy; only the `.play()` call below does.
    if (!scatterAudioRef.current) {
      const audio = new Audio(bubbleScatterSound)
      audio.loop = false
      scatterAudioRef.current = audio
    }

    // Kept separate from all bubble-geometry logic below, per this feature's
    // scope. Autoplay policy can reject a hover-triggered `.play()` before
    // any user gesture has occurred on the page — that rejection is expected
    // and must never block or delay the visual scatter, so it's swallowed
    // here rather than left to surface as an unhandled rejection.
    function playScatterSound() {
      const audio = scatterAudioRef.current
      if (!audio) return
      audio.currentTime = 0
      audio.play().catch(() => {})
    }

    let deactivate: (() => void) | null = null

    // Read-only geometry pass — mount, resize, and (re)activation only, never
    // inside a per-frame loop (there isn't one), so reads and writes never
    // interleave in the same frame.
    function measureGeometry() {
      // The Desktop stage (`desktopContainerRef`) is fixed at 1440×1024 and
      // maps 1:1 to the Figma frame's own coordinate space — the responsive
      // Intro root around it has no fixed width, so at any viewport other
      // than exactly 1440px wide it no longer matches, and normalizing
      // scatter targets against it would put every target in the wrong
      // place. Read once here and reused below for the safe-viewport clamp
      // too, rather than measuring the same element twice.
      const frameRect = desktopContainer!.getBoundingClientRect()
      frameRectRef.current = {
        left: frameRect.left,
        top: frameRect.top,
        width: frameRect.width,
        height: frameRect.height,
      }

      const nodes = desktopContainer!.querySelectorAll<HTMLElement>(".bubble-motion")
      const bubbles: TrackedBubble[] = []
      for (const el of nodes) {
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) continue // hidden at this breakpoint
        const visibleSize = parseFloat(el.dataset.bubbleVisibleSize ?? "") || rect.width
        bubbles.push({ el, id: el.dataset.bubbleId ?? "", rect, visibleSize })
      }
      bubblesRef.current = bubbles

      if (bubbles.length === 0) {
        fieldRectRef.current = null
        return
      }

      let minLeft = Infinity
      let minTop = Infinity
      let maxRight = -Infinity
      let maxBottom = -Infinity
      for (const bubble of bubbles) {
        minLeft = Math.min(minLeft, bubble.rect.left)
        minTop = Math.min(minTop, bubble.rect.top)
        maxRight = Math.max(maxRight, bubble.rect.right)
        maxBottom = Math.max(maxBottom, bubble.rect.bottom)
      }

      fieldRectRef.current = {
        left: minLeft - FIELD_PADDING,
        top: minTop - FIELD_PADDING,
        right: maxRight + FIELD_PADDING,
        bottom: maxBottom + FIELD_PADDING,
      }

      const viewportRight = document.documentElement.clientWidth
      const viewportBottom = document.documentElement.clientHeight
      safeRectRef.current = {
        left: Math.max(0, frameRect.left) + SAFE_MARGIN,
        top: Math.max(0, frameRect.top) + SAFE_MARGIN,
        right: Math.min(viewportRight, frameRect.right) - SAFE_MARGIN,
        bottom: Math.min(viewportBottom, frameRect.bottom) - SAFE_MARGIN,
      }

      // Three separate visible-content rectangles — heading, subtitle, CTA —
      // instead of one rect spanning the whole `[data-intro-content]`
      // wrapper. The wrapper's own bounding box is the union of all three,
      // which is wider than the CTA and taller than any single element; used
      // as a single exclusion zone it falsely flags a bubble that only
      // passes near the *empty space* beside/between them. Found via plain
      // DOM structure (semantic `h1` / `p` inside the wrapper, and the CTA's
      // own stable `.cta-pill` class) rather than new markup, since this
      // file's scope doesn't extend to `TextStack.tsx` / `CtaPill.tsx`.
      const contentEl = document.querySelector<HTMLElement>("[data-intro-content]")
      const rects: Rect[] = []
      if (contentEl) {
        const heading = contentEl.querySelector<HTMLElement>("h1")
        const subtitle = contentEl.querySelector<HTMLElement>("p")
        const cta = contentEl.querySelector<HTMLElement>(".cta-pill")
        for (const el of [heading, subtitle, cta]) {
          if (!el) continue
          const r = el.getBoundingClientRect()
          rects.push({
            left: r.left - VISIBLE_CONTENT_MARGIN,
            top: r.top - VISIBLE_CONTENT_MARGIN,
            right: r.right + VISIBLE_CONTENT_MARGIN,
            bottom: r.bottom + VISIBLE_CONTENT_MARGIN,
          })
        }
      }
      contentRectsRef.current = rects
    }

    // Pure compute-and-write pass — every input (bubble rects, frame/safe/
    // content rects) was already read during measureGeometry.
    function computeAndApplyScatter() {
      const frameRect = frameRectRef.current
      const safeRect = safeRectRef.current
      const contentRects = contentRectsRef.current
      if (!frameRect || !safeRect) return

      bubblesRef.current.forEach((bubble) => {
        const target = DESKTOP_SCATTER_TARGETS[bubble.id as DesktopBubbleId]
        if (!target) return // no explicit target for this id — stays at rest

        // Normalized target centre → absolute viewport point → the pixel
        // delta from this bubble's current (idle) centre. This is what
        // makes the target a *centre in Desktop-stage space*, not a fixed
        // offset from idle: it's recomputed from the bubble's actual
        // measured position every time, so it stays correct regardless of
        // where that bubble's idle placement happens to be.
        const targetCenterX = frameRect.left + target.x * frameRect.width
        const targetCenterY = frameRect.top + target.y * frameRect.height
        const currentCenterX = bubble.rect.left + bubble.rect.width / 2
        const currentCenterY = bubble.rect.top + bubble.rect.height / 2
        const desiredDx = targetCenterX - currentCenterX
        const desiredDy = targetCenterY - currentCenterY

        const desired = Math.hypot(desiredDx, desiredDy)
        if (desired < 1) return // effectively no movement requested

        const ux = desiredDx / desired
        const uy = desiredDy / desired

        // Closed-form clamp against the safe viewport/frame bounds: caps how
        // much *further* a bubble may move per axis without ever pulling one
        // back in if it's already past that edge in the approved
        // composition (preserving any existing intentional clipping).
        const availX =
          ux > 0
            ? safeRect.right - bubble.rect.right
            : ux < 0
            ? bubble.rect.left - safeRect.left
            : Infinity
        const availY =
          uy > 0
            ? safeRect.bottom - bubble.rect.bottom
            : uy < 0
            ? bubble.rect.top - safeRect.top
            : Infinity
        const maxByX = ux !== 0 ? Math.max(availX, 0) / Math.abs(ux) : Infinity
        const maxByY = uy !== 0 ? Math.max(availY, 0) / Math.abs(uy) : Infinity
        let distance = Math.min(desired, maxByX, maxByY)

        // Content-exclusion check — *final position only*. This never
        // samples the path a bubble travels along; it only asks "is the
        // bubble's box safe once it stops at distance d", so a target whose
        // straight-line path happens to cross open space near the heading,
        // subtitle, or CTA is never rejected or shortened for that reason —
        // only a final box that truly overlaps one of the three rects
        // triggers a reduction. Checked against all three separately: a
        // target clear of every individual rect is used as-is, even if it
        // would have overlapped the old single combined rect that spanned
        // the empty space between them.
        //
        // The one nuance: for a target whose full distance *does* overlap,
        // safety isn't necessarily monotonic in distance (a bubble can be
        // clear at distance 0, cross a rect at some middle distance, then
        // emerge clear again at the full distance) — so we check the full
        // distance first and only fall back to an 8-iteration binary search
        // (for the largest safe distance below it) when that full distance
        // itself is unsafe.
        const overlapsAt = (d: number) => {
          if (contentRects.length === 0) return false
          const left = bubble.rect.left + ux * d
          const right = bubble.rect.right + ux * d
          const top = bubble.rect.top + uy * d
          const bottom = bubble.rect.bottom + uy * d
          return contentRects.some(
            (rect) =>
              !(
                right < rect.left ||
                left > rect.right ||
                bottom < rect.top ||
                top > rect.bottom
              ),
          )
        }

        if (overlapsAt(distance)) {
          let lo = 0
          let hi = distance
          for (let iter = 0; iter < 8; iter++) {
            const mid = (lo + hi) / 2
            if (overlapsAt(mid)) hi = mid
            else lo = mid
          }
          distance = lo
        }

        distance = Math.max(distance, 0)

        // Motion-approved visible diameter ÷ this bubble's own approved idle
        // diameter — computed fresh from the live measurement above, not a
        // stored ratio, so it always reflects the actual rendered idle size.
        const targetDiameter = DESKTOP_SCATTER_VISIBLE_DIAMETER[bubble.id as DesktopBubbleId]
        const scale =
          targetDiameter && bubble.visibleSize > 0 ? targetDiameter / bubble.visibleSize : 1

        applyMotion(bubble.el, ux * distance, uy * distance, scale, SCATTER_DURATION_MS, SCATTER_EASING)
      })
    }

    function clearReturnTimer() {
      if (returnTimerRef.current !== null) {
        window.clearTimeout(returnTimerRef.current)
        returnTimerRef.current = null
      }
    }

    /** Snaps every bubble back to rest with no transition — resize/deactivate only. */
    function resetInstantly() {
      clearReturnTimer()
      stateRef.current = "idle"
      wasInsideFieldRef.current = false
      for (const bubble of bubblesRef.current) {
        bubble.el.style.transitionDuration = "0s"
        bubble.el.style.removeProperty("--bubble-shift-x")
        bubble.el.style.removeProperty("--bubble-shift-y")
        const scaleEl = bubble.el.querySelector<HTMLElement>(".bubble-scale")
        if (scaleEl) {
          scaleEl.style.transitionDuration = "0s"
          scaleEl.style.removeProperty("--bubble-scale")
        }
      }
    }

    function handlePointerMove(event: PointerEvent) {
      if (stateRef.current !== "idle") return // scattered/returning: ignore all movement
      const field = fieldRectRef.current
      if (!field) return
      const inside = pointInRect(event.clientX, event.clientY, field)
      if (inside && !wasInsideFieldRef.current) {
        stateRef.current = "scattered"
        playScatterSound()
        computeAndApplyScatter()
      }
      wasInsideFieldRef.current = inside
    }

    function handlePointerLeaveScreen() {
      if (stateRef.current !== "scattered") return // idle: nothing to return; already returning: no-op
      stateRef.current = "returning"
      wasInsideFieldRef.current = false
      for (const bubble of bubblesRef.current) {
        applyMotion(bubble.el, 0, 0, 1, RETURN_DURATION_MS, RETURN_EASING)
      }
      clearReturnTimer()
      returnTimerRef.current = window.setTimeout(() => {
        stateRef.current = "idle"
        returnTimerRef.current = null
      }, RETURN_DURATION_MS)
    }

    function handleResize() {
      requestAnimationFrame(() => {
        // Simpler and more stable than recomputing a live scatter against
        // new geometry: snap to rest, then re-measure fresh. A breakpoint
        // change (or any resize) never leaves bubbles stranded off-layout.
        if (stateRef.current !== "idle") resetInstantly()
        measureGeometry()
      })
    }

    function activate() {
      measureGeometry()
      introRoot!.addEventListener("pointermove", handlePointerMove, { passive: true })
      introRoot!.addEventListener("pointerleave", handlePointerLeaveScreen)
      window.addEventListener("resize", handleResize)

      deactivate = () => {
        introRoot!.removeEventListener("pointermove", handlePointerMove)
        introRoot!.removeEventListener("pointerleave", handlePointerLeaveScreen)
        window.removeEventListener("resize", handleResize)
        resetInstantly()
      }
    }

    function evaluate() {
      const shouldRun = capability.matches && !reducedMotion.matches
      if (shouldRun && !deactivate) {
        activate()
      } else if (!shouldRun && deactivate) {
        deactivate()
        deactivate = null
      }
    }

    evaluate()
    capability.addEventListener("change", evaluate)
    reducedMotion.addEventListener("change", evaluate)

    return () => {
      capability.removeEventListener("change", evaluate)
      reducedMotion.removeEventListener("change", evaluate)
      deactivate?.()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 h-frame-h w-frame-w -translate-x-1/2 lg:hidden">
        {mobileBubbles.map((bubble, index) => (
          <MoodBubble key={bubble.id} index={index} {...bubble} isMobile />
        ))}
      </div>
      <div
        ref={desktopContainerRef}
        className="absolute top-0 left-1/2 hidden h-frame-h-lg w-frame-w-lg -translate-x-1/2 lg:block"
      >
        {desktopBubbles.map((bubble, index) => (
          <MoodBubble key={bubble.id} index={index} {...bubble} />
        ))}
      </div>
    </div>
  )
}
