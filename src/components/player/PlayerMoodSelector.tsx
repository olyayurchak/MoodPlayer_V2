import { MOOD_IDS, type MoodId } from "../../data/moods"
import type { PlayerMoodAccent } from "../../data/playerMoodAccent"
import { useLanguage } from "../../localization/LanguageContext"

/** The selected mood pill's gradient ring — byte-for-byte the same
 *  technique `VibeResultScreen.tsx` already established as the approved
 *  active-state treatment (`SELECTED_MOOD_PILL_RING_STYLE` there): a glass
 *  pill identical to an inactive one, with the brand gradient painted on a
 *  separate absolutely-positioned, `mask-composite: exclude`-clipped
 *  overlay so only a `padding`-wide ring shows, never smeared across the
 *  pill's own `backdrop-blur`. Duplicated here (not imported from
 *  `VibeResultScreen.tsx`) deliberately — that screen is explicitly out of
 *  scope for this task ("existing screens remain visually and
 *  functionally unchanged"), so this reuses the same values/approach
 *  without refactoring that screen to export them. See that file's own,
 *  much longer doc comment for the full reasoning/history behind this
 *  exact technique. */
const SELECTED_MOOD_PILL_RING_STYLE = {
  padding: "1.5px",
  background:
    "linear-gradient(90deg, var(--color-cta-button-from), var(--color-cta-button-via), var(--color-cta-button-to))",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude" as const,
}

/**
 * Header mood-selector row — Happy / Melancholic / Chill, text-only pills
 * (no icons, per this task's explicit requirement), reused identically on
 * Desktop and Mobile (only the surrounding header layout differs between
 * breakpoints, not this row itself). Mirrors Vibe Result's own manual
 * mood-selector pills exactly (glass pill, gradient ring on the active
 * one) so switching moods on the Player screen reads as the same control
 * the user already used on Vibe Result, not a new pattern.
 *
 * `activeMood`/`onSelect` are owned by `PlayerScreen` (see that file) —
 * this component is presentational only. Switching the active mood here
 * changes which mood's *visual* state is highlighted; it does not (this
 * milestone has no playlist/audio architecture to switch) reload a
 * different playlist or restart playback.
 *
 * `accent` (from `data/playerMoodAccent.ts`, `undefined` for any mood
 * without its own approved override yet) swaps the *selected* pill's ring
 * from the universal Mood Gradient to that mood's own approved gradient
 * (`accent.gradient`) — same masked-ring technique (`mask-composite:
 * exclude`) as the universal treatment below, just a different
 * `background`. A first attempt rendered this as a flat solid
 * `border-color` instead, which read as a plain orange stroke rather than
 * the full orange→coral→red ring Figma actually shows; this reuses the
 * existing ring technique instead of that one-off solid border. Unselected
 * pills and any mood without an `accent` entry keep today's existing
 * treatment, unchanged.
 */
export default function PlayerMoodSelector({
  activeMood,
  onSelect,
  accent,
  orientation = "row",
}: {
  activeMood: MoodId
  onSelect: (mood: MoodId) => void
  accent?: PlayerMoodAccent
  /** `"column"` stacks the same pills vertically (the Desktop Choose Vibe
   *  menu, `ChooseVibeCard.tsx`); `"row"` is the original layout. */
  orientation?: "row" | "column"
}) {
  const { t } = useLanguage()

  return (
    <div
      className={
        orientation === "column"
          ? "flex flex-col items-stretch gap-[8px]"
          : "flex flex-wrap items-center justify-center gap-[12px]"
      }
    >
      {MOOD_IDS.map((moodId) => {
        const isSelected = moodId === activeMood
        const label = t.vibeResult.moods[moodId].name

        if (isSelected && accent) {
          return (
            <button
              key={moodId}
              type="button"
              onClick={() => onSelect(moodId)}
              aria-pressed="true"
              className="relative shrink-0 rounded-pill border-[1.5px] border-transparent bg-[rgba(255,255,255,0.08)] px-[16px] py-[12px] text-[16px] font-medium text-white backdrop-blur-[20px] shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:px-[24px]"
            >
              {label}
              <span
                aria-hidden="true"
                style={{ ...SELECTED_MOOD_PILL_RING_STYLE, background: accent.gradient }}
                className="pointer-events-none absolute inset-0 rounded-pill"
              />
            </button>
          )
        }

        if (isSelected) {
          return (
            <button
              key={moodId}
              type="button"
              onClick={() => onSelect(moodId)}
              aria-pressed="true"
              className="relative shrink-0 rounded-pill border-[1.5px] border-transparent bg-[rgba(255,255,255,0.08)] px-[16px] py-[12px] text-[16px] font-medium text-white backdrop-blur-[20px] shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:px-[24px]"
            >
              {label}
              <span
                aria-hidden="true"
                style={SELECTED_MOOD_PILL_RING_STYLE}
                className="pointer-events-none absolute inset-0 rounded-pill"
              />
            </button>
          )
        }

        return (
          <button
            key={moodId}
            type="button"
            onClick={() => onSelect(moodId)}
            aria-pressed="false"
            className="shrink-0 rounded-pill border-[1.5px] border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.08)] px-[16px] py-[12px] text-[16px] font-medium text-white backdrop-blur-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:px-[24px]"
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
