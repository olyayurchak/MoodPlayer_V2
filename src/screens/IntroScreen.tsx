import { useCallback, useEffect, useRef, useState } from "react"
import AppBackground from "../components/AppBackground"
import CtaPill from "../components/CtaPill"
import GlowDebugPanel from "../components/GlowDebugPanel"
import LanguageSwitcher from "../components/LanguageSwitcher"
import MoodBubbleCluster from "../components/MoodBubbleCluster"
import TextStack from "../components/TextStack"

/** Delay before the real `onCtaClick` fires after the CTA wave starts
 * (`index.css`'s `bubble-wave-lift`: 440ms per bubble, up to 160ms stagger,
 * peaking 40% in). By 500ms every bubble has visibly lifted and peaked
 * (~340ms for the last one) and most have settled, so the exit fade starts
 * once the main part of the wave has been seen, without a long wait. */
const CTA_WAVE_CALLBACK_DELAY_MS = 500

/** TEMPORARY: `?glow-debug=1` mounts the glow drift diagnostic panel. */
const GLOW_DEBUG = new URLSearchParams(window.location.search).get("glow-debug") === "1"

/**
 * MoodPlayer Intro screen.
 *
 * One shared responsive composition. The content column is normal flow (flex
 * column, centered); only the decorative background and bubble layers use
 * absolute positioning, each scoped to its own frame-sized container. A single
 * structural breakpoint (`lg`, 1024px) switches to the Desktop composition.
 *
 * `AppBackground` renders plain (no props) — the approved cooler
 * navy/violet/indigo glow palette (`data/introGlows.ts`) now applies to
 * every screen that uses it (Intro, Camera Permission/Scanning, Vibe
 * Result) via that one shared data source, not a per-screen override.
 *
 * Two data attributes give `MoodBubbleCluster`'s scatter interaction a stable
 * way to find this screen's own bounds without prop-drilling a ref through:
 * `data-intro-root` marks the full-viewport element whose `pointerleave`
 * means "the pointer left the Intro screen" (the scatter's return trigger),
 * and `data-intro-content` marks the heading + CTA column so the scatter can
 * keep bubbles clear of it.
 *
 * `onCtaClick` itself is still `App.tsx`'s own navigation callback, unchanged;
 * this screen now wraps it with a single coordinated CTA "wave" through the
 * bubble cluster before it fires (`handleCtaClick` below), rather than
 * forwarding it straight through. `CtaPill` itself, its enabled/focusable
 * state, and its own `:active` press feedback are all untouched — only which
 * function its `onClick` calls is different. A `data-intro-activating`
 * attribute (on this `<main>`, alongside the existing `data-intro-root`) is
 * the only signal the wave's CSS (`index.css`, scoped to `.bubble-float` /
 * `.bubble-motion`) needs; no scatter geometry, pointer state, or sound is
 * involved.
 *
 * `handleCtaClick` no-ops if there's no `onCtaClick` prop, and no-ops again
 * if `activatingRef` is already set — set the instant an activation is
 * accepted and never cleared again, so a fast double-click (or any click
 * after the first) can never start a second wave or a second pending
 * callback. `prefers-reduced-motion: reduce` or an already-hidden tab at
 * click time skips the wave and calls `finishActivation` immediately,
 * leaving `isActivating` false; otherwise `isActivating` flips true
 * (`data-intro-activating`, so the CSS wave below can react) and
 * `finishActivation` is scheduled `CTA_WAVE_CALLBACK_DELAY_MS` later via a
 * cleaned-up `setTimeout`. A ref (`onCtaClickRef`), kept current by its own
 * effect, is what `finishActivation` actually calls, so a parent re-render
 * mid-wave still reaches the latest callback. `finishActivation` clears any
 * pending timeout, then checks and sets its own `completedRef` guard before
 * invoking the callback, so the timeout and an early `visibilitychange`-
 * triggered call (below — a backgrounded tab shouldn't hold up navigation)
 * can never both fire it; for the real wave it deliberately leaves
 * `isActivating` true afterward, freezing the idle bubble state through the
 * outgoing fade until this screen unmounts on navigation, rather than
 * resetting it.
 *
 * The `LanguageSwitcher` (Figma node `437:90`, same component/markup the
 * Camera Permission, Vibe Result, and Player screens already use —
 * imported, not re-implemented) now sits in the true top-right viewport
 * corner, `position: absolute` directly on `<main>` (already `relative`)
 * rather than inside `data-intro-content` — a real sibling of that
 * column, not a descendant, so it's positioned against the actual
 * viewport edge regardless of the hero column's own centered, narrower
 * `max-w-content` box. `right-[24px] top-[24px]` reuses the exact same
 * `24px` safe-edge inset every other screen's own `<main>` already uses
 * (`p-[24px]`, see `CameraPermissionScreen.tsx`/`VibeResultScreen.tsx`/
 * `PlayerScreen.tsx`) — applied here directly on the switcher's own
 * wrapper instead of as `<main>` padding, since `AppBackground` and
 * `MoodBubbleCluster` are both `absolute inset-0` on this same `<main>`
 * and padding it would shrink their own bounds too (an absolutely
 * positioned element's `inset-0` is relative to its containing block's
 * *padding* edge, not its content edge) — exactly the "don't touch the
 * background/bubbles" constraint this task also carries. One `top`/
 * `right` pair for every breakpoint, no `lg:` variant, again matching
 * those other screens' own `<main>` padding, which likewise never
 * changes at `lg`.
 *
 * Earlier versions instead centered the switcher above the `<h1>`
 * wordmark — first as a real flex child of `data-intro-content` (pushing
 * `TextStack`/`CtaPill` down by its own flow height + a `gap-hero-gap`,
 * which in turn narrowed the CTA-to-bubbles gap enough to break bubble
 * visibility — see `MoodBubbleCluster`'s own comment below), then as an
 * absolutely-positioned but still horizontally-*centered* element inside
 * `data-intro-content` (`left-1/2 -translate-x-1/2`, `top-[188px]`
 * Mobile / `top-[82px]` Desktop) to fix that flow-height problem while
 * keeping the same centered position. Both put the switcher in
 * competition with the hero title instead of reading as an independent
 * utility control — this task's own explicit objective — so the switcher
 * moved to the corner instead of centering it more precisely.
 */
