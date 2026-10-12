import { Component, type ErrorInfo, type ReactNode } from "react"
import { copy as t } from "../content/copy"

/**
 * App-level safety net: an unexpected render/lifecycle error anywhere below
 * it (or a lazy chunk that fails to load) would otherwise unmount the whole
 * React root and leave a blank page. Feature-specific failures keep their
 * own handling (`SceneErrorBoundary`, camera/MediaPipe/gesture/audio error
 * states) — this only catches what nothing else did.
 *
 * Deliberately dependency-free (no camera, audio, WebGL or feature
 * components) so the fallback itself can't fail for the same reason.
 *
 * Retry is a full page reload, not a state reset: a rejected `React.lazy`
 * import stays cached for the page's lifetime, and whatever state caused a
 * render error would most likely just throw again.
 */
export default class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("[app] Unexpected error, showing fallback", error, info.componentStack)
  }

  /** Callback ref: moves keyboard focus to Reload as soon as the fallback
   *  mounts (no timer needed). */
  private focusReload = (button: HTMLButtonElement | null) => {
    button?.focus()
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg-base px-4 py-12">
        <div className="flex w-full max-w-content flex-col items-center gap-hero-gap text-center lg:max-w-content-lg">
          <div role="alert" className="flex flex-col items-center gap-stack-gap">
            <h1 className="text-[38px] font-medium leading-[1.2] text-text-primary lg:text-[60px]">
              {t.appError.heading}
            </h1>
            <p className="font-sans text-[18px] font-light leading-[1.4] text-text-secondary">{t.appError.body}</p>
          </div>
          <button
            ref={this.focusReload}
            type="button"
            onClick={() => window.location.reload()}
            className="cta-pill relative flex h-cta-h w-cta-w max-w-full items-center justify-center overflow-hidden rounded-pill border-[1.5px] border-cta-border bg-linear-to-r from-cta-button-from via-cta-button-via to-cta-button-to px-cta-x font-sans text-cta font-medium text-white backdrop-blur-cta drop-shadow-cta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:w-cta-w-lg"
          >
            {t.appError.reloadLabel}
          </button>
        </div>
      </main>
    )
  }
}
