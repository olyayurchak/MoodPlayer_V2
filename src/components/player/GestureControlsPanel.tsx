import { useId, useLayoutEffect, useRef, useState } from "react"
import { copy as t } from "../../content/copy"
import { spectrumGradient, type MoodSpectrum } from "../../data/playerMoodAccent"
import handOpenPalm from "../../imports/Player/hand-open-palm.png"
import handClosedFist from "../../imports/Player/hand-closed-fist.png"
import handThumb from "../../imports/Player/hand-thumb-up.png"

export type GestureEntry = {
  id: "open-palm" | "closed-fist" | "thumb-up" | "thumb-down"
  icon: string
  /** `true` flips the shared thumb-up image vertically for "thumb down" —
   *  the exact same asset-reuse the approved Figma frames themselves do
   *  (`imgHand21` reused with a `-scale-y-100` transform for the second
   *  entry), not a missing asset. */
  flipVertical?: boolean
}

export const GESTURE_ENTRIES: GestureEntry[] = [
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
// The outer toggle ring's and the active indicator's own border width —
// one literal, read by both the geometry math below and the Tailwind
// arbitrary values on the group/indicator themselves (`border-[1.5px]`,
// `-top-[1.5px]`/`-bottom-[1.5px]`), so the two can never drift apart.
// See the indicator `<span>`'s own doc comment for why the math needs
// this value at all, not just the CSS.
const TOGGLE_BORDER_WIDTH = 1.5

// The four gesture entries' own action-label text (Play/Pause/Next
// track/Previous track) reads one neutral `rgba(255,255,255,0.92)` white
// across every mood — a first, Happy-only revision briefly swapped this
// to that mood's own accent color, since reverted so this legend reads
// identically regardless of which mood is active (matching a later,
// explicit "neutral across all moods" request). The On/Off toggle
// itself, its sliding indicator, the hand icons, and the caption text
// are unaffected either way and stay exactly as they are today for
// every mood.
export default function GestureControlsPanel({
  variant = "row",
  palette,
}: {
  /** `"rail"` is the Desktop Player's narrow right-hand utility rail
   *  (Figma node `549:1331`, 108px wide): the same On/Off state and the
   *  same four gesture → action hints, stacked vertically, with the On/Off
   *  pair shown as a single knob switch (`role="switch"`) per that frame.
   *  `"row"` is the original horizontal panel (Mobile). */
  variant?: "row" | "rail"
  /** Rail only: the active mood's `PLAY_LIQUID` colours. When set, the
   *  switch's ON track is a static gradient of them (`spectrumGradient`)
   *  instead of the generic brand CTA gradient. OFF stays neutral. */
  palette?: MoodSpectrum
} = {}) {
  const [isEnabled, setIsEnabled] = useState(false)
  const railHeadingId = useId()

  // The sliding active-indicator's own measured geometry (relative to
  // `toggleGroupRef`, its positioning parent) — see the doc comment on
  // the indicator `<span>` itself below for the full reasoning. `null`
  // only for the one frame before the very first `useLayoutEffect` run
  // (the indicator is invisible then, so there's nothing to flash).
  const toggleGroupRef = useRef<HTMLDivElement>(null)
  const onButtonRef = useRef<HTMLButtonElement>(null)
  const offButtonRef = useRef<HTMLButtonElement>(null)
  const [indicatorRect, setIndicatorRect] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const group = toggleGroupRef.current
    const activeButton = (isEnabled ? onButtonRef.current : offButtonRef.current) ?? undefined
    if (!group || !activeButton) return
    const measure = () => {
      const groupBox = group.getBoundingClientRect()
      const buttonBox = activeButton.getBoundingClientRect()
      // `left`/`width` below are resolved against this positioned
      // ancestor's *padding* box (CSS's containing block for an
      // absolutely-positioned child never includes the ancestor's own
      // border), but `groupBox`/`buttonBox` here are *border*-box
      // rects (`getBoundingClientRect()`'s only mode) — so a naive
      // `buttonBox.left - groupBox.left` is already short by exactly
      // `TOGGLE_BORDER_WIDTH` on every side versus what it takes to
      // reach the group's own *border*-box edge. That's the double-
      // line bug's actual root cause: every edge of the indicator's
      // own box (and its own border, drawn inward from that box) was
      // landing one border-width *inside* the outer ring's own border,
      // leaving a visible gap between two parallel, unmerged strokes,
      // on all four sides.
      //
      // Fixed here by choosing, per side, which edge to land the
      // indicator's *border-box* on:
      // - top/bottom: always the group's own *border*-box edge — the
      //   indicator is exactly as tall as the group, so its own border
      //   physically coincides with (replaces, not doubles) the outer
      //   ring's top/bottom stroke in both states. Expressed as static
      //   `-top-[1.5px]`/`-bottom-[1.5px]` Tailwind classes below, not
      //   computed here, since it never depends on which button is
      //   active.
      // - the *outer-facing* horizontal edge (left when "On" — the
      //   first, leftmost button — is active; right when "Off" is):
      //   also the group's own border-box edge, for the same reason.
      // - the *inner-facing* horizontal edge (facing the other,
      //   inactive button): the button's own natural edge, unchanged
      //   from before this task — there's no outer ring there to
      //   conflict with, only the boundary between the two segments.
      const isOnActive = activeButton === onButtonRef.current
      const left = isOnActive
        ? -TOGGLE_BORDER_WIDTH
        : buttonBox.left - groupBox.left - TOGGLE_BORDER_WIDTH
      const width = isOnActive
        ? buttonBox.right - groupBox.left
        : groupBox.right - buttonBox.left
      setIndicatorRect({ left, width })
    }
    measure()
    // Re-measures on anything that can change either button's own
    // rendered width without `isEnabled` itself changing — a language
    // switch (`t.player.gestures.on/off` are different-length words in
    // EN vs UA) or the Desktop/Mobile breakpoint's own `lg:` padding/
    // font-size jump — so the indicator never lags behind the text it's
    // supposed to sit under.
    const observer = new ResizeObserver(measure)
    observer.observe(group)
    observer.observe(onButtonRef.current!)
    observer.observe(offButtonRef.current!)
    return () => observer.disconnect()
  }, [isEnabled])

  // Reads `t.player.gestures.action*`, not `t.player.controls.play/
  // pause/next/previous` — those `controls.*` strings are also the real
  // Play/Pause/Next/Previous buttons' own `aria-label`s (`PlayerControls.
  // tsx`), so the legend can change without changing those buttons'
  // names. See the `actionPlay`/etc. doc comment in `content/copy.ts`.
  const gestureLabels: Record<GestureEntry["id"], { caption: string; action: string }> = {
    "open-palm": { caption: t.player.gestures.openPalm, action: t.player.gestures.actionPlay },
    "closed-fist": { caption: t.player.gestures.closedFist, action: t.player.gestures.actionPause },
    "thumb-up": { caption: t.player.gestures.thumbUp, action: t.player.gestures.actionNext },
    "thumb-down": { caption: t.player.gestures.thumbDown, action: t.player.gestures.actionPrevious },
  }

  if (variant === "rail") {
    return (
      <div
        role="group"
        aria-labelledby={railHeadingId}
        className="flex size-full flex-col items-center gap-[20px] rounded-[24px] bg-[rgba(255,255,255,0.08)] px-[8px] py-[20px] backdrop-blur-[20px]"
      >
        <p id={railHeadingId} className="text-center text-[18px] font-medium leading-[1.25] text-white">
          {t.player.gestures.heading}
        </p>

        <div className="flex flex-col items-center gap-[6px]">
          {/* Same `isEnabled` state as the row variant's On/Off pair. When
              on, the track is the mood's static `palette` gradient (or the
              brand CTA gradient tokens without one); off stays neutral. */}
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            aria-labelledby={railHeadingId}
            onClick={() => setIsEnabled((on) => !on)}
            style={isEnabled && palette ? { backgroundImage: spectrumGradient(palette, 1, 90) } : undefined}
            className={`relative h-[40px] w-[80px] shrink-0 rounded-pill border-[1.5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              isEnabled
                ? `border-transparent shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)] ${
                    palette ? "" : "bg-linear-to-r from-cta-button-from via-cta-button-via to-cta-button-to"
                  }`
                : "border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.08)]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-1/2 left-[3.5px] size-[30px] -translate-y-1/2 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-out motion-reduce:transition-none ${
                isEnabled ? "translate-x-[40px]" : "translate-x-0"
              }`}
            />
          </button>
          <span aria-hidden="true" className="text-[16px] font-medium text-white">
            {isEnabled ? t.player.gestures.on : t.player.gestures.off}
          </span>
        </div>

        <ul className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[22px]">
          {GESTURE_ENTRIES.map((entry) => {
            const labels = gestureLabels[entry.id]
            return (
              <li key={entry.id} className="flex w-full flex-col items-center gap-[4px] text-center">
                <img
                  src={entry.icon}
                  alt=""
                  className={`size-[32px] shrink-0 object-cover opacity-60 ${entry.flipVertical ? "-scale-y-100" : ""}`}
                />
                <p className="text-[10px] font-light leading-[1.2] text-[#cfcfcf]">{labels.caption}</p>
                <p className="text-[12px] font-medium leading-[1.2] text-white">{labels.action}</p>
              </li>
            )
          })}
        </ul>
      </div>
    )
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
        ref={toggleGroupRef}
        role="group"
        aria-label={t.player.gestures.heading}
        className="relative flex shrink-0 items-center rounded-pill border-[1.5px] border-[rgba(255,255,255,0.25)]"
      >
        {/* Active-state identification, round three: a single sliding
            indicator, replacing round two's "each button toggles its own
            border/bg/shadow in place" approach (which this task's own
            brief explicitly asks to replace with exactly this — round
            two's own doc comment called a sliding indicator out as "a
            major component refactor" and deferred it; this task is that
            refactor, requested directly, so it's now built).

            This absolutely-positioned `<span>` — not either `<button>` —
            now owns the border/bg/shadow that used to toggle in place on
            whichever button was active: the exact same values (`border-
            [1.5px] border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,
            0.08)] shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)]`) as
            round two's own active state, per this task's explicit "border
            styling/opacity/active colors must stay unchanged" — only
            *which element* paints them changed, not their values. It
            sits behind both buttons (`z-0` vs. their own `relative
            z-10`) and is `aria-hidden`/`pointer-events-none` — purely
            decorative, never a hit target, never announced; `aria-
            pressed` on the real buttons below is still what actually
            communicates state.

            Round four removed this border entirely to kill the "double
            outline" it caused. Round five (this task) restores it, but
            fixes the actual geometry bug that caused the double line in
            the first place, rather than removing the border again: see
            the `useLayoutEffect` above's own doc comment for the full
            "border-box vs. padding-box" reasoning. `-top-[1.5px] -bottom-
            [1.5px]` (replacing round three's `inset-y-0`) put the
            indicator's own border-box top/bottom exactly on the outer
            ring's own border-box top/bottom in both states — always
            flush, never doubled. The left/right side of that same flush
            treatment is conditional (computed in JS, not a static
            class, since it depends on which button is active) — see
            `indicatorRect`'s own values above.

            Its `left`/`width` come from `indicatorRect` (measured via the
            `useLayoutEffect` above, against whichever button is currently
            active) and transition on `left`/`width` change — a real
            slide from one button's position/size to the other's, not two
            elements independently fading in/out. `duration-[200ms]
            ease-out` is this task's own requested "~180–220ms"/"ease-out"
            pairing (the midpoint) — unchanged by either the round-four
            border removal or this round's restoration. No scale/opacity/
            glow/bounce is animated — only position and size, per this
            task's explicit "no scale, no glow, no overshoot" list.
            Renders with `opacity-0` until the first measurement lands
            (`indicatorRect` starts `null`), so there's no flash at an
            unmeasured `0,0` origin on first mount. */}
        <span
          aria-hidden="true"
          className="gesture-toggle-indicator pointer-events-none absolute -top-[1.5px] -bottom-[1.5px] z-0 rounded-pill border-[1.5px] border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.08)] shadow-[0px_12px_24px_0px_rgba(255,255,255,0.08)] transition-[left,width] duration-[200ms] ease-out"
          style={
            indicatorRect
              ? { left: `${indicatorRect.left}px`, width: `${indicatorRect.width}px` }
              : { left: 0, width: 0, opacity: 0 }
          }
        />
        {/* A measured audit found each On/Off button's real hit area was
            only ~35.5px tall on Mobile (`py-[8px]` plus the `text-[13px]`
            line) — under the ~44px iOS ergonomic baseline. Fixed with the
            same invisible `before:` pseudo-element technique
            the former language switcher/`MoodPlayerLogo.tsx`/
            `MobileUpNextSheet.tsx` already use, not a real padding
            increase: a real `py` increase would grow this pill's own
            layout box, which (being a flex sibling of the four gesture
            columns in the same single row) would grow the whole Gesture
            Controls panel's height to match — this component's own doc
            comment already documents how easily that row's height moves
            when any cell's own content grows.
            Growth here is vertical-only (`before:-top-[5px] before:-bottom-
            [5px]`), taking real 35.5px to an effective ~45.5px: On and
            Off already touch directly (`gap-x-0` in the shared
            `toggleGroupRef` group — confirmed via measurement, not
            assumed), so any *horizontal* growth on either button's inward-
            facing edge would immediately overlap the other's hit region;
            left/right stay at the button's own edges (`before:inset-x-0`,
            no negative inset) to avoid that entirely, since the task's own
            audit only flagged height, not width. Vertical growth has no
            such neighbor — On/Off are the only two buttons in this row —
            and the toggle sits vertically centered inside a taller
            (~93.6px) panel with ~29px of clearance above/below it before
            the panel's own edge, so 5px each side lands nowhere near a
            clip. Both buttons already carry `relative`, so no `position`
            change was needed to add the pseudo-element.
            `lg:before:top-0 lg:before:bottom-0` resets that vertical
            growth to nothing at Desktop widths: Desktop's own real button
            is already 44px tall there (`lg:py-[10px]` plus `lg:text-
            [16px]`), so this fix is Mobile-only by design — without this
            reset the same unscoped inset would have silently grown
            Desktop's already-sufficient hit area to ~54px too, which
            this task's own "Desktop must remain unaffected" scope
            explicitly rules out, even though it would have stayed
            invisible there. */}
        <button
          ref={onButtonRef}
          type="button"
          onClick={() => setIsEnabled(true)}
          aria-pressed={isEnabled}
          className="relative z-10 rounded-pill px-[10px] py-[8px] text-[13px] font-medium text-white before:absolute before:inset-x-0 before:-top-[5px] before:-bottom-[5px] before:content-[''] lg:before:top-0 lg:before:bottom-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:px-[24px] lg:py-[10px] lg:text-[16px]"
        >
          {t.player.gestures.on}
        </button>
        <button
          ref={offButtonRef}
          type="button"
          onClick={() => setIsEnabled(false)}
          aria-pressed={!isEnabled}
          className="relative z-10 rounded-pill px-[10px] py-[8px] text-[13px] font-medium text-white before:absolute before:inset-x-0 before:-top-[5px] before:-bottom-[5px] before:content-[''] lg:before:top-0 lg:before:bottom-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:px-[24px] lg:py-[10px] lg:text-[16px]"
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
                  made here rather than accept that. Weight unchanged;
                  color is a later, explicit "neutral across all moods"
                  request — `rgba(255,255,255,0.92)` for every mood,
                  replacing both the original universal Active Accent
                  (`#d8b9ff`) and a since-reverted Happy-only accent
                  override that briefly lived here (see this component's
                  own top-level doc comment). */}
              <p className="w-full text-center text-[9px] font-medium leading-[1.2] text-[rgba(255,255,255,0.92)] lg:w-auto lg:whitespace-nowrap lg:text-[13px]">
                {labels.action}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
