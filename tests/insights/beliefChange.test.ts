import { describe, expect, it } from 'vitest'

import { AVERAGE_FROM, beliefChanges, type BeliefChanges } from '@/insights/beliefChange'
import { rangeStart } from '@/insights/range'
import type { ThoughtRecord } from '@/thoughts/types'
import {
  challengeOf,
  doneTestOf,
  localMoment,
  plannedTest,
  thoughtWith,
} from '@tests/helpers/insights'

const NOW = localMoment(2026, 6, 10, 15, 30)
const START_7 = rangeStart(NOW, 7)
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

function changes(records: readonly ThoughtRecord[], days = 7): BeliefChanges {
  return beliefChanges({ records, days, now: NOW })
}

describe('beliefChanges: challenged and tested thoughts', () => {
  it('finds nothing when there are no records', () => {
    expect(changes([])).toEqual({
      challenged: { count: 0, pairs: [], average: null },
      tested: { count: 0, pairs: [], average: null },
    })
  })

  it('finds nothing in thoughts that were never challenged or tested', () => {
    const summary = changes([thoughtWith(NOW - HOUR), thoughtWith(NOW - 2 * HOUR)])

    expect(summary.challenged.count).toBe(0)
    expect(summary.tested.count).toBe(0)
  })

  it('compares the record’s own belief with the belief after the challenge', () => {
    const summary = changes([
      thoughtWith(NOW - HOUR, { belief: 8, challenge: challengeOf(4, NOW) }),
    ])

    expect(summary.challenged.pairs).toEqual([
      expect.objectContaining({ before: 8, after: 4, thought: 'a thought' }),
    ])
  })

  it('compares the record’s own belief with the belief after the test', () => {
    const summary = changes([thoughtWith(NOW - HOUR, { belief: 9, test: doneTestOf(3, NOW) })])

    expect(summary.tested.pairs).toEqual([expect.objectContaining({ before: 9, after: 3 })])
  })

  it('keeps challenged and tested apart, and lets a record that was both appear in both', () => {
    const both = thoughtWith(
      NOW - HOUR,
      { belief: 8, challenge: challengeOf(5, NOW), test: doneTestOf(2, NOW) },
      1,
    )
    const onlyChallenged = thoughtWith(NOW - 2 * HOUR, { challenge: challengeOf(6, NOW) }, 2)
    const onlyTested = thoughtWith(NOW - 3 * HOUR, { test: doneTestOf(1, NOW) }, 3)

    const summary = changes([both, onlyChallenged, onlyTested])

    expect(summary.challenged.pairs.map(({ id }) => id).sort()).toEqual([1, 2])
    expect(summary.tested.pairs.map(({ id }) => id).sort()).toEqual([1, 3])
  })

  it('does not count a test that is only planned', () => {
    const summary = changes([thoughtWith(NOW - HOUR, { test: plannedTest })])

    expect(summary.tested.count).toBe(0)
  })

  it('counts a logged test even when the thought was never challenged', () => {
    const summary = changes([thoughtWith(NOW - HOUR, { test: doneTestOf(2, NOW) })])

    expect(summary.tested.count).toBe(1)
    expect(summary.challenged.count).toBe(0)
  })

  it('carries the text of the thought', () => {
    const summary = changes([
      thoughtWith(NOW - HOUR, { thought: 'I will fail the exam', challenge: challengeOf(3, NOW) }),
    ])

    expect(summary.challenged.pairs[0]?.thought).toBe('I will fail the exam')
  })
})

describe('beliefChanges: placing a challenge or a test in the range', () => {
  it('places a challenge by the day it was saved, so an old thought challenged today counts', () => {
    const old = thoughtWith(NOW - 40 * DAY, { challenge: challengeOf(3, NOW) })

    expect(changes([old]).challenged.count).toBe(1)
  })

  it('leaves out a recent thought whose challenge is older than the range', () => {
    const recent = thoughtWith(NOW - HOUR, { challenge: challengeOf(3, NOW - 20 * DAY) })

    expect(changes([recent], 7).challenged.count).toBe(0)
    expect(changes([recent], 30).challenged.count).toBe(1)
  })

  it('places a test by the day its result was logged', () => {
    const old = thoughtWith(NOW - 40 * DAY, { test: doneTestOf(3, NOW) })
    const recent = thoughtWith(NOW - HOUR, { test: doneTestOf(3, NOW - 20 * DAY) }, 2)

    expect(changes([old]).tested.count).toBe(1)
    expect(changes([recent], 7).tested.count).toBe(0)
    expect(changes([recent], 30).tested.count).toBe(1)
  })

  it('falls back to the time of the thought for a challenge saved before dates existed', () => {
    const recent = thoughtWith(NOW - 2 * DAY, { challenge: challengeOf(3) }, 1)
    const old = thoughtWith(NOW - 20 * DAY, { challenge: challengeOf(3) }, 2)

    expect(changes([recent, old], 7).challenged.pairs.map(({ id }) => id)).toEqual([1])
    expect(changes([recent, old], 30).challenged.count).toBe(2)
  })

  it('falls back to the time of the thought for a result logged before dates existed', () => {
    const recent = thoughtWith(NOW - 2 * DAY, { test: doneTestOf(3) }, 1)
    const old = thoughtWith(NOW - 20 * DAY, { test: doneTestOf(3) }, 2)

    expect(changes([recent, old], 7).tested.pairs.map(({ id }) => id)).toEqual([1])
    expect(changes([recent, old], 30).tested.count).toBe(2)
  })

  it('includes the first moment of the range and leaves out the moment before it', () => {
    const inside = thoughtWith(1, { challenge: challengeOf(3, START_7) }, 1)
    const outside = thoughtWith(2, { challenge: challengeOf(3, START_7 - 1) }, 2)

    expect(changes([inside, outside]).challenged.pairs.map(({ id }) => id)).toEqual([1])
  })

  it('uses the same range as the rest of the summary: 30 days reaches back further than 7', () => {
    const tenDaysAgo = thoughtWith(NOW - 10 * DAY, {
      challenge: challengeOf(3, NOW - 10 * DAY),
      test: doneTestOf(3, NOW - 10 * DAY),
    })

    expect(changes([tenDaysAgo], 7)).toMatchObject({
      challenged: { count: 0 },
      tested: { count: 0 },
    })
    expect(changes([tenDaysAgo], 30)).toMatchObject({
      challenged: { count: 1 },
      tested: { count: 1 },
    })
  })
})

