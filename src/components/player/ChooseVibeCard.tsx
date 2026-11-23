import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import PlayerMoodSelector from "./PlayerMoodSelector"
import { POINTER_SIZE_PX, POPOVER_BORDER_PX } from "./MobileTriggerPopover"
import { MoodIcon } from "./moodIcons"
import { copy as t } from "../../content/copy"
import type { MoodId } from "../../data/moods"
import { PLAYER_SPECTRUM, spectrumGradient, type PlayerMoodAccent } from "../../data/playerMoodAccent"

/** Same masked gradient-ring technique as `PlayerMoodSelector`'s selected
 *  pill (duplicated rather than imported, matching `UpNextPanel`/
 *  `MobileUpNextSheet`'s own precedent for this small style object). */
const TILE_RING_STYLE = {
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude" as const,
}

/**
 * Desktop Player utility rail — "Choose Vibe" card (Figma node `549:1359`,
 * 108×172). At rest it shows only the current mood as one tile, exactly
 * like the frame. The frame doesn't define how another mood is picked, so
 * (approved) the tile is a disclosure button: it opens a small menu that
 * reuses `PlayerMoodSelector` as-is (column layout), so choosing a mood
 * calls the screen's existing `onSelect`/`setActiveMood` — no separate
 * mood logic here. Esc or a click outside closes it and returns focus to
 * the tile; choosing a mood closes it too.
 *
 * The tile shows the active mood's Figma icon (36px) above its label, and
 * the menu rows show each mood's icon (32px) beside its label — Figma
 * `580:610`; icons in `moodIcons.tsx`.
 */
export default function ChooseVibeCard({
  activeMood,
  onSelect,
  accent,
}: {
  activeMood: MoodId
  onSelect: (mood: MoodId) => void
  accent?: PlayerMoodAccent
}) {
  const [isOpen, setIsOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLParagraphElement>(null)
  const tileRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const headingId = useId()
  const menuId = useId()
  const moodName = t.vibeResult.moods[activeMood].name

  useLayoutEffect(() => {
    const card = cardRef.current
    const heading = headingRef.current
    const tile = tileRef.current
    const menu = menuRef.current
    if (!isOpen || !card || !heading || !tile || !menu) return

    const alignPointer = () => {
      const tileBounds = tile.getBoundingClientRect()
      const cardTop = card.getBoundingClientRect().top
      menu.style.setProperty("--pointer-center", `${tileBounds.top - cardTop + tileBounds.height / 2}px`)
    }
    alignPointer()

    const observer = new ResizeObserver(alignPointer)
    observer.observe(card)
    observer.observe(heading)
    return () => observer.disconnect()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    // Move focus into the menu, onto the currently selected mood.
    menuRef.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus()

    const handlePointerDown = (event: PointerEvent) => {
      if (!cardRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setIsOpen(false)
      tileRef.current?.focus()
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (mood: MoodId) => {
    onSelect(mood)
    setIsOpen(false)
    tileRef.current?.focus()
  }

  return (
    <div
      ref={cardRef}
      role="group"
      aria-labelledby={headingId}
      className="relative flex h-[172px] w-full shrink-0 flex-col items-center justify-center gap-[16px] rounded-[24px] bg-[rgba(255,255,255,0.08)] px-[8px] backdrop-blur-[20px]"
    >
      <p ref={headingRef} id={headingId} className="text-center text-[18px] font-medium leading-[1.25] text-white">
        {t.player.chooseVibeHeading}
      </p>

      <button
        ref={tileRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`${t.player.chooseVibeHeading}: ${moodName}`}
        style={{ borderColor: isOpen ? "transparent" : "rgba(255, 255, 255, 0.4)" }}
        className="relative flex h-[66px] w-[80px] shrink-0 flex-col items-center justify-center rounded-[12px] border bg-[rgba(255,255,255,0.08)] px-[3px] py-[7px] text-center text-[11px] font-medium leading-[1.2] text-[#cfcfcf] shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)] transition-colors duration-200 hover:bg-[rgba(255,255,255,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <MoodIcon mood={activeMood} size={36} className="shrink-0" />
        <span className="whitespace-nowrap">{moodName}</span>
        {isOpen && (
          <span
            aria-hidden="true"
            style={{ ...TILE_RING_STYLE, background: spectrumGradient(PLAYER_SPECTRUM[activeMood], 0.55) }}
            className="pointer-events-none absolute -inset-px rounded-[inherit] p-[2px]"
          />
        )}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="group"
          aria-label={t.vibeResult.manualChooseLabel}
          className="absolute top-0 right-[calc(100%+12px)] z-30 w-max rounded-[20px] [--vibe-surface:rgba(18,14,36,0.92)] [--vibe-border:rgba(255,255,255,0.12)]"
        >
          <div
            style={{ borderWidth: POPOVER_BORDER_PX }}
            className="rounded-[inherit] border-transparent bg-(--vibe-surface) p-[24px] shadow-[0px_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-[20px]"
          >
            <PlayerMoodSelector activeMood={activeMood} onSelect={handleSelect} accent={accent} orientation="column" />
          </div>
          {/* Cut the opening out of the border and paint only the outer half of
              the mobile diamond so no border or second fill crosses its base. */}
          <span
            aria-hidden="true"
            style={{
              borderWidth: POPOVER_BORDER_PX,
              clipPath: "polygon(0 0, 100% 0, 100% calc(var(--pointer-center) - 8px), calc(100% - 2px) calc(var(--pointer-center) - 8px), calc(100% - 2px) calc(var(--pointer-center) + 8px), 100% calc(var(--pointer-center) + 8px), 100% 100%, 0 100%)",
            }}
            className="pointer-events-none absolute inset-0 rounded-[inherit] border-(--vibe-border)"
          />
          <span
            aria-hidden="true"
            style={{
              width: POINTER_SIZE_PX,
              height: POINTER_SIZE_PX,
              borderTopWidth: POPOVER_BORDER_PX,
              borderRightWidth: POPOVER_BORDER_PX,
              clipPath: "polygon(0 0, 100% 0, 100% 100%)",
            }}
            className="pointer-events-none absolute top-(--pointer-center) left-full -translate-1/2 rotate-45 border-(--vibe-border) bg-(--vibe-surface)"
          />
        </div>
      )}
    </div>
  )
}
