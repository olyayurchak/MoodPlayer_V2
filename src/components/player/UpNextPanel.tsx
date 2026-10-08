import { useEffect, useRef } from "react"
import type { PlayerTrack } from "../../data/playerTrack"
import { spectrumGradient, type MoodSpectrum, type PlayerMoodAccent } from "../../data/playerMoodAccent"
import { copy as t } from "../../content/copy"

/** Same gradient-ring-on-a-glass-surface technique as
 *  `PlayerMoodSelector`'s active pill (itself the same technique
 *  `VibeResultScreen.tsx` established) — generalized here to a
 *  `rounded-[12px]` list row instead of a full pill. Duplicated locally
 *  for the same reason `PlayerMoodSelector` duplicates it rather than
 *  importing from `VibeResultScreen.tsx`: that screen stays untouched. */
const CURRENT_TRACK_RING_STYLE = {
  padding: "1.5px",
  background:
    "linear-gradient(90deg, var(--color-cta-button-from), var(--color-cta-button-via), var(--color-cta-button-to))",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude" as const,
}

/** Scrolls `list` (only — never the page) just enough to show `row`,
 *  and not at all when it's already fully visible. Shared with
 *  `MobileUpNextSheet`. */
export function scrollRowIntoList(list: HTMLElement, row: Element) {
  const listBox = list.getBoundingClientRect()
  const rowBox = row.getBoundingClientRect()
  if (rowBox.top < listBox.top) list.scrollTop += rowBox.top - listBox.top
  else if (rowBox.bottom > listBox.bottom) list.scrollTop += rowBox.bottom - listBox.bottom
}

function TrackRow({
  track,
  isCurrent,
  accent,
  spectrum,
  onSelect,
}: {
  track: PlayerTrack
  isCurrent: boolean
  onSelect: (trackId: string) => void
  /** Desktop gradient hierarchy: when set, the current row's ring is a
   *  faint 1px edge of the mood spectrum (45%) instead of the full
   *  gradient — a selected state, not a competitor to Play. */
  spectrum?: MoodSpectrum
  /** From `data/playerMoodAccent.ts`, `undefined` for any mood without
   *  its own approved override yet. When present, the current-track
   *  row's translucent fill becomes that mood's own `accentSecondaryTint`
   *  (replacing the neutral `rgba(255,255,255,0.06)`), and its ring
   *  reuses this same masked-gradient-ring technique
   *  (`CURRENT_TRACK_RING_STYLE`) with `accent.gradient` painted on it
   *  instead of the universal Mood Gradient — the same technique/field
   *  the selected "Happy" mood-selector pill's ring already reuses,
   *  rather than a flat solid `border-color` (a first attempt that read
   *  as one flat orange stroke instead of the full approved
   *  orange→coral→red sweep). */
  accent?: PlayerMoodAccent
}) {
  // Same accessible name / current-track semantics as Mobile's
  // `SelectableTrackRow` (`MobileUpNextSheet.tsx`).
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
      className={`relative flex w-full shrink-0 cursor-pointer items-center justify-between gap-[12px] rounded-[12px] p-[8px] text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
        isCurrent ? (accent ? "" : "bg-[rgba(255,255,255,0.06)]") : "hover:bg-[rgba(255,255,255,0.04)]"
      }`}
    >
      {isCurrent && (
        <span
          aria-hidden="true"
          style={
            spectrum
              ? { ...CURRENT_TRACK_RING_STYLE, padding: "1px", background: spectrumGradient(spectrum, 0.45) }
              : accent
                ? { ...CURRENT_TRACK_RING_STYLE, background: accent.gradient }
                : CURRENT_TRACK_RING_STYLE
          }
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
      <p className="relative shrink-0 text-[14px] font-light tracking-[-0.2px] text-[#cfcfcf]">
        {track.durationLabel}
      </p>
    </button>
  )
}

/**
 * The "Up next" playlist panel — Desktop's right-side panel only (see
 * `PlayerScreen.tsx`). Mobile now has its own dedicated bottom-sheet
 * implementation, `MobileUpNextSheet.tsx` (real drag-to-expand/collapse,
 * its own internal scroll, and real track selection, per the approved
 * Mobile Up Next sheet feature) — this component is no longer rendered on
 * the Mobile tree at all, and this file itself carries no `lg:`-only
 * behavior changes from that work; everything below is exactly as it was
 * before that feature, Desktop-only, unchanged.
 *
 * Every row is a button that hands its track to `onSelectTrack`
 * (`PlayerScreen`'s shared `selectTrack`) — this component owns no
 * playback/switching logic of its own. `PlayerScreen` passes the full
 * playlist in its stored order — every track stays listed whatever is
 * playing, and Shuffle/Repeat never change it; only the current-row
 * highlight moves (each row's `track.id` against `currentTrackId`).
 *
 * Desktop keeps its own internal scroll area (`lg:overflow-y-auto` with a
 * capped height, styled via the `.up-next-scroll` class in `index.css`
 * for a narrow, low-emphasis scrollbar matching the approved Figma design
 * instead of the browser's own thick default) so the panel's outer size
 * matches the approved frame without the whole page needing to grow with
 * the list. The `lg:pr-[10px]` below is the actual gutter between the
 * track rows and the scrollbar itself — Figma's own reference (node
 * `290:9614`/`290:9668`, a `3px`-wide, `#d9d9d9` floating thumb sitting a
 * further ~6px inside the panel's own right edge) has real breathing room
 * there — this screen's previous, unpadded version instead sat the
 * scrollbar flush against the row content, which this padding fixes.
 */
export default function UpNextPanel({
  mood,
  tracks,
  currentTrackId,
  accent,
  spectrum,
  onSelectTrack,
}: {
  mood: string
  /** The full playlist in stored order — never reordered or filtered. */
  tracks: PlayerTrack[]
  /** Which of `tracks` is the one actually playing — compared against
   *  each row's own `track.id` rather than assumed to be at index `0`,
   *  so this stays correct however `tracks` itself is produced. */
  currentTrackId: string
  accent?: PlayerMoodAccent
  spectrum?: MoodSpectrum
  onSelectTrack: (trackId: string) => void
}) {
  // Keep the current row in view when the track changes — scrolling only
  // if it's outside the visible part of the list, so the list never jumps
  // while the current row is already on screen.
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const list = listRef.current
    const row = list?.querySelector('[aria-current="true"]')
    if (list && row) scrollRowIntoList(list, row)
  }, [currentTrackId])

  return (
    <div className="flex w-full flex-col gap-[20px] rounded-[24px] bg-[rgba(255,255,255,0.08)] p-[20px] backdrop-blur-[20px] lg:pt-[24px] lg:h-[715px] lg:w-[479px] lg:shrink-0">
      <div className="flex flex-col gap-[2px] tracking-[-0.2px]">
        <p className="text-[20px] font-medium text-white lg:text-[24px]">{t.player.upNextHeading}</p>
        <p className="text-[16px] font-light text-[#cfcfcf]">{t.player.upNextSubtitle(mood)}</p>
      </div>
      <div ref={listRef} className="up-next-scroll flex flex-col gap-[8px] lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-[10px]">
        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            isCurrent={track.id === currentTrackId}
            accent={accent}
            spectrum={spectrum}
            onSelect={onSelectTrack}
          />
        ))}
      </div>
    </div>
  )
}
