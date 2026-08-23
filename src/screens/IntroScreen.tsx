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
 * re-implemented; this screen's own position for it is explicitly
 * different from those screens' shared top-right corner placement, per a
 * later task's own request) is centered above the `<h1>` wordmark.
 *
 * Earlier versions nested it as a real flex child of `data-intro-content`
 * (to get its horizontal centering "for free" from that column's own
 * `items-center`), with a `relative -top-[24px]` nudge on top to fine-tune
 * its vertical position without disturbing flow. That worked visually but
 * had a real structural cost: being a flow child meant it occupied real
 * space (its own height + one `gap-hero-gap`) *before* `TextStack`,
 * pushing `TextStack`/`CtaPill` down by that same amount versus the
 * approved pre-switcher baseline (git `e842fe5`) — which in turn narrowed
 * the CTA-to-bubbles gap enough that later attempts to compensate by
 * shifting the (fixed-size, hard-clipped) bubble stage down broke bubble
 * visibility outright (see `MoodBubbleCluster`'s own comment below).
 *
 * Fixed at the root rather than patched again: the switcher is now
 * `position: absolute` inside `data-intro-content` (still `relative`),
 * centered via `left-1/2 -translate-x-1/2`. An absolutely positioned
 * element contributes zero flow height and doesn't participate in this
 * column's `gap-hero-gap` rhythm at all, so `TextStack` is once again the
 * first element that actually occupies flow space here — its position
 * (and `CtaPill`'s below it) is back to exactly the approved pre-switcher
 * baseline, with no residual offset to compensate for. The switcher's own
 * `top` value (`188px` Mobile / `148px` Desktop) was read directly from
 * where it was already rendering under the old flow-based approach, so
 * its own visual position is unchanged — only the *mechanism* changed,
 * from "occupies flow space, nudged up visually" to "never occupies flow
 * space at all".
 *
 * Desktop's own `top` moved from `148px` to `106px` (a later, explicit
 * follow-up) — 42px higher, for more visual separation from the `<h1>`
 * below — via the `lg:top-[106px]` variant only; the base (Mobile) value
 * stays `188px`, untouched. Moved again from `106px` to `82px` (a further
 * explicit follow-up) — another 24px higher, Desktop-only, Mobile still
 * untouched.
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
        <div className="absolute left-1/2 top-[188px] -translate-x-1/2 lg:top-[82px]">
          <LanguageSwitcher />
        </div>
        <TextStack />
        <CtaPill onClick={onCtaClick} />
      </div>
    </main>
  )
}