export default function IntroScreen({ onCtaClick }: { onCtaClick?: () => void }) {
  const onCtaClickRef = useRef(onCtaClick)
  useEffect(() => {
    onCtaClickRef.current = onCtaClick
  }, [onCtaClick])

  const activatingRef = useRef(false)
  const completedRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)
  const [isActivating, setIsActivating] = useState(false)

  const finishActivation = useCallback(() => {
    if (completedRef.current) return
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    completedRef.current = true
    onCtaClickRef.current?.()
  }, [])

  const handleCtaClick = useCallback(() => {
    if (!onCtaClickRef.current) return
    if (activatingRef.current) return
    activatingRef.current = true

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion || document.hidden) {
      finishActivation()
      return
    }

    setIsActivating(true)
    timeoutRef.current = window.setTimeout(finishActivation, CTA_WAVE_CALLBACK_DELAY_MS)
  }, [finishActivation])

  // Only listens while a wave is actually pending, so a backgrounded tab
  // finishes activation immediately instead of waiting out the rest of the
  // delay — `finishActivation`'s own `completedRef` guard is what keeps this
  // from ever firing the callback a second time alongside the timeout.
  useEffect(() => {
    if (!isActivating) return

    const handleVisibilityChange = () => {
      if (document.hidden && !completedRef.current) finishActivation()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isActivating, finishActivation])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <main
      data-intro-root
      data-intro-activating={isActivating}
      className="relative min-h-[max(100dvh,var(--spacing-frame-h))] overflow-hidden bg-bg-base lg:min-h-[max(100dvh,var(--spacing-frame-h-lg))]"
    >
      {/* Ambient glow drift scope (`index.css`'s `.intro-ambient-motion
          [data-glow="purple"]`) — the wrapper itself doesn't move; it only
          scopes the violet glow's drift to Intro, so `AppBackground` itself,
          its data, and every other screen that reuses it are untouched.
          `absolute inset-0` matches
          `AppBackground`'s own sizing exactly, so it becomes the new (but
          identically-sized) containing block for the glow layers inside;
          `pointer-events-none`/`aria-hidden` are repeated here since this
          wrapper — not `AppBackground` — is now the actual first painted
          layer in `<main>`, keeping paint order unchanged. */}
      <div aria-hidden className="absolute inset-0 pointer-events-none intro-ambient-motion">
        <AppBackground />
      </div>
      <MoodBubbleCluster />
      <div
        data-intro-content
        className="relative mx-auto flex w-full max-w-content flex-col items-center gap-hero-gap pt-hero-top lg:max-w-content-lg lg:pt-hero-top-lg"
      >
        <TextStack />
        <CtaPill onClick={handleCtaClick} />
      </div>
      <div className="absolute right-[24px] top-[24px]">
        <LanguageSwitcher />
      </div>
      {GLOW_DEBUG && <GlowDebugPanel />}
    </main>
  )
}
