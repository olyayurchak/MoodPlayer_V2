import { desktopGlows, mobileGlows, type GlowSpec } from "../data/introGlows"

export function GlowLayer({ left, top, width, height, gradient }: GlowSpec) {
  return (
    <div
      className="absolute blur-glow"
      style={{ left, top, width, height, backgroundImage: gradient }}
    />
  )
}

/**
 * The ambient glow field — shared, by default, by every screen that
 * renders it (Intro, Camera Permission/Scanning, Vibe Result, and the
 * Player screen for any mood without its own approved override). Every
 * one of those callers renders the exact same approved cooler navy/
 * violet/indigo palette (`data/introGlows.ts`), unmodified.
 *
 * `mobileGlows`/`desktopGlows` (optional) override that default set —
 * this is the Player screen's own Happy accent doing exactly that (see
 * `data/playerMoodAccent.ts`'s `backgroundGlows` and `PlayerScreen.tsx`),
 * matching that mood's own approved Figma background instead of the
 * universal one. An earlier, Intro-only recolor briefly needed this same
 * kind of override while only Intro had approved a new palette, and was
 * removed once every caller shared one set; it's back now because a real,
 * approved, per-mood need exists again — every caller that *doesn't* pass
 * these two props still gets the exact same shared default as before.
 *
 * Glow offsets are frame-relative, so each set lives inside a frame-sized box
 * centered horizontally and anchored to the top — the same coordinate space
 * Figma used. Mobile and Desktop use different glow geometry, so they are
 * separate configuration sets rather than one scaled composition.
 */
export default function AppBackground({
  mobileGlows: mobileGlowsOverride,
  desktopGlows: desktopGlowsOverride,
}: {
  mobileGlows?: GlowSpec[]
  desktopGlows?: GlowSpec[]
} = {}) {
  const mobile = mobileGlowsOverride ?? mobileGlows
  const desktop = desktopGlowsOverride ?? desktopGlows

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 h-frame-h w-frame-w -translate-x-1/2 lg:hidden">
        {mobile.map((glow) => (
          <GlowLayer key={glow.id} {...glow} />
        ))}
      </div>
      <div className="absolute top-0 left-1/2 hidden h-frame-h-lg w-frame-w-lg -translate-x-1/2 lg:block">
        {desktop.map((glow) => (
          <GlowLayer key={glow.id} {...glow} />
        ))}
      </div>
    </div>
  )
}
