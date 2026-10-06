import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react"

/** Pointer: a 12px square rotated 45° (≈17px wide diamond). */
export const POINTER_SIZE_PX = 12
export const POPOVER_BORDER_PX = 1.5

/**
 * Shared shell for the mobile Player's anchored utility popovers (Choose
 * Vibe, Gesture Controls): the Desktop Choose Vibe menu's surface
 * (`ChooseVibeCard.tsx` — 1.5px white 12% border, 20px radius, blur, soft
 * shadow) with the fill at 98% rather than 92%, because on mobile it floats
 * over the bright Play button and volume, which showed through at 92%.
 *
 * Positioning: absolute inside the trigger row (`MobilePlayerTriggers`'
 * `relative` container), above it (`bottom: calc(100% + 14px)`); the caller
 * gives the horizontal placement (`className`) and the pointer's `left`.
 *
 * Pointer: on the bottom edge, pointing down at the trigger. A rotated
 * square in the same fill whose two outer sides carry the same 1.5px
 * border; its centre sits on the popover's bottom border, so its base covers
 * that border segment and it reads as part of the surface.
 *
 * Behaviour (as the Desktop menu): on open, focus moves to
 * `initialFocusSelector`; Escape or a tap outside (the trigger excepted —
 * it toggles itself) calls `onClose`, which returns focus to the trigger.
 * Tab stays within the popover while it's open. Not modal — no scrim.
 */
export default function MobileTriggerPopover({
  open,
  onClose,
  triggerRef,
  labelledBy,
  className,
  style,
  pointerLeft,
  initialFocusSelector,
  children,
}: {
  open: boolean
  onClose: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
  labelledBy: string
  /** Horizontal placement and width, e.g. `left-0 w-[200px]`. */
  className: string
  /** Extra inline style (e.g. a computed width). */
  style?: CSSProperties
  /** The pointer's `left`, measured from the popover's padding box. */
  pointerLeft: CSSProperties["left"]
  initialFocusSelector: string
  children: ReactNode
}) {
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    popoverRef.current?.querySelector<HTMLElement>(initialFocusSelector)?.focus()

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      onClose()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
        return
      }
      if (event.key !== "Tab") return
      const focusables = [...(popoverRef.current?.querySelectorAll<HTMLElement>("button") ?? [])]
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose, triggerRef, initialFocusSelector])

  if (!open) return null

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-labelledby={labelledBy}
      style={style}
      className={`mobile-trigger-popover absolute bottom-[calc(100%+14px)] z-30 rounded-[20px] border-[1.5px] border-[rgba(255,255,255,0.12)] bg-[rgba(18,14,36,0.98)] p-[16px] shadow-[0px_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-[20px] ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        style={{ left: pointerLeft, width: POINTER_SIZE_PX, height: POINTER_SIZE_PX }}
        className="absolute top-full -translate-y-1/2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-[rgba(255,255,255,0.12)] bg-[rgba(18,14,36,0.98)]"
      />
    </div>
  )
}
