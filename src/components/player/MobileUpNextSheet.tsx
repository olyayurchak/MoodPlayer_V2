import { useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import logoMark from "../../imports/CameraPermission/logo-mark.svg"
import { LOGO_BAR_PATHS } from "../MoodPlayerLogo"
import type { PlayerTrack } from "../../data/playerTrack"
import type { PlayerMoodAccent } from "../../data/playerMoodAccent"
import { copy as t } from "../../content/copy"

/** Same gradient-ring-on-a-glass-surface technique `UpNextPanel.tsx` (and,
 *  before it, `PlayerMoodSelector`'s active pill) already uses for its own
 *  current-track row — duplicated locally rather than imported for the
 *  same reason `UpNextPanel.tsx` itself duplicates it instead of importing
 *  from `PlayerMoodSelector.tsx`: each of these sibling display components
 *  stays independently editable, and Desktop's `UpNextPanel` stays fully
 *  untouched by this Mobile-only feature (see this file's own doc comment
 *  below). */
const CURRENT_TRACK_RING_STYLE = {
  padding: "1.5px",
  background:
    "linear-gradient(90deg, var(--color-cta-button-from), var(--color-cta-button-via), var(--color-cta-button-to))",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude" as const,
}

/** How much of the collapsed sheet stays visible above the viewport's
 *  bottom edge — the *exact* height Figma's own approved collapsed frame
 *  gives this sheet, not an estimate: node `289:7420`'s own sheet layer
 *  (`289:7966`, "cta-pill") measures `width=382 height=111` in the Figma
 *  document itself (its own bottom edge sits flush with that frame's
 *  home-indicator area, at document y=898, and its top edge at y=787 —
 *  898−787=111). That happens to land partway through the peeked current
 *  row's own 64px height (the row's own Figma layer starts at sheet-
 *  relative y=73 and is 64 tall, i.e. it would end at 137, past this
 *  111 — Figma's own collapsed frame deliberately shows that row cropped,
 *  not whole, as a "there's more, drag up" affordance), so this
 *  component's own peek reveals the same handle+heading+*partial*-row
 *  amount, not a fully visible row.
 *
 *  Not derived from a real DOM measurement: a fixed constant matching a
 *  value Figma itself specifies is simpler and can't drift out of sync
 *  with a measured value that depends on render timing, and (being a
 *  fixed *content* height rather than anything tied to total screen
 *  height) this same 111 is correct at both the 375px- and 430px-wide
 *  Mobile references this feature targets — screen *width* doesn't change
 *  how tall the handle/heading/row themselves render. */
const PEEK_HEIGHT_PX = 111

/** The expanded sheet's own total height — also an exact Figma value, not
 *  an estimate, but expressed relative to the real viewport height rather
 *  than as a second fixed pixel constant: Figma's approved expanded frame
 *  (`node-id=298-760`, sheet layer `289:8044`) sits at document y=224 in
 *  its own 430×932 reference frame, its bottom edge flush with that same
 *  y=898 home-indicator boundary the collapsed frame uses (224+674=898) —
 *  i.e. Figma reveals exactly 224px of the Player above the expanded
 *  sheet, out of that frame's own total height. Unlike the peek height
 *  above, this *is* tied to how tall the screen is (more screen height
 *  means more sheet, not more revealed Player) — so reproducing "224px of
 *  Player revealed above it" at any real viewport height (375×812 and
 *  430×932 both, not just Figma's own 932-tall reference) means the
 *  sheet's own height must be `100dvh − 224px`, not a fixed number of
 *  pixels or a `vh` fraction. */
const EXPANDED_TOP_REVEAL_PX = 224

/** Minimum vertical pointer movement (px) before a press on the drag
 *  handle counts as an actual drag rather than a tap or accidental
 *  jitter — this feature's own explicit "a sensible drag threshold so
 *  tiny accidental movements do not toggle the sheet" requirement. Below
 *  this, `handlePointerMove` never touches the live-drag offset at all
 *  (not just "snaps back" after the fact), so a jitter produces zero
 *  visible movement, not a wobble. Matches common OS touch-slop values
 *  (~8–15px) used to disambiguate a tap from a drag. */
const DRAG_THRESHOLD_PX = 12

type DragState = {
  startClientY: number
  /** The sheet's own resting `translateY` in px at the moment this drag
   *  began (0 when it started expanded, `sheetHeightPx - PEEK_HEIGHT_PX`
   *  when it started collapsed) — measured fresh on every `pointerdown`
   *  via `getBoundingClientRect()` rather than cached, so it can never go
   *  stale across a resize/orientation change between drags. */
  startOffsetPx: number
  sheetHeightPx: number
  /** Set once movement first exceeds `DRAG_THRESHOLD_PX` during this
   *  gesture — read at `pointerup` to decide "snap to nearest side" vs.
   *  "this was a tap/jitter, leave the sheet exactly as it was." */
  dragged: boolean
  /** The live-drag offset as of the most recent `pointermove`, mirroring
   *  the `dragOffsetPx` React state — kept here *too*, and read from here
   *  (not from the state) at `pointerup`, because a fast enough
   *  pointerdown→move→up sequence can reach `pointerup` before React has
   *  re-rendered with the `pointermove`'s own `setDragOffsetPx` — a plain
   *  ref mutation has no such lag, so `pointerup` always sees the true
   *  latest value instead of a stale one from the render that was current
   *  when this gesture began. */
  lastOffsetPx: number
}

/** The current-track row's own equalizer-style indicator — reuses
 *  `MoodPlayerLogo.tsx`'s exact five-bar shape (`LOGO_BAR_PATHS`, a real
 *  31×22 icon this codebase already ships) rather than a new asset: the
 *  approved Figma expanded Up Next frame's own current-row indicator
 *  (node `289:8057`, next to that row's duration) is a byte-identical
 *  31×22 vector, and reusing the app's own brand mark for exactly this
 *  "now playing" cue is the same reuse-not-invent instruction this
 *  feature's own requirements call for. Mirrors `MoodPlayerLogo`'s own
 *  "plain `<img>` of the pre-baked universal-gradient asset when no
 *  `accent` override, an inline recolored SVG when one exists" split, for
 *  the same reason — the asset itself only ever bakes in the universal
 *  gradient, never a mood-specific one.
 *
 *  Purely decorative: the real, screen-reader-perceivable "this is the
 *  current track" signal is `SelectableTrackRow`'s own `aria-current`
 *  and its `aria-label`'s "— now playing" suffix (both unaffected by
 *  this indicator's own `aria-hidden`), plus the existing gradient ring
 *  — a shape/border cue, not color alone — so this icon adds a third,
 *  visual-only cue without being the *only* place that state lives. */
function NowPlayingIndicator({ accent }: { accent?: PlayerMoodAccent }) {
  const gradientId = useId()

  if (!accent) {
    return <img src={logoMark} alt="" aria-hidden="true" className="h-[22px] w-[31px] shrink-0" />
  }

  return (
    <svg
      aria-hidden="true"
      width="31"
      height="22"
      viewBox="0 0 31 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-[22px] w-[31px] shrink-0"
    >
      {LOGO_BAR_PATHS.map((d) => (
        <path key={d} d={d} fill={`url(#${gradientId})`} />
      ))}
      <defs>
        <linearGradient id={gradientId} x1="-1.5" y1="9" x2="36" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor={accent.gradientFrom} />
          <stop offset="1" stopColor={accent.gradientTo} />
        </linearGradient>
      </defs>
    </svg>
  )
}

function SelectableTrackRow({
  track,
  isCurrent,
  accent,
  onSelect,
}: {
  track: PlayerTrack
  isCurrent: boolean
  accent?: PlayerMoodAccent
  onSelect: (trackId: string) => void
}) {
  const label = isCurrent
    ? `${t.player.selectTrack(track.title, track.artist)} — ${t.player.nowPlayingLabel}`
    : t.player.selectTrack(track.title, track.artist)

  return (
    <button
      type="button"
      onClick={() => onSelect(track.id)}
      aria-current={isCurrent ? "true" : undefined}
      aria-label={label}
      style={accent && isCurrent ? { backgroundColor: accent.accentSecondaryTint } : undefined}
      className={`relative flex w-full shrink-0 items-center justify-between gap-[12px] rounded-[12px] p-[8px] text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
        isCurrent && !accent ? "bg-[rgba(255,255,255,0.06)]" : ""
      }`}
    >
      {isCurrent && (
        <span
          aria-hidden="true"
          style={accent ? { ...CURRENT_TRACK_RING_STYLE, background: accent.gradient } : CURRENT_TRACK_RING_STYLE}
          className="pointer-events-none absolute inset-0 rounded-[12px]"
        />
      )}
      <div className="relative flex min-w-0 items-center gap-[12px]">
        <img src={track.artwork} alt="" className="size-[48px] shrink-0 rounded-[8px] object-cover" />
        <div className="flex min-w-0 flex-col gap-[2px] text-[14px] tracking-[-0.2px]">
          <p className="truncate font-medium text-white">{track.title}</p>
          <p className="truncate font-light text-[#cfcfcf]">{track.artist}</p>
        </div>
      </div>
      <div className="relative flex shrink-0 items-center gap-[8px]">
        <p className="text-[14px] font-light tracking-[-0.2px] text-[#cfcfcf]">{track.durationLabel}</p>
        {/* A second, non-color signal for "this is the current track" —
            the gradient ring above is a shape/border cue already, but this
            equalizer icon (plus the real `aria-current`/label above) is
            this row's own explicit answer to this feature's "don't rely
            only on color" requirement — matching the approved Figma
            expanded frame's own indicator next to the current row's
            duration, not a redesign of it. */}
        {isCurrent && <NowPlayingIndicator accent={accent} />}
      </div>
    </button>
  )
}

/**
 * The Mobile-only "Up next" bottom sheet (approved Figma frames
 * `node-id=289-7420` collapsed / `node-id=298-760` expanded) — replaces
 * `UpNextPanel` on the Mobile tree only; Desktop keeps rendering
 * `UpNextPanel` itself, completely unchanged (that component's own props/
 * behavior/layout are untouched by this feature — see its doc comment).
 *
 * Portaled to `document.body` rather than rendered inline in
 * `PlayerScreen`'s own tree: `position: fixed` is supposed to sit relative
 * to the viewport, but `PlayerScreen`'s own outer wrapper carries
 * `backdrop-blur-[20px]` (a `backdrop-filter`), and per spec an ancestor
 * with an active `filter`/`backdrop-filter`/`transform` becomes the
 * containing block for any `position: fixed` descendant instead of the
 * viewport — without the portal, this sheet would be positioned/clipped
 * relative to that blurred wrapper, not the actual screen. Escaping to
 * `document.body` is the standard fix (the same reason most bottom-sheet/
 * modal implementations portal), and needs no new dependency: `createPortal`
 * is already part of `react-dom`, a package this app already depends on.
 *
 * Always mounted (this file's own top-level element carries `lg:hidden`),
 * matching `PlayerScreen`'s existing "both trees always mounted, switched
 * by CSS alone" pattern for the same reason — `lg:hidden` is a plain media
 * query, so it hides this sheet correctly at Desktop widths regardless of
 * where in the DOM it physically lives.
 *
 * Collapsed/expanded state is a plain local `useState` owned entirely by
 * this component — deliberately *not* lifted to `PlayerScreen` (whose own
 * state is reserved for things Desktop also needs, like `currentTrackIndex`
 * and the shared `usePlayerAudio` instance): whether this Mobile-only sheet
 * happens to be open has no Desktop equivalent and nothing else in this
 * app needs to read or drive it, so keeping it local here is both the
 * smallest change and keeps `PlayerScreen` itself unaware this sheet even
 * has an open/closed state.
 *
 * Two ways to toggle, both funneling through the same `isExpanded` state
 * and the same resting `transform`, never a second independent mechanism:
 * - a real vertical drag on the handle (`handlePointerDown/Move/Up`,
 *   Pointer Events so the exact same code path handles mouse, touch, and
 *   pen — never a touch-only or mouse-only implementation);
 * - a plain tap/click/keyboard activation of that same handle `<button>`,
 *   suppressed via `justDraggedRef` for the split second right after an
 *   actual drag release so one gesture can never both drag-close *and*
 *   then immediately re-open via the synthetic click that follows a
 *   pointer release.
 *
 * Track selection (`onSelect` on each `SelectableTrackRow`) calls straight
 * back into `PlayerScreen`'s own `selectTrack` handler — this component
 * owns no playback/switching logic of its own, exactly like `UpNextPanel`
 * before it; see `PlayerScreen.tsx`'s own doc comment on `selectTrack` for
 * why that's enough to reuse the *exact* same audio-preservation logic
 * Next/Previous already rely on, with no changes to `usePlayerAudio.ts`.
 */
export default function MobileUpNextSheet({
  mood,
  tracks,
  currentTrackId,
  accent,
  onSelectTrack,
}: {
  mood: string
  /** Already sliced by the caller to "current track and every track after
   *  it", same contract as `UpNextPanel`'s own `tracks` prop. */
  tracks: PlayerTrack[]
  currentTrackId: string
  accent?: PlayerMoodAccent
  onSelectTrack: (trackId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  /** `null` while at rest (the resting `transform` below is driven purely
   *  by `isExpanded`, via a CSS `calc()` relative to the sheet's own
   *  height — see `restingTransform`); a literal px value only while an
   *  active drag is following the pointer 1:1. */
  const [dragOffsetPx, setDragOffsetPx] = useState<number | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const justDraggedRef = useRef(false)

  const restingTransform = isExpanded ? "translateY(0px)" : `translateY(calc(100% - ${PEEK_HEIGHT_PX}px))`
  const transform = dragOffsetPx === null ? restingTransform : `translateY(${dragOffsetPx}px)`

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const sheet = sheetRef.current
    if (!sheet) return
    // A new gesture starting always invalidates any leftover flag from a
    // *previous* one — without this, a drag whose release the browser
    // never followed with a synthetic `click` (common for touch once
    // movement exceeded its own click-cancellation threshold) would leave
    // this `true` indefinitely, silently swallowing the *next*, entirely
    // unrelated tap's own legitimate toggle.
    justDraggedRef.current = false
    const sheetHeightPx = sheet.getBoundingClientRect().height
    const startOffsetPx = isExpanded ? 0 : Math.max(sheetHeightPx - PEEK_HEIGHT_PX, 0)
    dragRef.current = { startClientY: event.clientY, startOffsetPx, sheetHeightPx, dragged: false, lastOffsetPx: startOffsetPx }
    // Guards a real (rare) edge case — a pointer that's already gone inactive
    // by the time this handler runs — rather than letting a thrown
    // `DOMException` abort the gesture the ref above already started
    // tracking; capture is a nice-to-have here (keeps the drag tracking the
    // handle even if the pointer strays outside it), not load-bearing.
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // no-op
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const deltaY = event.clientY - drag.startClientY
    if (!drag.dragged && Math.abs(deltaY) < DRAG_THRESHOLD_PX) return
    drag.dragged = true
    setIsDragging(true)
    const collapsedOffsetPx = Math.max(drag.sheetHeightPx - PEEK_HEIGHT_PX, 0)
    const next = Math.min(collapsedOffsetPx, Math.max(0, drag.startOffsetPx + deltaY))
    drag.lastOffsetPx = next
    setDragOffsetPx(next)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!drag || !drag.dragged) return // tap or sub-threshold jitter — the handle's own onClick handles a tap

    justDraggedRef.current = true
    const collapsedOffsetPx = Math.max(drag.sheetHeightPx - PEEK_HEIGHT_PX, 0)
    const midpoint = collapsedOffsetPx / 2
    // Read from the ref (`drag.lastOffsetPx`), not the `dragOffsetPx` state
    // closed over by this render — a fast enough pointerdown→move→up
    // sequence can reach this handler before React has re-rendered with
    // the last `pointermove`'s own `setDragOffsetPx`, which would make
    // that state value stale here.
    setIsExpanded(drag.lastOffsetPx < midpoint)
    setIsDragging(false)
    setDragOffsetPx(null)
  }

  const handleToggleClick = () => {
    // A real drag release already decided the next state itself (above) —
    // the synthetic `click` that follows that same pointer release must
    // not immediately flip it back.
    if (justDraggedRef.current) {
      justDraggedRef.current = false
      return
    }
    setIsExpanded((current) => !current)
  }

  return createPortal(
    <div
      ref={sheetRef}
      data-dragging={isDragging || undefined}
      style={{ transform }}
      className="mobile-up-next-sheet fixed inset-x-0 bottom-0 z-40 flex justify-center lg:hidden"
    >
      <div
        // A literal `h-[calc(100dvh-224px)]` Tailwind class would work
        // identically at build time, but would silently drift out of sync
        // with `EXPANDED_TOP_REVEAL_PX` if that constant's own doc-commented
        // Figma value ever changed without someone remembering to edit this
        // string too — an inline style computed from the same constant
        // can't go stale that way.
        style={{ height: `calc(100dvh - ${EXPANDED_TOP_REVEAL_PX}px)` }}
        // A measured audit found this sheet visually merging with
        // `GestureControlsPanel` right above it: both use the exact same
        // `bg-[rgba(255,255,255,0.08)]` glass fill, and sit close together
        // (collapsed, or right at the ~8px clearance the Player layout
        // reserves above it) with nothing distinguishing the sheet as its
        // own elevated surface. Fixed by strengthening only the *top-edge*
        // separation — the fill color itself is untouched, per this task's
        // explicit "don't change it in the first pass":
        // - `border-t-[1px] border-t-[rgba(255,255,255,0.14)]` — a hairline
        //   translucent highlight along the top edge only (matches this
        //   codebase's own subtle-border convention, e.g.
        //   `GestureControlsPanel`'s own toggle-group ring, just at a
        //   noticeably lower alpha — 0.14 vs that ring's 0.25 — so this
        //   reads as a soft edge-highlight, not a bright outline). Adds no
        //   geometry: Tailwind's global `box-sizing: border-box` reset
        //   means this 1px eats into the box's own already-fixed
        //   `calc(100dvh - 224px)` height rather than growing it.
        // - `shadow-[0px_-16px_32px_0px_rgba(0,0,0,0.35)]` — a soft,
        //   *upward*-facing dark shadow (negative Y offset, since this
        //   sheet sits at the very bottom of the viewport and needs to
        //   read as elevated *above* the content behind/above it, not
        //   below it) — dark rather than a bright glow per this task's
        //   explicit "avoid strong glow" instruction, and soft/diffuse
        //   (32px blur, 0.35 alpha) rather than a heavy hard-edged drop
        //   shadow. `overflow-hidden` on this same element clips only its
        //   *content* (the track list scrolling underneath), never its own
        //   border or box-shadow, so neither is clipped by that.
        // Both apply identically across Happy/Melancholic/Chill — neither
        // reads any `accent` prop, so there is no mood-specific branching
        // to keep in sync.
        className="flex w-full max-w-[382px] flex-col overflow-hidden rounded-t-[24px] border-t-[1px] border-t-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] shadow-[0px_-16px_32px_0px_rgba(0,0,0,0.35)] backdrop-blur-[20px]"
      >
        {/* A measured audit found this handle's real hit area was only
            36px tall (the button's own box hugs the 5px visible bar plus
            its own vertical centering padding) — under the ~44px iOS
            ergonomic baseline. Fixed with the same invisible `before:`
            pseudo-element technique the former language switcher/
            `MoodPlayerLogo.tsx` already use, not a real height/padding
            increase: the button's own real box (and therefore
            `PEEK_HEIGHT_PX`'s own 111px collapsed-peek content, which
            starts counting from this button's real top) must stay exactly
            36px, or a genuinely taller handle would push the heading/row
            content it reveals downward, cropping more of the peeked
            current-track row than Figma's own approved collapsed frame
            shows.
            Only extends *downward* (`before:-bottom-[10px]`, none
            upward): extending upward would land outside this card's own
            `overflow-hidden` box (the direct parent right above), which
            clips — and un-hit-tests — anything beyond its edges
            regardless of collapsed/expanded state, so an upward
            expansion would silently not work at all. Downward instead
            lands inside the card, over the top of the (non-interactive,
            no `onClick`) "Up next" heading text below — 10px is well
            short of where the real `SelectableTrackRow` buttons begin
            (the heading block's own height is ~57px), so this can never
            intercept a track-row tap. Left/right stay flush
            (`before:inset-x-0`) — the button is already `w-full`, so
            width was never the problem. Net effective hit height: 36 + 10
            = 46px, clearing the ~44px target. */}
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls="mobile-up-next-list"
          aria-label={isExpanded ? t.player.upNextSheetCollapseLabel : t.player.upNextSheetExpandLabel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleToggleClick}
          className="relative flex h-[36px] w-full shrink-0 touch-none items-center justify-center before:absolute before:inset-x-0 before:top-0 before:-bottom-[10px] before:content-[''] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true" className="h-[5px] w-[64px] rounded-full bg-white/40" />
        </button>

        <div className="flex flex-col gap-[2px] px-[20px] pb-[12px] tracking-[-0.2px]">
          <p className="text-[20px] font-medium text-white">{t.player.upNextHeading}</p>
          <p className="text-[16px] font-light text-[#cfcfcf]">{t.player.upNextSubtitle(mood)}</p>
        </div>

        <div
          id="mobile-up-next-list"
          className="up-next-scroll flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto overscroll-contain px-[20px] pb-[20px]"
        >
          {tracks.map((track) => (
            <SelectableTrackRow
              key={track.id}
              track={track}
              isCurrent={track.id === currentTrackId}
              accent={accent}
              onSelect={onSelectTrack}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
