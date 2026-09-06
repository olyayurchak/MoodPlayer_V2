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
 * The "Up next" playlist panel — Desktop's right-side panel and Mobile's
 * final section (see `PlayerScreen.tsx` for where each is placed in its
 * own responsive tree). Same track list, same current-track highlight
 * treatment, on both breakpoints; only the panel's own container sizing
 * and scroll behavior differ.
 *
 * No new playlist/audio-switching logic per this task's scope — rows are
 * not clickable, this is a read-only visual list of `data/playerTrack.ts`'s
 * placeholder tracks (see that file's own doc comment on why they're all
 * the same placeholder track/artwork, matching the approved Figma frames
 * themselves).
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
 * `lg:`-only:
 * Mobile has no scroll container/scrollbar here at all (see below), so
 * this padding must never narrow its own row content. Mobile
 * deliberately has no nested scroll container — the list simply
 * continues in normal document flow and the page itself scrolls, the
 * more usual mobile pattern (and the approved Mobile Figma frame itself
 * only ever showed a single preview row here, cut off by the viewport
 * edge — implying the same "the page scrolls" behavior, not a fixed
 * nested sheet).
 * deliberately has no nested scroll container — the list simply
 * continues in normal document flow and the page itself scrolls, the
 * more usual mobile pattern (and the approved Mobile Figma frame itself
 * only ever showed a single preview row here, cut off by the viewport
 * edge — implying the same "the page scrolls" behavior, not a fixed
 * nested sheet).
 */
export default function UpNextPanel({
  mood,
  tracks,
  accent,
}: {
  mood: string
  tracks: PlayerTrack[]
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
        {tracks.map((track, index) => (
          <TrackRow key={track.id} track={track} isCurrent={index === 0} accent={accent} />
        ))}
      </div>
    </div>
  )
}
