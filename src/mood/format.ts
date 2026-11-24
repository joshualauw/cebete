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

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * A time as the text a date and time field holds, in the user's own time zone and to the
 * minute, for example "2026-11-24T09:30".
 */
export function toDateTimeFieldValue(timestamp: number): string {
  const date = new Date(timestamp)

  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** The time a date and time field holds, or NaN when the field is empty or not a real moment. */
export function fromDateTimeFieldValue(value: string): number {
  return value === '' ? Number.NaN : new Date(value).getTime()
}
