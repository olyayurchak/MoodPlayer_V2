import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react"
import CtaPill from "../components/CtaPill"
import TextStack from "../components/TextStack"
import AmbientDrift from "../intro3/AmbientDrift"
import { preloadVibeResultVideo } from "../components/vibeResultVideo"

/** The WebGL glass-orb cluster (`three` / `@react-three/fiber`), lazy so the
 *  headline and CTA render immediately while the WebGL
 *  code downloads, and so the later screens' code never waits on it. */
const GlassOrbCanvas = lazy(() => import("../intro3/GlassOrbCanvas"))

/**
 * MoodPlayer Intro screen — approved Intro C, "C · Portrait refraction".
 *
 * The visual layers come from the Intro 3 WebGL prototype
 * (`MoodPlayer_V2-intro-v3`, `src/intro3/`), copied verbatim into
 * `src/intro3/`: `AmbientDrift` (static glow background) and
 * `GlassOrbCanvas` (the realtime glass orb cluster, with its own WebGL
 * capability check, error-boundary static fallback, and reduced-motion
 * `frameloop="demand"`). Same layering as that prototype: background,
 * orb canvas, then the hero on top with pointer events passing through to
 * the canvas (orb hover) everywhere except the CTA.
 * Full-viewport height (`h-dvh`, 480px minimum), as approved.
 *
 * The hero is this app's own `TextStack` + `CtaPill`; `onCtaClick` is
 * `App.tsx`'s navigation callback (→ Camera Permission). A click fires it
 * immediately — the old CSS bubble "wave" and its 500ms wait went with the
 * CSS bubbles. `data-intro-activating` still flips on, so the CTA's own
 * 140ms press (`intro-cta-press` in `index.css`) plays during the screen's
 * exit fade; `activatingRef` keeps a double-click from navigating twice.
 * `data-intro-root` / `data-intro-content` are kept for those `index.css`
 * Intro rules (headline/CTA entrance, CTA hover, short-desktop fit).
 *
 * The previous CSS-bubble Intro's components (`AppBackground`'s use here,
 * `MoodBubbleCluster`, `MoodBubble`, `GlowDebugPanel`) are no longer
 * mounted on this screen but are left in place.
 */
export default function IntroScreen({ onCtaClick }: { onCtaClick?: () => void }) {
  const activatingRef = useRef(false)
  const onCtaClickRef = useRef(onCtaClick)
  useEffect(() => {
    onCtaClickRef.current = onCtaClick
  }, [onCtaClick])
  const [isActivating, setIsActivating] = useState(false)

  // Fetch the Camera Permission orb's video once the Intro is idle, so it's
  // in memory and starts moving as soon as that screen appears (see
  // `vibeResultVideo.ts`). `requestIdleCallback` isn't in Safari.
  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(preloadVibeResultVideo, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(preloadVibeResultVideo, 500)
    return () => window.clearTimeout(id)
  }, [])

  const handleCtaClick = useCallback(() => {
    if (!onCtaClickRef.current) return
    if (activatingRef.current) return
    activatingRef.current = true
    setIsActivating(true)
    onCtaClickRef.current()
  }, [])

  return (
    <main
      data-intro-root
      data-intro-activating={isActivating}
      className="relative h-dvh min-h-[480px] overflow-hidden bg-bg-base"
    >
      <AmbientDrift />
      <Suspense fallback={null}>
        <GlassOrbCanvas />
      </Suspense>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 [&_.cta-pill]:pointer-events-auto">
        <div
          data-intro-content
          className="relative mx-auto flex w-full max-w-content flex-col items-center gap-hero-gap pt-hero-top lg:max-w-content-lg lg:pt-hero-top-lg"
        >
          <TextStack />
          <CtaPill onClick={handleCtaClick} />
        </div>
      </div>
    </main>
  )
}
