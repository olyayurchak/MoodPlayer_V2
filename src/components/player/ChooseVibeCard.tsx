import { useEffect, useId, useRef, useState } from "react"
import PlayerMoodSelector from "./PlayerMoodSelector"
import { useLanguage } from "../../localization/LanguageContext"
import type { MoodId } from "../../data/moods"
import type { PlayerMoodAccent } from "../../data/playerMoodAccent"

/** Same masked gradient-ring technique as `PlayerMoodSelector`'s selected
 *  pill (duplicated rather than imported, matching `UpNextPanel`/
 *  `MobileUpNextSheet`'s own precedent for this small style object). */
const TILE_RING_STYLE = {
  padding: "1.5px",
  background:
    "linear-gradient(90deg, var(--color-cta-button-from), var(--color-cta-button-via), var(--color-cta-button-to))",
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
 * The tile shows the mood name only: Figma supplies an icon for Happy but
 * none for Melancholic/Chill yet, so all three stay consistent (label-only)
 * until those icons exist.
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
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const tileRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const headingId = useId()
  const menuId = useId()
  const moodName = t.vibeResult.moods[activeMood].name

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
      <p id={headingId} className="text-center text-[18px] font-medium leading-[1.25] text-white">
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
        className="relative flex h-[66px] w-[80px] shrink-0 items-center justify-center rounded-[12px] bg-[rgba(255,255,255,0.08)] px-[4px] text-center text-[12px] font-medium leading-[1.2] text-white shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)] transition-colors duration-200 hover:bg-[rgba(255,255,255,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span className="whitespace-nowrap">{moodName}</span>
        <span
          aria-hidden="true"
          style={{ ...TILE_RING_STYLE, ...(accent ? { background: accent.gradient } : null) }}
          className="pointer-events-none absolute inset-0 rounded-[12px]"
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="group"
          aria-label={t.vibeResult.manualChooseLabel}
          className="absolute top-0 right-[calc(100%+12px)] z-30 w-max rounded-[20px] border-[1.5px] border-[rgba(255,255,255,0.12)] bg-[rgba(18,14,36,0.92)] p-[12px] shadow-[0px_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-[20px]"
        >
          <PlayerMoodSelector activeMood={activeMood} onSelect={handleSelect} accent={accent} orientation="column" />
        </div>
      )}
    </div>
  )
}
