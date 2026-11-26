import type { ThoughtRecord } from '@/thoughts/types'

import { rangeStart } from './range'

/** From this many thoughts on, a block shows an average instead of listing each thought. */
export const AVERAGE_FROM = 3

/** How strongly one thought was believed before, and after a challenge or a test. */
export type BeliefPair = {
  readonly id: number
  readonly thought: string
  readonly before: number
  readonly after: number
  /** When the challenge was saved or the result logged, or the time of the thought if undated. */
  readonly at: number
}

export type BeliefChange = {
  readonly count: number
  /** Newest first. */
  readonly pairs: readonly BeliefPair[]
  /** The average before and after, to one decimal. Only from AVERAGE_FROM thoughts on. */
  readonly average: { readonly before: number; readonly after: number } | null
}

export type BeliefChanges = {
  readonly challenged: BeliefChange
  readonly tested: BeliefChange
}

type BeliefChangeInput = {
  readonly records: readonly ThoughtRecord[]
  readonly days: number
  readonly now: number
}

function averageOf(values: readonly number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length

  return Math.round(mean * 10) / 10
}

function toChange(pairs: readonly BeliefPair[]): BeliefChange {
  // The same moment is ordered by id, so the order never jumps around.
  const sorted = [...pairs].sort((a, b) => b.at - a.at || b.id - a.id)

  return {
    count: sorted.length,
    pairs: sorted,
    average:
      sorted.length >= AVERAGE_FROM
        ? {
            before: averageOf(sorted.map(({ before }) => before)),
            after: averageOf(sorted.map(({ after }) => after)),
          }
        : null,
  }
}

/**
 * How belief changed for the thoughts challenged, and for the thoughts tested, in the last `days`
 * days. The two methods are kept apart, and a record that was both appears in both. A challenge
 * is placed by the day it was saved, a test by the day its result was logged, and a part saved
 * before dates existed by the time of the thought itself. A test that is only planned counts
 * for nothing.
 */
export function beliefChanges({ records, days, now }: BeliefChangeInput): BeliefChanges {
  const start = rangeStart(now, days)

  const challenged = records.flatMap((record): BeliefPair[] => {
    const challenge = record.challenge

    if (challenge === undefined) {
      return []
    }

    const at = challenge.challengedAt ?? record.createdAt

    return at >= start
      ? [
          {
            id: record.id,
            thought: record.thought,
            before: record.belief,
            after: challenge.belief,
            at,
          },
        ]
      : []
  })

  const tested = records.flatMap((record): BeliefPair[] => {
    const test = record.test

    if (test?.status !== 'done') {
      return []
    }

    const at = test.testedAt ?? record.createdAt

    return at >= start
      ? [{ id: record.id, thought: record.thought, before: record.belief, after: test.belief, at }]
      : []
  })

  return { challenged: toChange(challenged), tested: toChange(tested) }
}
