import { useId, type RefObject } from "react"
import PlayerMoodSelector from "./PlayerMoodSelector"
import MobileTriggerPopover, { POINTER_SIZE_PX, POPOVER_BORDER_PX } from "./MobileTriggerPopover"
import { copy as t } from "../../content/copy"
import type { MoodId } from "../../data/moods"

/** The Vibe trigger's fixed width (`MobilePlayerTriggers.tsx`). The popover
 *  shares the trigger's left edge, so centring the pointer on this width
 *  lines it up with the trigger at every screen width. */
const TRIGGER_WIDTH_PX = 148

/**
 * Mobile Choose Vibe popover — the Desktop Choose Vibe menu
 * (`ChooseVibeCard.tsx`) as a compact popover anchored above the mobile Vibe
 * trigger, on the shared `MobileTriggerPopover` shell (surface, bottom
 * pointer, open/close/focus behaviour). Content: the same mood rows as
 * desktop (`PlayerMoodSelector`, `"popover"` size: Figma mood icons, labels,
 * 1px mood-spectrum ring on the selected one).
 *
 * 200px wide, sharing the Vibe trigger's left edge; the pointer sits on the
 * trigger's centre (74px from that edge). Focus moves to the selected mood
 * on open; choosing a mood selects it and closes.
 */
export default function MobileChooseVibePopover({
  open,
  activeMood,
  onSelect,
  onClose,
  triggerRef,
}: {
  open: boolean
  activeMood: MoodId
  onSelect: (mood: MoodId) => void
  onClose: () => void
  /** Taps on the trigger itself are left to its own toggle. */
  triggerRef: RefObject<HTMLButtonElement | null>
}) {
  const headingId = useId()

  return (
    <MobileTriggerPopover
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      labelledBy={headingId}
      className="left-0 w-[200px]"
      pointerLeft={TRIGGER_WIDTH_PX / 2 - POPOVER_BORDER_PX - POINTER_SIZE_PX / 2}
      initialFocusSelector='button[aria-pressed="true"]'
    >
      <p id={headingId} className="mb-[12px] text-[14px] font-medium leading-[1.2] text-white">
        {t.player.chooseVibeHeading}
      </p>
      <PlayerMoodSelector activeMood={activeMood} onSelect={onSelect} orientation="popover" />
    </MobileTriggerPopover>
  )
}
