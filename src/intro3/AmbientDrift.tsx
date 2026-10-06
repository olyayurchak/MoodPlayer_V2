import { GlowLayer } from "../components/AppBackground"
import { desktopGlows, mobileGlows, type GlowSpec } from "../data/introGlows"

/**
 * Static right-side support light (Variant C only, not in `introGlows`):
 * adds soft depth to the right half. Indigo between purple `#624FA8` and blue
 * `#435EB8`; peak alpha 0.14 ≈ 28% of purple's 0.5, on a wider ellipse than
 * purple's, so it reads as ambient depth rather than a second glow. Painted
 * just under purple. Frame coordinates like `introGlows`.
 */
const SUPPORT_GRADIENT =
  "radial-gradient(closest-side, rgba(82,86,176,0.14) 0%, rgba(82,86,176,0.065) 55%, rgba(82,86,176,0) 100%)"
const desktopSupport: GlowSpec = {
  id: "support-right",
  left: 640,
  top: -80,
  width: 1440,
  height: 1440,
  gradient: SUPPORT_GRADIENT,
}
const mobileSupport: GlowSpec = {
  id: "support-right",
  left: 110,
  top: -40,
  width: 600,
  height: 1160,
  gradient: SUPPORT_GRADIENT,
}

/** The original glows, with the support light inserted just under purple. */
const withSupport = (glows: GlowSpec[], support: GlowSpec) =>
  glows.flatMap((glow) => (glow.id === "purple" ? [support, glow] : [glow]))

/**
 * Intro 3 Variant C only — the shared `AppBackground` glow field, rendered
 * from the same data, markup and paint order, plus one static right-side
 * support light under purple. Fully static. `AppBackground` itself is
 * untouched, so every other screen is unaffected. Keep the frame boxes in
 * sync with `AppBackground` if its markup changes.
 */
export default function AmbientDrift() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-0 left-1/2 h-frame-h w-frame-w -translate-x-1/2 lg:hidden">
        {withSupport(mobileGlows, mobileSupport).map((glow) => (
          <GlowLayer key={glow.id} {...glow} />
        ))}
      </div>
      <div className="absolute top-0 left-1/2 hidden h-frame-h-lg w-frame-w-lg -translate-x-1/2 lg:block">
        {withSupport(desktopGlows, desktopSupport).map((glow) => (
          <GlowLayer key={glow.id} {...glow} />
        ))}
      </div>
    </div>
  )
}
