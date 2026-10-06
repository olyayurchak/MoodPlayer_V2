import { useEffect, useRef, useState } from "react"

/**
 * TEMPORARY diagnostic for the Intro violet glow drift — rendered by
 * `IntroScreen.tsx` only when the URL has `?glow-debug=1`, so the normal
 * preview never mounts it. Remove once the drift is tuned.
 *
 * Polls every 250ms (a `setInterval`, not rAF, so it keeps reporting even
 * when the page isn't painting) and separately counts real rendered frames
 * per second via rAF: CSS animations only advance while frames render, so
 * "0 fps" means the drift can't be moving no matter what its playState says.
 *
 * The "boost" toggle sets `data-glow-debug-boost` on `[data-intro-root]`;
 * `index.css` maps that to ±120/72px and an 8s cycle. Color, brightness and
 * size are untouched.
 */
type Snapshot = {
  hidden: boolean
  reducedMotion: boolean
  fps: number
  clusterPaused: string
  activating: string
  glowFound: boolean
  anims: string[]
  x: number
  y: number
}

const readSnapshot = (fps: number): Snapshot => {
  const root = document.querySelector<HTMLElement>("[data-intro-root]")
  const cluster = document.querySelector<HTMLElement>(".mood-bubble-cluster")
  // The visible breakpoint's glow: the other set's container is display:none.
  const glow = Array.from(
    document.querySelectorAll<HTMLElement>('.intro-ambient-motion [data-glow="purple"]'),
  ).find((el) => el.offsetParent !== null)

  let x = 0
  let y = 0
  let anims: string[] = []
  if (glow) {
    const style = getComputedStyle(glow)
    x = parseFloat(style.translate) || 0
    y = style.transform === "none" ? 0 : new DOMMatrix(style.transform).m42
    anims = glow.getAnimations().map((animation) => {
      const name = animation instanceof CSSAnimation ? animation.animationName : "animation"
      const time = typeof animation.currentTime === "number" ? Math.round(animation.currentTime) : "—"
      return `${name}: ${animation.playState}${animation.pending ? " (pending)" : ""}, t=${time}ms`
    })
  }

  return {
    hidden: document.hidden,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    fps,
    clusterPaused: cluster?.getAttribute("data-motion-paused") ?? "—",
    activating: root?.getAttribute("data-intro-activating") ?? "—",
    glowFound: Boolean(glow),
    anims,
    x,
    y,
  }
}

export default function GlowDebugPanel() {
  const [boost, setBoost] = useState(false)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const framesRef = useRef(0)
  const fpsRef = useRef(0)

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-intro-root]")
    if (boost) root?.setAttribute("data-glow-debug-boost", "true")
    else root?.removeAttribute("data-glow-debug-boost")
    return () => root?.removeAttribute("data-glow-debug-boost")
  }, [boost])

  useEffect(() => {
    let rafId = 0
    const countFrame = () => {
      framesRef.current += 1
      rafId = requestAnimationFrame(countFrame)
    }
    rafId = requestAnimationFrame(countFrame)

    const fpsTimer = window.setInterval(() => {
      fpsRef.current = framesRef.current
      framesRef.current = 0
    }, 1000)

    const pollTimer = window.setInterval(() => setSnapshot(readSnapshot(fpsRef.current)), 250)

    return () => {
      cancelAnimationFrame(rafId)
      window.clearInterval(fpsTimer)
      window.clearInterval(pollTimer)
    }
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        bottom: 12,
        zIndex: 9999,
        maxWidth: 340,
        padding: "10px 12px",
        borderRadius: 8,
        background: "rgb(0 0 0 / 0.78)",
        color: "#fff",
        font: "12px/1.45 ui-monospace, SFMono-Regular, Consolas, monospace",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>glow-debug (тимчасово)</div>
      {snapshot ? (
        <>
          <div>document.hidden: {String(snapshot.hidden)}</div>
          <div>кадрів/с (rAF): {snapshot.fps}</div>
          <div>reduced motion: {String(snapshot.reducedMotion)}</div>
          <div>кластер на паузі (data-motion-paused): {snapshot.clusterPaused}</div>
          <div>CTA-хвиля (data-intro-activating): {snapshot.activating}</div>
          {snapshot.glowFound ? (
            snapshot.anims.length > 0 ? (
              snapshot.anims.map((line) => <div key={line.split(":")[0]}>{line}</div>)
            ) : (
              <div>анімацій на світінні немає</div>
            )
          ) : (
            <div>світіння не знайдено</div>
          )}
          <div>
            зміщення X/Y: {snapshot.x.toFixed(1)}px / {snapshot.y.toFixed(1)}px
          </div>
        </>
      ) : (
        <div>…</div>
      )}
      <label style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, cursor: "pointer" }}>
        <input type="checkbox" checked={boost} onChange={(event) => setBoost(event.target.checked)} />
        Посилений рух (±120/72px, 8s)
      </label>
    </div>
  )
}
