import { desktopGlows, mobileGlows, type GlowSpec } from "../data/introGlows"

function GlowLayer({ left, top, width, height, gradient }: GlowSpec) {
  return (
    <div
      className="absolute blur-glow"
      style={{ left, top, width, height, backgroundImage: gradient }}
    />
  )
}

/**
 * The ambient glow field — shared, unmodified, by every screen that
 * renders it (Intro, Camera Permission/Scanning, Vibe Result). All of
 * them now render the exact same approved cooler navy/violet/indigo
 * palette (`data/introGlows.ts`), so this component takes no props: an
 * earlier, Intro-only recolor briefly needed a `mobileOverrides`/
 * `desktopOverrides` pair here while only Intro had approved the new
 * colors, but now that every screen shares them that plumbing was
 * removed as redundant rather than left in place unused.
 *
 * Glow offsets are frame-relative, so each set lives inside a frame-sized box
 * centered horizontally and anchored to the top — the same coordinate space
 * Figma used. Mobile and Desktop use different glow geometry, so they are
 * separate configuration sets rather than one scaled composition.
 */
export default function AppBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 h-frame-h w-frame-w -translate-x-1/2 lg:hidden">
        {mobileGlows.map((glow) => (
          <GlowLayer key={glow.id} {...glow} />
        ))}
      </div>
      <div className="absolute top-0 left-1/2 hidden h-frame-h-lg w-frame-w-lg -translate-x-1/2 lg:block">
        {desktopGlows.map((glow) => (
          <GlowLayer key={glow.id} {...glow} />
        ))}
      </div>
    </div>
  )
}
