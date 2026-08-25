import { useState } from "react"
import { useLanguage } from "../../localization/LanguageContext"
import handOpenPalm from "../../imports/Player/hand-open-palm.png"
import handClosedFist from "../../imports/Player/hand-closed-fist.png"
import handThumb from "../../imports/Player/hand-thumb-up.png"

type GestureEntry = {
  id: "open-palm" | "closed-fist" | "thumb-up" | "thumb-down"
  icon: string
  /** `true` flips the shared thumb-up image vertically for "thumb down" —
   *  the exact same asset-reuse the approved Figma frames themselves do
   *  (`imgHand21` reused with a `-scale-y-100` transform for the second
   *  entry), not a missing asset. */
  flipVertical?: boolean
}

const GESTURE_ENTRIES: GestureEntry[] = [
  { id: "open-palm", icon: handOpenPalm },
  { id: "closed-fist", icon: handClosedFist },
  { id: "thumb-up", icon: handThumb },
  { id: "thumb-down", icon: handThumb, flipVertical: true },
]

/**
 * The gesture-controls legend block from the approved Figma frames — an
 * On/Off toggle plus four hand-gesture → action mappings (Open palm →
 * Play, Closed fist → Pause, Thumb up → Next track, Thumb down →
 * Previous track).
 *
 * UI foundation only, exactly per this task's scope:
 * - the camera is never activated by anything in this component;
 * - no MediaPipe/hand-tracking/gesture-recognition code exists here or is
 *   referenced by it;
 * - no gesture command logic exists — the four entries below are a
 *   static legend, not live-detected states.
 *
 * The On/Off control is a real, working local UI toggle (`isEnabled`
 * state, `aria-pressed`, keyboard-operable) rather than two inert-looking
 * buttons — but it does not enable anything real yet, since gesture
 * recognition itself doesn't exist in this codebase (Guidelines §9 lists
 * `disabled` as one of gesture control's own required states, which is
 * exactly what this defaults to: `isEnabled` starts `false`/"Off", never
 * pre-selecting "On" the way the Figma mock happens to show it, so this
 * never visually claims a capability that isn't actually wired). Flipping
 * it only changes which of the two pill halves looks active; per this
 * task's explicit instruction ("Do not make intentionally UI-only
 * controls trigger unrelated functionality"), it deliberately does *not*
 * request camera access or start/stop anything.
 *
 * Hand images are the exact Figma-exported gesture illustrations
 * (`imports/Player/hand-*.png`) — these are specific illustrative content,
 * not generic glyphs, so they're reused verbatim rather than hand-redrawn
 * (unlike the five transport-control icons in `icons.tsx`, which *are*
 * generic enough to author inline — see that file's own doc comment).
 * Desktop/Mobile Figma frames exported byte-identical images for these at
 * two different display sizes (previously 28px Mobile / 32px Desktop here;
 * see the sizing note below for why Mobile's own size shrank further) —
 * one shared asset per gesture, sized responsively here, rather than two
 * separate files with identical bytes.
 *
 * Mobile layout — matches the approved Figma frame's own single-row
 * composition (On/Off toggle + all four gesture entries side by side, one
 * row, ~60px tall) rather than the taller two-row stack this component
 * used before this task: the outer container is now always `flex-row`
 * (previously `flex-col` on Mobile, `lg:flex-row` on Desktop — Figma's own
 * Mobile frame was never actually a stacked layout, this was a mismatch
 * corrected here). The four gesture cells are always `flex-nowrap`
 * (previously `flex-wrap` below `lg`, which is exactly what let the fourth
 * entry — "Thumb down / Previous track", the longest pair of labels —
 * overflow onto its own second row and inflate the panel's height). What
 * changes per breakpoint now is only size, never row structure: smaller
 * icon (20px vs Desktop's still-32px), smaller caption/action type, and —
 * the key fix — Mobile's caption/action labels are allowed to wrap onto a
 * second *text* line within their own narrow cell (`whitespace-nowrap` is
 * `lg:`-only now) instead of forcing the whole row wider than the 430px
 * frame can hold. Desktop is intentionally untouched beyond that same
 * `lg:` escape hatch preserving its previous exact sizing.
 */
