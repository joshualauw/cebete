import { emotionLabel } from './emotions'
import type { EmotionRating } from './types'

const entryTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** The emotions of an entry as one phrase, for example "Anxious, Hopeful and Sad". */
export function joinEmotionLabels(ratings: readonly EmotionRating[]): string {
  const labels = ratings.map(({ emotion }) => emotionLabel(emotion))
  const last = labels.at(-1) ?? ''

  return labels.length > 1 ? `${labels.slice(0, -1).join(', ')} and ${last}` : last
}

/** When an entry was recorded, in the user's own language and time zone. */
export function formatEntryTime(timestamp: number): string {
  return entryTimeFormat.format(timestamp)
}
