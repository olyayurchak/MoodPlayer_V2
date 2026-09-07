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
 * `onCtaClick` is forwarded straight to the CTA's `onClick` — this screen
 * doesn't know or care what happens next (that's `App.tsx`'s job); it just
 * reports the click, the same way `CtaPill` itself does.
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
      <div className="absolute right-[24px] top-[24px]">
        <LanguageSwitcher />
      </div>
    </main>
  )
}
