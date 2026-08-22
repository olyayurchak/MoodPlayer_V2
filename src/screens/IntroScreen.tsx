import AppBackground from "../components/AppBackground"
import CtaPill from "../components/CtaPill"
import LanguageSwitcher from "../components/LanguageSwitcher"
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
 *
 * The `LanguageSwitcher` (Figma node `437:90`, same component/markup the
 * Camera Permission and Vibe Result screens already use — imported, not
 * re-implemented) sits absolutely positioned in the top-right corner
 * rather than in a shared header row like those screens have, since Intro
 * has no such row of its own (`TextStack`'s `<h1>` wordmark is the hero
 * heading, not a header logo). `right-[24px] top-[24px]` on Mobile matches
 * this project's own established corner-inset convention elsewhere
 * (`p-[24px]` on other screens' `<main>`); `lg:right-[64px] lg:top-[64px]`
 * matches Figma's own Desktop offset exactly (node `437:90` sits at
 * `x:1304 y:64` inside a `1440×1024` frame → margins of `1440-1304-72=64`
 * / `64`). Placed after `MoodBubbleCluster` in this tree so it paints on
 * top of the background/bubble layers in normal DOM stacking order — both
 * of those are already `pointer-events-none`, so there's no click
 * interception either way, but this also keeps the switcher visually on
 * top of them without needing an explicit `z-index`.
 */
export default function IntroScreen({ onCtaClick }: { onCtaClick?: () => void }) {
  return (
    <main
      data-intro-root
      className="relative min-h-[max(100dvh,var(--spacing-frame-h))] overflow-hidden bg-bg-base lg:min-h-[max(100dvh,var(--spacing-frame-h-lg))]"
    >
      <AppBackground />
      <MoodBubbleCluster />
      <div className="absolute right-[24px] top-[24px] lg:right-[64px] lg:top-[64px]">
        <LanguageSwitcher />
      </div>
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
