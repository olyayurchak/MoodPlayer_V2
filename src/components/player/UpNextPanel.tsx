import type { PlayerTrack } from "../../data/playerTrack"
import type { PlayerMoodAccent } from "../../data/playerMoodAccent"
import { useLanguage } from "../../localization/LanguageContext"

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

function TrackRow({
  track,
  isCurrent,
  accent,
}: {
  track: PlayerTrack
  isCurrent: boolean
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
  return (
    <div
      style={accent && isCurrent ? { backgroundColor: accent.accentSecondaryTint } : undefined}
      className={`relative flex w-full shrink-0 items-center justify-between gap-[12px] rounded-[12px] p-[8px] ${
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
      <p className="relative shrink-0 text-[14px] font-light tracking-[-0.2px] text-[#cfcfcf]">
        {track.durationLabel}
      </p>
    </div>
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
 * Rows are still not clickable (no queue-jump-by-click on Desktop) and
 * this component still owns no playback/switching logic of its own — it's
 * a read-only view of whatever `tracks`/`currentTrackId` `PlayerScreen`
 * hands it. `PlayerScreen` slices `data/playerTrack.ts`'s `testTracks`
 * down to "current track and everything after it" before passing `tracks`
 * here — this component's own job is just comparing each row's real
 * `track.id` against `currentTrackId`.
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
}: {
  mood: string
  /** Already sliced by the caller to "current track and every track after
   *  it" (`PlayerScreen`'s own `testTracks.slice(currentTrackIndex)`) —
   *  this component never sees already-played tracks and never reorders
   *  or filters `tracks` itself. */
  tracks: PlayerTrack[]
  /** Which of `tracks` is the one actually playing — compared against
   *  each row's own `track.id` rather than assumed to be at index `0`,
   *  so this stays correct however `tracks` itself is produced. */
  currentTrackId: string
  accent?: PlayerMoodAccent
}) {
  const { t } = useLanguage()

  return (
    <div className="flex w-full flex-col gap-[20px] rounded-[24px] bg-[rgba(255,255,255,0.08)] p-[20px] backdrop-blur-[20px] lg:h-[492px] lg:w-[385px] lg:shrink-0">
      <div className="flex flex-col gap-[2px] tracking-[-0.2px]">
        <p className="text-[20px] font-medium text-white lg:text-[24px]">{t.player.upNextHeading}</p>
        <p className="text-[16px] font-light text-[#cfcfcf]">{t.player.upNextSubtitle(mood)}</p>
      </div>
      <div className="up-next-scroll flex flex-col gap-[8px] lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-[10px]">
        {tracks.map((track) => (
          <TrackRow key={track.id} track={track} isCurrent={track.id === currentTrackId} accent={accent} />
        ))}
      </div>
    </div>
  )
}
