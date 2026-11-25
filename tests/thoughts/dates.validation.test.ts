import { describe, expect, it } from 'vitest'

import { InvalidThoughtRecordError } from '@/thoughts/errors'
import { isThoughtRecord, validateChallenge, validateTest } from '@/thoughts/validation'
import {
  currentChallenge,
  currentDoneTest,
  currentPlannedTest,
  currentThought,
} from '@tests/helpers/thoughts'

const MOMENT = 1_800_000_000_000

function fieldOfError(check: () => unknown): string | undefined {
  try {
    check()
  } catch (error) {
    return error instanceof InvalidThoughtRecordError ? error.field : 'unexpected'
  }
  return undefined
}

describe('the date of a challenge', () => {
  it('is kept when it is a real moment', () => {
    expect(validateChallenge(currentChallenge({ challengedAt: MOMENT }))).toMatchObject({
      challengedAt: MOMENT,
    })
  })

  it('may be absent, as in a challenge saved before dates existed', () => {
    expect(validateChallenge(currentChallenge())).not.toHaveProperty('challengedAt')
  })

  it.each(['yesterday', 0, -5, 1.5, Number.NaN, Number.POSITIVE_INFINITY, null, true])(
    'refuses %j as a date',
    (value) => {
      expect(fieldOfError(() => validateChallenge(currentChallenge({ challengedAt: value })))).toBe(
        'challengedAt',
      )
    },
  )
})

describe('the date of a test', () => {
  it('is kept on a logged result when it is a real moment', () => {
    expect(validateTest(currentDoneTest({ testedAt: MOMENT }))).toMatchObject({
      status: 'done',
      testedAt: MOMENT,
    })
  })

  it('may be absent on a logged result, as in one logged before dates existed', () => {
    expect(validateTest(currentDoneTest())).not.toHaveProperty('testedAt')
  })

  it.each(['yesterday', 0, -5, 1.5, Number.NaN, null])('refuses %j as a date', (value) => {
    expect(fieldOfError(() => validateTest(currentDoneTest({ testedAt: value })))).toBe('testedAt')
  })

  it('leaves a planned test without a date, whatever it is given', () => {
    expect(validateTest(currentPlannedTest({ testedAt: MOMENT }))).not.toHaveProperty('testedAt')
  })
})

describe('a stored record with dates', () => {
  it('is valid with dates, and without them', () => {
    expect(
      isThoughtRecord(
        currentThought(1, {
          challenge: currentChallenge({ challengedAt: MOMENT }),
          test: currentDoneTest({ testedAt: MOMENT }),
        }),
      ),
    ).toBe(true)
    expect(
      isThoughtRecord(
        currentThought(1, { challenge: currentChallenge(), test: currentDoneTest() }),
      ),
    ).toBe(true)
  })

  it.each([
    ['a bad challenge date', { challenge: currentChallenge({ challengedAt: 'soon' }) }],
    ['a bad test date', { test: currentDoneTest({ testedAt: -1 }) }],
  ])('is damaged with %s, like any other bad part', (_label, extra) => {
    expect(isThoughtRecord(currentThought(1, extra))).toBe(false)
  })
})