export default function GestureControlsPanel() {
  const { t } = useLanguage()
  const [isEnabled, setIsEnabled] = useState(false)

  // Reads `t.player.gestures.action*`, not `t.player.controls.play/
  // pause/next/previous` — those `controls.*` strings are also the real
  // Play/Pause/Next/Previous buttons' own `aria-label`s (`PlayerControls.
  // tsx`), and a shortened-Ukrainian-only change to this legend must not
  // also shorten those buttons' Ukrainian `aria-label`s. See the
  // `actionPlay`/etc. doc comment in `translations.ts` for the full
  // reasoning.
  const gestureLabels: Record<GestureEntry["id"], { caption: string; action: string }> = {
    "open-palm": { caption: t.player.gestures.openPalm, action: t.player.gestures.actionPlay },
    "closed-fist": { caption: t.player.gestures.closedFist, action: t.player.gestures.actionPause },
    "thumb-up": { caption: t.player.gestures.thumbUp, action: t.player.gestures.actionNext },
    "thumb-down": { caption: t.player.gestures.thumbDown, action: t.player.gestures.actionPrevious },
  }

  return (
    <div
      // `gap-[*]` here is the only spacing between this row's two
      // children — the On/Off toggle group and the gesture-instructions
      // row — so it's exactly "the distance between the toggle and
      // Open palm/Play" this task asks to reduce. Desktop's `lg:gap-[32px]`
      // (the one that read as too large) is now `lg:gap-[12px]`, a 20px
      // reduction, within this task's own suggested "~16–24px less"
      // range. Mobile's `gap-[8px]` is untouched — it was already tight,
      // never the gap this task called out, and dropping it further would
      // start crowding the toggle against the four gesture columns
      // instead. Neither the inner gesture row's own `gap-x-[2px] lg:
      // gap-x-0` (the spacing *between* the four columns) nor this
      // container's own `p-[12px] lg:p-[24px]` padding/dimensions changed.
      className="flex w-full flex-row items-center gap-[8px] rounded-[24px] bg-[rgba(255,255,255,0.08)] p-[12px] backdrop-blur-[20px] lg:gap-[12px] lg:p-[24px]"
      aria-label={t.player.gestures.heading}
    >
      <div
        role="group"
        aria-label={t.player.gestures.heading}
        className="flex shrink-0 items-center rounded-pill border-[1.5px] border-[rgba(255,255,255,0.25)]"
      >
        <button
          type="button"
          onClick={() => setIsEnabled(true)}
          aria-pressed={isEnabled}
          className={`rounded-pill px-[10px] py-[8px] text-[13px] font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:px-[24px] lg:py-[10px] lg:text-[16px] ${
            isEnabled ? "border-[1.5px] border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.08)] shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)]" : ""
          }`}
        >
          {t.player.gestures.on}
        </button>
        <button
          type="button"
          onClick={() => setIsEnabled(false)}
          aria-pressed={!isEnabled}
          className={`rounded-pill px-[10px] py-[8px] text-[13px] font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:px-[24px] lg:py-[10px] lg:text-[16px] ${
            !isEnabled ? "border-[1.5px] border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.08)] shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)]" : ""
          }`}
        >
          {t.player.gestures.off}
        </button>
      </div>

      {/* Always one row (`flex-nowrap`, never `flex-wrap`) — see this
          file's own doc comment on why that's the actual fix, not just a
          size reduction. `min-w-0` on the row and `min-w-0`/no
          `whitespace-nowrap` on each cell below `lg` is what lets a long
          label wrap onto its own second *text* line instead of forcing
          the row itself wider than the 430px Mobile frame. */}
      <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-between gap-x-[2px] lg:gap-x-0">
        {GESTURE_ENTRIES.map((entry, index) => {
          const labels = gestureLabels[entry.id]
          return (
            <div
              key={entry.id}
              className={`flex min-w-0 flex-1 flex-col items-center gap-[2px] px-[2px] lg:flex-none lg:gap-[4px] lg:px-[20px] ${
                index > 0 ? "border-l border-[rgba(255,255,255,0.2)]" : ""
              }`}
            >
              <img
                src={entry.icon}
                alt=""
                className={`size-[20px] shrink-0 object-cover opacity-60 lg:size-[32px] ${entry.flipVertical ? "-scale-y-100" : ""}`}
              />
              {/* Secondary gesture caption ("Open palm"/"Closed fist"/
                  "Thumb up"/"Thumb down") — bumped from `#cfcfcf` to
                  `#b3b5be` per an earlier task's explicit contrast request
                  (an equivalent solid neutral light-gray to the
                  requested `rgba(255,255,255,0.65)`, since this text
                  reads a flat hex color rather than a translucent one;
                  no existing project token sits close to that value —
                  `--color-text-secondary` is `#f1f1f1`, far too bright
                  for this small, deliberately-secondary caption).
                  Font size bumped again by this task: 10px → 12px on
                  Desktop (`lg:`, within the requested "~11–12px" range;
                  desktop's `whitespace-nowrap` + generous `lg:px-[20px]`
                  cell keep every label on one line at this size, verified
                  in-browser). Mobile only went 9px → 10px, short of that
                  same range — the Mobile row's cells are a fixed
                  `flex-1` split of the 382px frame (~66px each, per this
                  task's own "do not change column widths"), and
                  measuring the actual rendered box height (not just
                  character count) shows this cell's own longest caption,
                  "Thumb down", is already right at its own one-line limit
                  at 10px (`~10.5px` is where it starts wrapping) — 11px
                  reliably wraps it to two lines. Weight/color/spacing and
                  the action label's own color (`text-[#d8b9ff]`)
                  unchanged. */}
              <p className="w-full text-center text-[10px] font-light leading-[1.2] text-[#b3b5be] lg:w-auto lg:whitespace-nowrap lg:text-[12px]">
                {labels.caption}
              </p>
              {/* Action label ("Play"/"Pause"/"Next track"/"Previous
                  track") — font size bumped by this task on Desktop only
                  (12px → 13px, matching the requested "~13px" target;
                  same nowrap/width safety as the caption above). Mobile
                  stays at 9px, unchanged: this cell's own longest action
                  label, "Previous track", is already at its one-line
                  limit at the current 9px — even 9.5px reliably wraps it
                  to two lines in this fixed-width cell, which measured
                  ~48% taller for the whole gesture panel (69.6px → 103px)
                  once both labels in that one cell wrapped — well past
                  this task's own "do not... noticeably increase the
                  gesture panel height" limit, so no Mobile change was
                  made here rather than accept that. Weight/color
                  unchanged. */}
              <p className="w-full text-center text-[9px] font-medium leading-[1.2] text-[#d8b9ff] lg:w-auto lg:whitespace-nowrap lg:text-[13px]">
                {labels.action}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
