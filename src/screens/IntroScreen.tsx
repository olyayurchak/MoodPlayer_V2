import AppBackground from "../components/AppBackground"
import CtaPill from "../components/CtaPill"
import MoodBubbleCluster from "../components/MoodBubbleCluster"
import TextStack from "../components/TextStack"

/**
 * MoodPlayer Intro screen.
 *
 * One shared responsive composition. The content column is normal flow (flex
 * column, centered); only the decorative background and bubble layers use
 * absolute positioning, each scoped to its own frame-sized container. A single
 * structural breakpoint (`lg`, 1024px) switches to the Desktop composition.
 *
 * Two data attributes give `MoodBubbleCluster`'s scatter interaction a stable
 * way to find this screen's own bounds without prop-drilling a ref through:
 * `data-intro-root` marks the full-viewport element whose `pointerleave`
 * means "the pointer left the Intro screen" (the scatter's return trigger),
 * and `data-intro-content` marks the heading + CTA column so the scatter can
 * keep bubbles clear of it.
 *
 * `onCtaClick` is forwarded straight to the CTA's `onClick` — this screen
 * doesn't know or care what happens next (that's `App.tsx`'s job); it just
 * reports the click, the same way `CtaPill` itself does.
 */
export default function IntroScreen({ onCtaClick }: { onCtaClick?: () => void }) {
  return (
    <main
      data-intro-root
      className="relative min-h-[max(100dvh,var(--spacing-frame-h))] overflow-hidden bg-bg-base lg:min-h-[max(100dvh,var(--spacing-frame-h-lg))]"
    >
      <AppBackground />
      <MoodBubbleCluster />
      <div
        data-intro-content
        className="relative mx-auto flex w-full max-w-content flex-col items-center gap-hero-gap pt-hero-top lg:max-w-content-lg lg:pt-hero-top-lg"
      >
        <TextStack />
        <CtaPill onClick={onCtaClick} />
      </div>
    </main>
  )
}
