/**
 * MoodPlayer's exactly-three playlist modes (Guidelines §2). Kept as its
 * own tiny module — not folded into `localization/translations.ts` — since
 * it's identifier/ordering data, not copy: the mood-suggestion pipeline,
 * the manual mood-selector UI, and the translation dictionary all need to
 * agree on the same three ids and the same display order, independent of
 * which language is active.
 */
export type MoodId = "happy" | "melancholic" | "chill"

/** Display order for the manual mood-selector pills — matches the
 *  approved Figma frames (`284:2584` Desktop, `289:6988` Mobile), left to
 *  right: Happy, Melancholic, Chill. */
export const MOOD_IDS: readonly MoodId[] = ["happy", "melancholic", "chill"]
