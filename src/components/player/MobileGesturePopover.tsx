import { useId, type RefObject } from "react"
import { GESTURE_ENTRIES, type GestureEntry } from "./GestureControlsPanel"
import MobileTriggerPopover from "./MobileTriggerPopover"
import { copy as t } from "../../content/copy"
import { spectrumGradient, type MoodSpectrum } from "../../data/playerMoodAccent"

/**
 * Mobile Gesture Controls popover — anchored above the mobile Gestures
 * trigger on the shared `MobileTriggerPopover` shell (same surface, bottom
 * pointer, open/close/focus behaviour as Choose Vibe).
 *
 * Content: the heading with the one interactive control — the global
 * On/Off switch (`role="switch"`, the same mood-tinted track as the desktop
 * rail's) — then the four gestures as a 2×2 grid of plain information
 * cells (desktop's gesture images, caption and action): a list, not
 * buttons, with no hover or selected state.
 *
 * Placement: a compact width — `min(row − 8px, 312px)`, so 304px at 360px
 * wide and 312px from 375px up — anchored to the Gestures trigger's right
 * edge (the row's right edge, on the 24px gutter), so it grows leftward
 * from the trigger instead of spanning the row.
 *
 * Pointer: on the Gestures trigger's centre. The trigger row is a size
 * container (`@container`), so `cqw` is the row's width: the Vibe trigger
 * is 148px + 8px gap, so the Gestures trigger's centre is `78px + 50cqw`
 * from the row's left; the popover starts at `100cqw − W`; minus the 1.5px
 * border and half the 12px pointer, the pointer's `left` (from the
 * popover's padding box) is `W + 70.5px − 50cqw`.
 */
const POPOVER_WIDTH = "min(100cqw - 8px, 312px)"
export default function MobileGesturePopover({
  open,
  gesturesOn,
  onGesturesChange,
  palette,
  onClose,
  triggerRef,
}: {
  open: boolean
  gesturesOn: boolean
  onGesturesChange: (on: boolean) => void
  palette: MoodSpectrum
  onClose: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
}) {
  const headingId = useId()
  const labels: Record<GestureEntry["id"], { caption: string; action: string }> = {
    "open-palm": { caption: t.player.gestures.openPalm, action: t.player.gestures.actionPlay },
    "closed-fist": { caption: t.player.gestures.closedFist, action: t.player.gestures.actionPause },
    "thumb-up": { caption: t.player.gestures.thumbUp, action: t.player.gestures.actionNext },
    "thumb-down": { caption: t.player.gestures.thumbDown, action: t.player.gestures.actionPrevious },
  }

  return (
    <MobileTriggerPopover
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      labelledBy={headingId}
      className="right-0"
      style={{ width: POPOVER_WIDTH }}
      pointerLeft={`calc(${POPOVER_WIDTH} + 70.5px - 50cqw)`}
      initialFocusSelector='button[role="switch"]'
    >
      <div className="mb-[12px] flex items-center justify-between gap-[12px]">
        <p id={headingId} className="text-[14px] font-medium leading-[1.2] text-white">
          {t.player.gestures.heading}
        </p>
        <div className="flex items-center gap-[8px]">
          <span aria-hidden="true" className="text-[14px] font-medium text-[#cfcfcf]">
            {gesturesOn ? t.player.gestures.on : t.player.gestures.off}
          </span>
          {/* 52×30 visual; the `before:` extension makes the tap target 44px tall.
              ON's `bg-origin-border` keeps the gradient from tiling into the
              transparent border (see the desktop rail switch). */}
          <button
            type="button"
            role="switch"
            aria-checked={gesturesOn}
            aria-labelledby={headingId}
            onClick={() => onGesturesChange(!gesturesOn)}
            style={gesturesOn ? { backgroundImage: spectrumGradient(palette, 1, 90) } : undefined}
            className={`relative h-[30px] w-[52px] shrink-0 rounded-pill border-[1.5px] before:absolute before:inset-x-0 before:-inset-y-[7px] before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              gesturesOn ? "border-transparent bg-origin-border" : "border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.08)]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-1/2 left-[2.5px] size-[22px] -translate-y-1/2 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-out motion-reduce:transition-none ${
                gesturesOn ? "translate-x-[22px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-[8px]">
        {GESTURE_ENTRIES.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-col items-center gap-[4px] rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)] px-[8px] py-[12px] text-center"
          >
            <img
              src={entry.icon}
              alt=""
              className={`size-[32px] shrink-0 object-cover opacity-60 ${entry.flipVertical ? "-scale-y-100" : ""}`}
            />
            <p className="text-[12px] font-light leading-[1.2] text-[#cfcfcf]">{labels[entry.id].caption}</p>
            <p className="whitespace-nowrap text-[14px] font-medium leading-[1.2] text-white">{labels[entry.id].action}</p>
          </li>
        ))}
      </ul>
    </MobileTriggerPopover>
  )
}
