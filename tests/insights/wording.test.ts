import { describe, expect, it } from 'vitest'

import type { Summary } from '@/insights/summary'
import {
  describeAverageBelief,
  describeBeliefCount,
  describeBeliefPair,
  describeSummary,
  formatBelief,
} from '@/insights/wording'

describe('formatBelief', () => {
  it('shows a whole number without a decimal', () => {
    expect(formatBelief(4)).toBe('4')
    expect(formatBelief(0)).toBe('0')
    expect(formatBelief(10)).toBe('10')
  })

  it('shows one decimal otherwise', () => {
    expect(formatBelief(7.5)).toBe('7.5')
    expect(formatBelief(3.3)).toBe('3.3')
  })
})

describe('describeBeliefCount', () => {
  it('says how many thoughts fall in the range, in the singular for one', () => {
    expect(describeBeliefCount(1, 7)).toBe('1 thought in the last 7 days')
    expect(describeBeliefCount(3, 7)).toBe('3 thoughts in the last 7 days')
    expect(describeBeliefCount(12, 30)).toBe('12 thoughts in the last 30 days')
  })

  it('says calmly that there are none', () => {
    expect(describeBeliefCount(0, 7)).toBe('None in the last 7 days.')
    expect(describeBeliefCount(0, 30)).toBe('None in the last 30 days.')
  })
})

describe('describing beliefs', () => {
  it('reads like "Average belief: from 7.5 to 4"', () => {
    expect(describeAverageBelief({ before: 7.5, after: 4 })).toBe('Average belief: from 7.5 to 4')
  })

  it('reads like "from 8 to 4" for one thought', () => {
    expect(describeBeliefPair({ before: 8, after: 4 })).toBe('from 8 to 4')
  })

  it('reads the same plain way when belief went up or did not change', () => {
    expect(describeBeliefPair({ before: 4, after: 6 })).toBe('from 4 to 6')
    expect(describeBeliefPair({ before: 5, after: 5 })).toBe('from 5 to 5')
    expect(describeAverageBelief({ before: 3, after: 5.5 })).toBe('Average belief: from 3 to 5.5')
  })

  it('judges nothing', () => {
    const text = [
      describeBeliefPair({ before: 4, after: 9 }),
      describeAverageBelief({ before: 4, after: 9 }),
      describeBeliefCount(2, 7),
    ].join(' ')

    expect(text).not.toMatch(/better|worse|improv|progress|great|bad|good|drop|rose|fell/i)
  })
})

function summary(moodEntries: number, thoughtRecords: number): Summary {
  return { moodEntries, thoughtRecords, topEmotions: [] }
}

describe('describeSummary', () => {
  it('reads like "Last 7 days: 5 mood entries, 3 thought records"', () => {
    expect(describeSummary(7, summary(5, 3))).toBe('Last 7 days: 5 mood entries, 3 thought records')
  })

  it('names the range', () => {
    expect(describeSummary(30, summary(12, 8))).toBe(
      'Last 30 days: 12 mood entries, 8 thought records',
    )
  })

  it('uses the singular for exactly one', () => {
    expect(describeSummary(7, summary(1, 1))).toBe('Last 7 days: 1 mood entry, 1 thought record')
    expect(describeSummary(7, summary(1, 4))).toBe('Last 7 days: 1 mood entry, 4 thought records')
    expect(describeSummary(7, summary(4, 1))).toBe('Last 7 days: 4 mood entries, 1 thought record')
  })

  it('says "no" for a kind with none, instead of a bare 0', () => {
    expect(describeSummary(7, summary(0, 3))).toBe(
      'Last 7 days: no mood entries, 3 thought records',
    )
    expect(describeSummary(7, summary(5, 0))).toBe(
      'Last 7 days: 5 mood entries, no thought records',
    )
  })

  it('says "no" for both when there is nothing', () => {
    expect(describeSummary(7, summary(0, 0))).toBe(
      'Last 7 days: no mood entries, no thought records',
    )
  })
})
