import { MOOD_IDS, type MoodId } from "../../data/moods"
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
 */
export default function PlayerMoodSelector({
  activeMood,
  onSelect,
}: {
  activeMood: MoodId
  onSelect: (mood: MoodId) => void
}) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-wrap items-center justify-center gap-[12px]">
      {MOOD_IDS.map((moodId) => {
        const isSelected = moodId === activeMood
        const label = t.vibeResult.moods[moodId].name

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
