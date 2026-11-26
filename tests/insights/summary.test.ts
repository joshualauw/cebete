import { describe, expect, it } from 'vitest'

import { rangeStart } from '@/insights/range'
import { summarize, type Summary, TOP_EMOTIONS } from '@/insights/summary'
import type { MoodEntry } from '@/mood/types'
import type { ThoughtRecord } from '@/thoughts/types'
import { localMoment, moodEntryAt, thoughtRecordAt } from '@tests/helpers/insights'

const NOW = localMoment(2026, 6, 10, 15, 30)
const START_7 = rangeStart(NOW, 7)
const START_30 = rangeStart(NOW, 30)

function week(entries: readonly MoodEntry[] = [], records: readonly ThoughtRecord[] = []): Summary {
  return summarize({ entries, records, days: 7, now: NOW })
}

describe('summarize: counting entries and records', () => {
  it('counts mood entries and thought records separately', () => {
    const summary = week(
      [moodEntryAt(NOW, ['calm']), moodEntryAt(NOW - 1000, ['sad'])],
      [thoughtRecordAt(NOW - 2000, ['anxious'])],
    )

    expect(summary.moodEntries).toBe(2)
    expect(summary.thoughtRecords).toBe(1)
  })

  it('has nothing to report when nothing was logged', () => {
    expect(week()).toEqual({ moodEntries: 0, thoughtRecords: 0, topEmotions: [] })
  })

  it('places an entry or a record by the time it happened', () => {
    const summary = week([moodEntryAt(START_7, ['calm'])], [thoughtRecordAt(START_7 + 1, ['sad'])])

    expect(summary.moodEntries).toBe(1)
    expect(summary.thoughtRecords).toBe(1)
  })

  it('includes the first moment of the range and leaves out the moment before it', () => {
    const summary = week([moodEntryAt(START_7, ['calm'], 1), moodEntryAt(START_7 - 1, ['sad'], 2)])

    expect(summary.moodEntries).toBe(1)
    expect(summary.topEmotions).toEqual([{ emotion: 'calm', count: 1 }])
  })

  it('includes everything from today, however late, since nothing can have happened later', () => {
    const summary = week([moodEntryAt(NOW + 60 * 60 * 1000, ['calm'])])

    expect(summary.moodEntries).toBe(1)
  })

  it('places a thought record by the time it happened, not the time it was written up', () => {
    const summary = week([], [thoughtRecordAt(localMoment(2026, 6, 6), ['sad'])])

    expect(summary.thoughtRecords).toBe(1)
  })
})

describe('summarize: the range', () => {
  const tenDaysAgo = localMoment(2026, 5, 31)
  const entries = [moodEntryAt(NOW, ['calm'], 1), moodEntryAt(tenDaysAgo, ['calm', 'sad'], 2)]

  it('leaves out what is older than 7 days, for a range of 7 days', () => {
    expect(summarize({ entries, records: [], days: 7, now: NOW }).moodEntries).toBe(1)
  })

  it('takes in the same entry for a range of 30 days', () => {
    const summary = summarize({ entries, records: [], days: 30, now: NOW })

    expect(summary.moodEntries).toBe(2)
    expect(summary.topEmotions).toEqual([
      { emotion: 'calm', count: 2 },
      { emotion: 'sad', count: 1 },
    ])
  })

  it('leaves out what is older than 30 days, for a range of 30 days', () => {
    const old = [moodEntryAt(START_30 - 1, ['calm'])]

    expect(summarize({ entries: old, records: [], days: 30, now: NOW }).moodEntries).toBe(0)
  })
})

describe('summarize: the most frequent emotions', () => {
  it('counts every emotion in an entry or a record once', () => {
    const summary = week([], [thoughtRecordAt(NOW, ['anxious', 'sad', 'tired'])])

    expect(summary.topEmotions).toEqual([
      { emotion: 'tired', count: 1 },
      { emotion: 'sad', count: 1 },
      { emotion: 'anxious', count: 1 },
    ])
  })

  it('adds up the same emotion across entries and records', () => {
    const summary = week(
      [moodEntryAt(NOW, ['anxious']), moodEntryAt(NOW - 1, ['anxious', 'calm'])],
      [thoughtRecordAt(NOW - 2, ['anxious'])],
    )

    expect(summary.topEmotions).toEqual([
      { emotion: 'anxious', count: 3 },
      { emotion: 'calm', count: 1 },
    ])
  })

  it('lists the most frequent first', () => {
    const summary = week([
      moodEntryAt(NOW, ['sad']),
      moodEntryAt(NOW - 1, ['happy']),
      moodEntryAt(NOW - 2, ['happy']),
      moodEntryAt(NOW - 3, ['happy']),
      moodEntryAt(NOW - 4, ['sad']),
    ])

    expect(summary.topEmotions.map(({ emotion }) => emotion)).toEqual(['happy', 'sad'])
  })

  it('keeps ties in the order of the emotion list, so the order is stable', () => {
    const summary = week([moodEntryAt(NOW, ['angry', 'calm', 'tired', 'happy'])])

    expect(summary.topEmotions.map(({ emotion }) => emotion)).toEqual([
      'calm',
      'happy',
      'tired',
      'angry',
    ])
  })

  it('gives the same order however the entries are arranged', () => {
    const entries = [
      moodEntryAt(NOW, ['angry', 'calm']),
      moodEntryAt(NOW - 1, ['sad', 'happy']),
      moodEntryAt(NOW - 2, ['lonely']),
    ]

    expect(week(entries).topEmotions).toEqual(week([...entries].reverse()).topEmotions)
  })

  it('lists at most five, and keeps the most frequent when it must cut', () => {
    const summary = week([
      moodEntryAt(NOW, ['calm', 'happy', 'grateful', 'hopeful', 'content', 'tired', 'sad']),
      moodEntryAt(NOW - 1, ['sad', 'tired']),
      moodEntryAt(NOW - 2, ['sad']),
    ])

    expect(TOP_EMOTIONS).toBe(5)
    expect(summary.topEmotions).toHaveLength(5)
    expect(summary.topEmotions.slice(0, 2)).toEqual([
      { emotion: 'sad', count: 3 },
      { emotion: 'tired', count: 2 },
    ])
  })

  it('lists fewer than five when fewer were named', () => {
    expect(week([moodEntryAt(NOW, ['calm'])]).topEmotions).toHaveLength(1)
  })

  it('counts only what is in the range', () => {
    const summary = week([moodEntryAt(NOW, ['calm']), moodEntryAt(START_7 - 1, ['calm', 'sad'])])

    expect(summary.topEmotions).toEqual([{ emotion: 'calm', count: 1 }])
  })
})
