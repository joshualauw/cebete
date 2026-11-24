import type { Emotion } from './emotions'

/** Lowest and highest rating. Whole numbers from 0 to 10 are quick to give on a phone. */
export const INTENSITY_MIN = 0
export const INTENSITY_MAX = 10
/** Where a rating starts, so a valid one is always chosen. */
export const INTENSITY_DEFAULT = 5

/** The most emotions one entry can hold. It keeps the form short on a phone. */
export const MAX_EMOTIONS = 3

/** The longest note a mood entry can carry. Notes are meant to be short. */
export const NOTE_MAX_LENGTH = 500

/**
 * An emotion and how strongly it is felt. This small shape stands on its own so later
 * modules, such as the thought record, can reuse it without any data migration.
 */
export type EmotionRating = {
  readonly emotion: Emotion
  /** A whole number from INTENSITY_MIN to INTENSITY_MAX. */
  readonly intensity: number
}

/** The content of an entry: what the user chooses, without the time it was recorded. */
export type NewMoodEntry = {
  /** One to MAX_EMOTIONS ratings, none repeating an emotion, in the order they were chosen. */
  readonly emotions: readonly EmotionRating[]
  readonly note?: string
}

/** What a caller provides when adding an entry: its content, and optionally when it happened. */
export type NewMoodEntryInput = NewMoodEntry & {
  /** When the feeling happened. Left out, the entry is stamped with the moment it is saved. */
  readonly createdAt?: number
}

/** What a caller provides when editing an entry: everything in it, including the recorded time. */
export type MoodEntryChanges = NewMoodEntry & {
  /** When the entry was recorded, in milliseconds since 1970. It cannot be in the future. */
  readonly createdAt: number
}

/** A saved mood entry. */
export type MoodEntry = NewMoodEntry & {
  readonly id: number
  /** When the entry was saved, in milliseconds since 1970. Set automatically on save. */
  readonly createdAt: number
}
