import { type Emotion, emotions } from '@/mood/emotions'
import type { MoodEntry } from '@/mood/types'
import type { ThoughtRecord } from '@/thoughts/types'

import { rangeStart } from './range'

/** How many emotions the summary lists. */
export const TOP_EMOTIONS = 5

export type EmotionCount = {
  readonly emotion: Emotion
  readonly count: number
}

export type Summary = {
  readonly moodEntries: number
  readonly thoughtRecords: number
  /** The most frequent emotions, most frequent first, at most TOP_EMOTIONS. */
  readonly topEmotions: readonly EmotionCount[]
}

type SummaryInput = {
  readonly entries: readonly MoodEntry[]
  readonly records: readonly ThoughtRecord[]
  readonly days: number
  readonly now: number
}

/**
 * Counts what happened in the last `days` days. Mood entries and thought records are placed by
 * the time they happened. Every emotion in an entry or a record counts once, so a record with
 * three feelings adds to three emotions. Ties keep the order of the emotion list, so the order
 * never jumps around.
 */
export function summarize({ entries, records, days, now }: SummaryInput): Summary {
  const start = rangeStart(now, days)
  const recent = entries.filter((entry) => entry.createdAt >= start)
  const recentRecords = records.filter((record) => record.createdAt >= start)
  const named = [...recent, ...recentRecords].flatMap((item) =>
    item.emotions.map(({ emotion }) => emotion),
  )

  const topEmotions = emotions
    .map((emotion): EmotionCount => ({
      emotion,
      count: named.filter((name) => name === emotion).length,
    }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_EMOTIONS)

  return { moodEntries: recent.length, thoughtRecords: recentRecords.length, topEmotions }
}
