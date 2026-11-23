import { useCallback, useRef, useState } from "react"
import handOpenPalm from "../../imports/Player/hand-open-palm.png"
import { copy as t } from "../../content/copy"
import type { MoodId } from "../../data/moods"
import { PLAYER_SPECTRUM, spectrumGradient, type MoodSpectrum } from "../../data/playerMoodAccent"
import MobileChooseVibePopover from "./MobileChooseVibePopover"
import MobileGesturePopover from "./MobileGesturePopover"
import { MoodIcon } from "./moodIcons"

function Chevron({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      className={`shrink-0 text-[#cfcfcf] ${className}`}
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const TRIGGER_CLASS =
  "flex h-[48px] items-center justify-center gap-[6px] rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)] text-[14px] font-medium text-white backdrop-blur-[20px] duration-200 hover:bg-[rgba(255,255,255,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"

/**
 * Mobile Player closed-state utility row: the current-vibe trigger and the
 * gesture trigger, side by side (mobile reference, first screen).
 *
 * Fixed sizes, so the row never shifts when the mood or gesture state
 * changes: the Vibe trigger is always 148px (its widest label,
 * "Melancholic", needs 147.4px) and the gesture trigger fills the rest —
 * 156px at 360px wide, where the row is 312px and "Gestures · Off" needs
 * 155.7px. The gesture label truncates only as a last-resort guard.
 *
 * Inside the Vibe trigger, the mood icon + 15px mood name are the primary
 * content and the 14px chevron (70% opacity, 2px after the label) the
 * quieter "opens a choice" cue.
 *
 * Both leading icons show ~28px of actual artwork. The icon files carry
 * built-in empty space (the mood icons' artwork fills ~83% of their box;
 * the hand PNG ~59% of its width, 87.5% of its height), so each box is
 * larger and negative side margins take back that empty space, keeping
 * the row width tied to the visible artwork: mood icon 34px box, −3px
 * sides (~28px artwork); hand 32px box, −6px sides (28px tall artwork).
 * Vibe: 5px side padding keeps "Melancholic" on one line in the fixed
 * 148px. Gestures: 8px padding, "Gestures · Off" fits 156px at 360px.
 *
 * Both triggers open an anchored popover above themselves, inside this
 * (`relative`) row, so both end in the same down chevron (14px, 70%). The
 * Vibe trigger opens Choose Vibe (choosing a mood calls `onMoodSelect` and
 * closes it); the Gestures trigger opens Gesture Controls, whose switch
 * calls `onGesturesChange`. One `openPopover` state means only one is ever
 * open; closing returns focus to the trigger that opened it.
 */
export default function MobilePlayerTriggers({
  activeMood,
  onMoodSelect,
  gesturesOn,
  onGesturesChange,
  palette,
}: {
  activeMood: MoodId
  onMoodSelect: (mood: MoodId) => void
  gesturesOn: boolean
  onGesturesChange: (on: boolean) => void
  /** The active mood's colours, for the Gesture Controls switch's ON track. */
  palette: MoodSpectrum
}) {
  const moodName = t.vibeResult.moods[activeMood].name
  const [openPopover, setOpenPopover] = useState<"vibe" | "gestures" | null>(null)
  const isVibeOpen = openPopover === "vibe"
  const vibeTriggerRef = useRef<HTMLButtonElement>(null)
  const gesturesTriggerRef = useRef<HTMLButtonElement>(null)

  const closeVibe = useCallback(() => {
    setOpenPopover(null)
    vibeTriggerRef.current?.focus()
  }, [])
  const closeGestures = useCallback(() => {
    setOpenPopover(null)
    gesturesTriggerRef.current?.focus()
  }, [])

  const handleMoodSelect = (mood: MoodId) => {
    onMoodSelect(mood)
    closeVibe()
  }

  return (
    // `@container`: the Gesture popover sizes itself and places its pointer
    // against this row's width (`cqw`).
    <div className="@container relative flex w-full items-center gap-[8px]">
      <button
        ref={vibeTriggerRef}
        type="button"
        onClick={() => (isVibeOpen ? closeVibe() : setOpenPopover("vibe"))}
        aria-haspopup="dialog"
        aria-expanded={isVibeOpen}
        aria-label={t.player.moodTriggerLabel(moodName)}
        className={`${TRIGGER_CLASS} relative w-[148px] shrink-0 px-[5px] transition-[background-color,border-color] motion-reduce:transition-none`}
        style={{ borderColor: isVibeOpen ? "transparent" : "rgba(255, 255, 255, 0.4)" }}
      >
        <span
          aria-hidden="true"
          style={{
            background: isVibeOpen ? spectrumGradient(PLAYER_SPECTRUM[activeMood], 0.55) : undefined,
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            maskComposite: "exclude",
          }}
          className={`pointer-events-none absolute -inset-px rounded-[inherit] p-px transition-opacity duration-200 motion-reduce:transition-none ${isVibeOpen ? "opacity-100" : "opacity-0"}`}
        />
        <MoodIcon mood={activeMood} size={34} className="-mx-[3px] shrink-0" />
        <span className="whitespace-nowrap text-[15px]">{moodName}</span>
        <Chevron size={14} className="-ml-[4px] opacity-70" />
      </button>
      <button
        ref={gesturesTriggerRef}
        type="button"
        onClick={() => (openPopover === "gestures" ? closeGestures() : setOpenPopover("gestures"))}
        aria-haspopup="dialog"
        aria-expanded={openPopover === "gestures"}
        aria-label={`${t.player.gestures.heading}: ${gesturesOn ? t.player.gestures.on : t.player.gestures.off}`}
        className={`${TRIGGER_CLASS} min-w-0 flex-1 px-[8px] transition-[background-color]`}
        style={{ borderColor: openPopover === "gestures" ? palette.start : undefined }}
      >
        <img src={handOpenPalm} alt="" className="-mx-[6px] size-[32px] shrink-0 object-contain" />
        <span className="min-w-0 truncate">
          {t.player.gesturesTrigger} · {gesturesOn ? t.player.gestures.on : t.player.gestures.off}
        </span>
        <Chevron size={14} className="-ml-[4px] opacity-70" />
      </button>

      <MobileChooseVibePopover
        open={isVibeOpen}
        activeMood={activeMood}
        onSelect={handleMoodSelect}
        onClose={closeVibe}
        triggerRef={vibeTriggerRef}
      />
      <MobileGesturePopover
        open={openPopover === "gestures"}
        gesturesOn={gesturesOn}
        onGesturesChange={onGesturesChange}
        palette={palette}
        onClose={closeGestures}
        triggerRef={gesturesTriggerRef}
      />
    </div>
  )
}