describe('beliefChanges: an average, or each thought', () => {
  function challengedWith(afters: readonly number[], before = 8): ThoughtRecord[] {
    return afters.map((after, index) =>
      thoughtWith(
        NOW - (index + 1) * HOUR,
        { belief: before, challenge: challengeOf(after, NOW) },
        index + 1,
      ),
    )
  }

  it('averages from three thoughts on', () => {
    expect(AVERAGE_FROM).toBe(3)
    expect(changes(challengedWith([4, 4, 4])).challenged.average).toEqual({ before: 8, after: 4 })
  })

  it('has no average for two thoughts, or for one', () => {
    expect(changes(challengedWith([4, 4])).challenged.average).toBeNull()
    expect(changes(challengedWith([4])).challenged.average).toBeNull()
    expect(changes(challengedWith([4, 4])).challenged.count).toBe(2)
  })

  it('still lists every thought, whatever the count', () => {
    expect(changes(challengedWith([4, 4, 4, 4])).challenged.pairs).toHaveLength(4)
  })

  it('rounds an average to one decimal, with .25 going up', () => {
    const records = [
      thoughtWith(NOW - HOUR, { belief: 8, challenge: challengeOf(4, NOW) }, 1),
      thoughtWith(NOW - 2 * HOUR, { belief: 7, challenge: challengeOf(3, NOW) }, 2),
      thoughtWith(NOW - 3 * HOUR, { belief: 7, challenge: challengeOf(3, NOW) }, 3),
      thoughtWith(NOW - 4 * HOUR, { belief: 7, challenge: challengeOf(3, NOW) }, 4),
    ]

    expect(changes(records).challenged.average).toEqual({ before: 7.3, after: 3.3 })
  })

  it('rounds a repeating average, such as a third', () => {
    const records = [
      thoughtWith(NOW - HOUR, { belief: 1, challenge: challengeOf(1, NOW) }, 1),
      thoughtWith(NOW - 2 * HOUR, { belief: 1, challenge: challengeOf(1, NOW) }, 2),
      thoughtWith(NOW - 3 * HOUR, { belief: 2, challenge: challengeOf(2, NOW) }, 3),
    ]

    expect(changes(records).challenged.average).toEqual({ before: 1.3, after: 1.3 })
  })

  it('averages a test the same way', () => {
    const records = [8, 8, 8].map((belief, index) =>
      thoughtWith(NOW - (index + 1) * HOUR, { belief, test: doneTestOf(2, NOW) }, index + 1),
    )

    expect(changes(records).tested.average).toEqual({ before: 8, after: 2 })
  })

  it('treats a belief that went up like one that dropped', () => {
    const records = [4, 4, 4].map((belief, index) =>
      thoughtWith(NOW - (index + 1) * HOUR, { belief, challenge: challengeOf(7, NOW) }, index + 1),
    )

    expect(changes(records).challenged.average).toEqual({ before: 4, after: 7 })
    expect(changes(records.slice(0, 1)).challenged.pairs[0]).toMatchObject({ before: 4, after: 7 })
  })

  it('treats a belief that did not change as any other', () => {
    const records = [thoughtWith(NOW - HOUR, { belief: 5, challenge: challengeOf(5, NOW) })]

    expect(changes(records).challenged.pairs[0]).toMatchObject({ before: 5, after: 5 })
  })
})

describe('beliefChanges: the order of the thoughts', () => {
  it('lists the newest first, by the date of the challenge', () => {
    const older = thoughtWith(NOW - HOUR, { challenge: challengeOf(3, NOW - 3 * DAY) }, 1)
    const newer = thoughtWith(NOW - 2 * HOUR, { challenge: challengeOf(3, NOW - DAY) }, 2)

    expect(changes([older, newer]).challenged.pairs.map(({ id }) => id)).toEqual([2, 1])
  })

  it('puts a higher id first when two were done at the same moment, so the order is stable', () => {
    const first = thoughtWith(NOW - HOUR, { challenge: challengeOf(3, NOW) }, 1)
    const second = thoughtWith(NOW - 2 * HOUR, { challenge: challengeOf(3, NOW) }, 2)

    expect(changes([first, second]).challenged.pairs.map(({ id }) => id)).toEqual([2, 1])
    expect(changes([second, first]).challenged.pairs.map(({ id }) => id)).toEqual([2, 1])
  })

  it('does not change the records it is given', () => {
    const records = [
      thoughtWith(NOW - HOUR, { challenge: challengeOf(3, NOW - 3 * DAY) }, 1),
      thoughtWith(NOW - 2 * HOUR, { challenge: challengeOf(3, NOW - DAY) }, 2),
    ]
    const copy = [...records]

    changes(records)

    expect(records).toEqual(copy)
  })
})
