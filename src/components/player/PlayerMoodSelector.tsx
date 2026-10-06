import { MOOD_IDS, type MoodId } from "../../data/moods"
import { PLAYER_SPECTRUM, spectrumGradient, type PlayerMoodAccent } from "../../data/playerMoodAccent"
import { copy as t } from "../../content/copy"
import { MoodIcon } from "./moodIcons"

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
  /** `"column"` is the Desktop Choose Vibe menu (`ChooseVibeCard.tsx`):
   *  Figma `582:964` rows — mood icon + label, 136×42, 8px radius — with
   *  the same `aria-pressed` buttons and selected accent ring as the pills.
   *  `"row"` is the original pill layout (Mobile).
   *  `"popover"` is the Mobile Choose Vibe popover
   *  (`MobileChooseVibePopover.tsx`): the same rows as `"column"` (glass
   *  fill, faint border, 8px radius, `#cfcfcf` label, 1px mood-spectrum ring
   *  on the selected one) at touch size — full width, 48px tall, 14px label,
   *  and the mood icon at the same visible size as the mobile Vibe trigger's
   *  (34px box, −3px sides over the icon's built-in empty space ≈ 28px of
   *  artwork). */
  orientation?: "row" | "column" | "popover"
}) {
  if (orientation === "popover") {
    return (
      <div className="flex w-full flex-col items-stretch gap-[8px]">
        {MOOD_IDS.map((moodId) => {
          const isSelected = moodId === activeMood
          return (
            <button
              key={moodId}
              type="button"
              onClick={() => onSelect(moodId)}
              aria-pressed={isSelected}
              className={`relative flex h-[48px] w-full shrink-0 items-center gap-[8px] rounded-[8px] border bg-[rgba(255,255,255,0.08)] px-[12px] text-left text-[14px] font-medium leading-[1.2] text-[#cfcfcf] transition-colors duration-200 hover:bg-[rgba(255,255,255,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                isSelected ? "border-transparent" : "border-[rgba(255,255,255,0.06)]"
              }`}
            >
              <MoodIcon mood={moodId} size={34} className="-mx-[3px] shrink-0" />
              <span className="whitespace-nowrap">{t.vibeResult.moods[moodId].name}</span>
              {isSelected && (
                <span
                  aria-hidden="true"
                  style={{ ...SELECTED_MOOD_PILL_RING_STYLE, padding: "1px", background: spectrumGradient(PLAYER_SPECTRUM[activeMood], 0.55) }}
                  className="pointer-events-none absolute inset-0 rounded-[8px]"
                />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  if (orientation === "column") {
    return (
      <div className="flex flex-col items-stretch gap-[12px]">
        {MOOD_IDS.map((moodId) => {
          const isSelected = moodId === activeMood
          return (
            <button
              key={moodId}
              type="button"
              onClick={() => onSelect(moodId)}
              aria-pressed={isSelected}
              className={`relative flex h-[42px] w-[136px] shrink-0 items-center gap-[4px] rounded-[8px] border bg-[rgba(255,255,255,0.08)] px-[12px] py-[4px] text-left text-[12px] font-medium leading-[1.2] text-[#cfcfcf] backdrop-blur-[20px] transition-colors duration-200 hover:bg-[rgba(255,255,255,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                isSelected ? "border-transparent" : "border-[rgba(255,255,255,0.06)]"
              }`}
            >
              <MoodIcon mood={moodId} size={32} className="shrink-0" />
              <span className="whitespace-nowrap">{t.vibeResult.moods[moodId].name}</span>
              {isSelected && (
                <span
                  aria-hidden="true"
                  style={{ ...SELECTED_MOOD_PILL_RING_STYLE, padding: "1px", background: spectrumGradient(PLAYER_SPECTRUM[activeMood], 0.55) }}
                  className="pointer-events-none absolute inset-0 rounded-[8px]"
                />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-[12px]">
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
