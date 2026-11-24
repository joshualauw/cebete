import { isEmotion } from './emotions'
import {
  type EmotionRating,
  INTENSITY_MAX,
  INTENSITY_MIN,
  MAX_EMOTIONS,
  type MoodEntry,
  type MoodEntryChanges,
  type NewMoodEntry,
  NOTE_MAX_LENGTH,
} from './types'

export type InvalidMoodEntryField = 'entry' | 'emotions' | 'intensity' | 'note' | 'time'

/** Thrown when an entry breaks a rule. Nothing is saved when this happens. */
export class InvalidMoodEntryError extends Error {
  readonly field: InvalidMoodEntryField

  constructor(field: InvalidMoodEntryField, message: string) {
    super(message)
    this.name = 'InvalidMoodEntryError'
    this.field = field
  }
}

function validateRating(input: unknown): EmotionRating {
  if (typeof input !== 'object' || input === null) {
    throw new InvalidMoodEntryError('emotions', 'Each emotion needs a name and a rating.')
  }

  const emotion = 'emotion' in input ? input.emotion : undefined
  const intensity = 'intensity' in input ? input.intensity : undefined

  if (!isEmotion(emotion)) {
    throw new InvalidMoodEntryError('emotions', 'Choose emotions from the list.')
  }

  if (
    typeof intensity !== 'number' ||
    !Number.isInteger(intensity) ||
    intensity < INTENSITY_MIN ||
    intensity > INTENSITY_MAX
  ) {
    throw new InvalidMoodEntryError(
      'intensity',
      `Each rating must be a whole number from ${String(INTENSITY_MIN)} to ${String(INTENSITY_MAX)}.`,
    )
  }

  return { emotion, intensity }
}

/**
 * Checks an entry against the rules and returns a clean copy of it. It accepts `unknown`
 * because entries can come from anywhere (a form today, an import later), and it builds the
 * result from the checked fields only, so nothing unexpected, such as a time, gets through.
 */
export function validateNewMoodEntry(input: unknown): NewMoodEntry {
  if (typeof input !== 'object' || input === null) {
    throw new InvalidMoodEntryError('entry', 'A mood entry must be an object.')
  }

  const emotions = 'emotions' in input ? input.emotions : undefined
  const note = 'note' in input ? input.note : undefined

  if (!Array.isArray(emotions)) {
    throw new InvalidMoodEntryError('emotions', 'Choose at least one emotion.')
  }

  const candidates: readonly unknown[] = emotions

  if (candidates.length < 1 || candidates.length > MAX_EMOTIONS) {
    throw new InvalidMoodEntryError(
      'emotions',
      `Choose between 1 and ${String(MAX_EMOTIONS)} emotions.`,
    )
  }

  const ratings = candidates.map(validateRating)

  if (new Set(ratings.map((rating) => rating.emotion)).size !== ratings.length) {
    throw new InvalidMoodEntryError('emotions', 'Each emotion can be chosen only once.')
  }

  if (note !== undefined && typeof note !== 'string') {
    throw new InvalidMoodEntryError('note', 'The note must be text.')
  }

  const trimmedNote = note?.trim()

  if (trimmedNote !== undefined && trimmedNote.length > NOTE_MAX_LENGTH) {
    throw new InvalidMoodEntryError(
      'note',
      `The note can be at most ${String(NOTE_MAX_LENGTH)} characters.`,
    )
  }

  // An empty note is no note: it is left out instead of being saved as an empty string.
  return trimmedNote ? { emotions: ratings, note: trimmedNote } : { emotions: ratings }
}

/**
 * Checks the time an entry was recorded: it must be a real moment and cannot be in the future.
 */
export function validateRecordedTime(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidMoodEntryError('time', 'Choose a valid date and time.')
  }

  if (value > Date.now()) {
    throw new InvalidMoodEntryError('time', 'The date and time cannot be in the future.')
  }

  return value
}

/**
 * Checks an edited entry: the same rules as a new one, plus its recorded time, which must be a
 * real moment and cannot be in the future. Returns a clean copy built from the checked fields.
 */
export function validateMoodEntryChanges(input: unknown): MoodEntryChanges {
  const entry = validateNewMoodEntry(input)
  const createdAt = validateRecordedTime(
    typeof input === 'object' && input !== null && 'createdAt' in input
      ? input.createdAt
      : undefined,
  )

  return { ...entry, createdAt }
}

/**
 * Tells whether something read back from storage is a complete, valid mood entry. Anything
 * else, such as a damaged row, is left out of the list instead of breaking it.
 */
export function isMoodEntry(value: unknown): value is MoodEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  if (!('id' in value) || typeof value.id !== 'number') {
    return false
  }

  if (!('createdAt' in value) || typeof value.createdAt !== 'number') {
    return false
  }

  try {
    validateNewMoodEntry(value)
  } catch (error) {
    if (error instanceof InvalidMoodEntryError) {
      return false
    }
    throw error
  }

  return true
}
