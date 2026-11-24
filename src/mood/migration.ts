import { isEmotion } from './emotions'
import { INTENSITY_MAX, INTENSITY_MIN } from './types'

/** The old rating went from 0 to 100, ten times the new 0 to 10 scale. */
const OLD_SCALE_FACTOR = 10

/**
 * Brings one stored mood entry from the old layout (a single emotion with a 0 to 100
 * intensity) to the new one (a list of emotions, each with a 0 to 10 rating).
 *
 * The id, note and time are kept as they are. The rating is divided by 10 and rounded, then
 * kept inside 0 to 10. Anything it does not recognise as an old entry, whether it is already
 * converted or damaged, is returned untouched and never thrown at: this runs while the
 * database opens, and a failure here would stop the whole app from starting.
 */
export function convertLegacyEntry(row: unknown): unknown {
  if (typeof row !== 'object' || row === null || 'emotions' in row) {
    return row
  }

  const emotion = 'emotion' in row ? row.emotion : undefined
  const intensity = 'intensity' in row ? row.intensity : undefined

  if (!isEmotion(emotion) || typeof intensity !== 'number' || !Number.isFinite(intensity)) {
    return row
  }

  const rating = Math.min(
    Math.max(Math.round(intensity / OLD_SCALE_FACTOR), INTENSITY_MIN),
    INTENSITY_MAX,
  )
  const kept = Object.entries(row).filter(([key]) => key !== 'emotion' && key !== 'intensity')

  return { ...Object.fromEntries(kept), emotions: [{ emotion, intensity: rating }] }
}
